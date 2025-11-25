import db from "../models/db.js";
import { analyzeProductReviews } from "../services/absaService.js"; // Python 서버 전체 파이프라인 호출
import { processReviewsInBackground } from "../utils/backgroundProcessor.js"; // 백그라운드 처리
import multer from "multer";
import path from "path";
import { Readable } from "stream";
import XLSX from "xlsx";
import csv from "csv-parser";

// 숫자 파싱 유틸
const parsePositiveInt = (value, defaultValue) => {
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) && num > 0 ? num : defaultValue;
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes("\"") || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const buildReviewFilter = (query, userId) => {
  const where = ["p.user_id = ?"];
  const params = [userId];

  if (query.product_id) {
    const productId = Number.parseInt(query.product_id, 10);
    if (!Number.isNaN(productId)) {
      where.push("r.product_id = ?");
      params.push(productId);
    }
  }

  if (query.rating) {
    const rating = Number.parseFloat(query.rating);
    if (!Number.isNaN(rating)) {
      where.push("r.rating = ?");
      params.push(rating);
    }
  }

  if (query.sentiment) {
    where.push("ra.sentiment = ?");
    params.push(query.sentiment);
  }

  if (query.search) {
    where.push("r.review_text LIKE ?");
    params.push(`%${query.search}%`);
  }

  if (query.start_date) {
    where.push("DATE(r.review_date) >= ?");
    params.push(query.start_date);
  }

  if (query.end_date) {
    where.push("DATE(r.review_date) <= ?");
    params.push(query.end_date);
  }

  return { where, params };
};

// 공통으로 사용할 JOIN/집계 쿼리 조각
const sentimentJoinFragment = `
  LEFT JOIN (
    SELECT review_id, MAX(sentiment) AS sentiment
    FROM tb_reviewAnalysis
    GROUP BY review_id
  ) ra ON ra.review_id = r.review_id
`;
const baseJoinFragment = `
  FROM tb_review r
  JOIN tb_product p ON p.product_id = r.product_id
  ${sentimentJoinFragment}
`;

/**
 * 리뷰 목록 조회 (필터/페이징)
 */
export const getReviews = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "인증 정보가 필요합니다." });
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);
    const offset = (page - 1) * limit;

    const { where, params } = buildReviewFilter(req.query, userId);
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // 허용 정렬 필드만 사용
    const sortField = (() => {
      switch (req.query.sort_field) {
        case "rating":
          return "r.rating";
        case "sentiment":
          return "ra.sentiment";
        case "product_name":
          return "p.product_name";
        default:
          return "r.review_date";
      }
    })();
    const sortDirection = req.query.sort_direction?.toLowerCase() === "asc" ? "ASC" : "DESC";

    // 총 개수
    const [[{ total }]] = await db.query(
      `
      SELECT COUNT(*) AS total
      ${baseJoinFragment}
      ${whereSql}
      `,
      params
    );

    // 목록
    const [rows] = await db.query(
      `
      SELECT 
        r.review_id,
        r.product_id,
        p.product_name,
        r.review_text,
        r.rating,
        r.review_date,
        r.source,
        COALESCE(ra.sentiment, 'neutral') AS sentiment
      ${baseJoinFragment}
      ${whereSql}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return res.json({
      reviews: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      total,
    });
  } catch (err) {
    console.error("리뷰 목록 조회 오류:", err);
    res.status(500).json({ message: "리뷰 목록 조회 중 오류가 발생했습니다." });
  }
};

/**
 * 개별 리뷰 삭제
 */
export const deleteReview = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "인증 정보가 필요합니다." });
    }

    const reviewId = Number.parseInt(req.params.id, 10);
    if (!reviewId) {
      return res.status(400).json({ message: "유효한 리뷰 ID를 입력하세요." });
    }

    const [[found]] = await db.query(
      `
      SELECT r.review_id
      FROM tb_review r
      JOIN tb_product p ON p.product_id = r.product_id
      WHERE r.review_id = ? AND p.user_id = ?
      `,
      [reviewId, userId]
    );

    if (!found) {
      return res.status(404).json({ message: "삭제할 리뷰를 찾을 수 없습니다." });
    }

    await db.query("DELETE FROM tb_review WHERE review_id = ?", [reviewId]);
    return res.json({ success: true, message: "리뷰가 삭제되었습니다." });
  } catch (err) {
    console.error("리뷰 삭제 오류:", err);
    res.status(500).json({ message: "리뷰 삭제 중 오류가 발생했습니다." });
  }
};

/**
 * 복수 리뷰 삭제
 */
export const deleteReviewsBatch = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "인증 정보가 필요합니다." });
    }

    const reviewIds = Array.isArray(req.body?.review_ids)
      ? req.body.review_ids.map((id) => Number.parseInt(id, 10)).filter((id) => Number.isInteger(id))
      : [];

    if (!reviewIds.length) {
      return res.status(400).json({ message: "삭제할 리뷰 ID를 전달하세요." });
    }

    const placeholders = reviewIds.map(() => "?").join(",");
    const [ownReviews] = await db.query(
      `
      SELECT r.review_id
      FROM tb_review r
      JOIN tb_product p ON p.product_id = r.product_id
      WHERE r.review_id IN (${placeholders}) AND p.user_id = ?
      `,
      [...reviewIds, userId]
    );

    if (!ownReviews.length) {
      return res.status(404).json({ message: "삭제할 리뷰를 찾을 수 없습니다." });
    }

    const deletableIds = ownReviews.map((r) => r.review_id);
    const deletePlaceholders = deletableIds.map(() => "?").join(",");
    await db.query(`DELETE FROM tb_review WHERE review_id IN (${deletePlaceholders})`, deletableIds);

    return res.json({
      success: true,
      deleted: deletableIds.length,
      message: `${deletableIds.length}개의 리뷰가 삭제되었습니다.`,
    });
  } catch (err) {
    console.error("리뷰 일괄 삭제 오류:", err);
    res.status(500).json({ message: "리뷰 일괄 삭제 중 오류가 발생했습니다." });
  }
};

// ==============================
// 7. 리뷰 파일 업로드 및 삽입
// ==============================
// Multer 설정 (메모리 스토리지)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('CSV 또는 Excel 파일만 업로드할 수 있습니다.'), false);
    }
  }
});

// CSV 파일 파싱
const parseCSV = async (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer);

    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Excel 파일 파싱
const parseExcel = (buffer) => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    return jsonData;
  } catch (error) {
    throw new Error(`Excel 파일 파싱 오류: ${error.message}`);
  }
};

// 날짜 파싱 (다양한 형식 지원)
const parseDate = (dateValue) => {
  if (!dateValue) return null;

  // 이미 Date 객체인 경우
  if (dateValue instanceof Date) {
    return dateValue;
  }

  // 문자열인 경우
  if (typeof dateValue === 'string') {
    // ISO 형식
    if (dateValue.includes('T') || dateValue.includes('-')) {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) return date;
    }

    // YYYY-MM-DD 형식
    const dateMatch = dateValue.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (dateMatch) {
      const date = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
      if (!isNaN(date.getTime())) return date;
    }
  }

  // 숫자 타임스탬프인 경우
  if (typeof dateValue === 'number') {
    // Excel 날짜 형식 (1900-01-01 기준 일수) 또는 Unix 타임스탬프
    if (dateValue > 25569) { // Excel 날짜로 보이는 경우
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) return date;
    } else {
      // Unix 타임스탬프 (초 단위)
      const date = new Date(dateValue * 1000);
      if (!isNaN(date.getTime())) return date;
    }
  }

  return null;
};

// 스팀 리뷰 평점 계산 (voted_up + weighted_vote_score)
const calculateSteamRating = (votedUp, weightedScore) => {
  const voted_up = votedUp === true || votedUp === 'True' || votedUp === 'true' || votedUp === 1 || votedUp === '1';
  const score = parseFloat(weightedScore) || 0.5;

  if (voted_up) {
    return 3.0 + (score * 2.0);   // 긍정 리뷰 → 3.0~5.0점
  } else {
    return score * 2.0;           // 부정 리뷰 → 0.0~2.0점
  }
};

// 중복 리뷰 체크
const checkDuplicateReview = async (productId, reviewText, reviewDate) => {
  try {
    const [rows] = await db.query(
      `SELECT review_id FROM tb_review 
       WHERE product_id = ? AND review_text = ? AND DATE(review_date) = DATE(?)`,
      [productId, reviewText, reviewDate]
    );
    return rows.length > 0;
  } catch (error) {
    console.error("❌ 중복 체크 오류:", error);
    return false;
  }
};

// 리뷰 업로드 메인 함수 (Task 기반 SSE)
export const uploadReviews = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "인증된 사용자 정보가 없습니다." });
    }

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    // 제품 소유권 확인
    const [productRows] = await db.query(
      "SELECT product_id, user_id FROM tb_product WHERE product_id = ?",
      [productId]
    );

    if (productRows.length === 0) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
    }

    if (productRows[0].user_id !== userId) {
      return res.status(403).json({ message: "해당 제품에 대한 권한이 없습니다." });
    }

    // 파일 확인
    const files = req.files || [];
    const mappingsRaw = req.body.mappings || [];
    const mappings = Array.isArray(mappingsRaw)
      ? mappingsRaw.map(m => typeof m === 'string' ? JSON.parse(m) : m)
      : [typeof mappingsRaw === 'string' ? JSON.parse(mappingsRaw) : mappingsRaw];

    if (files.length === 0) {
      return res.status(400).json({ message: "업로드할 파일이 없습니다." });
    }

    if (files.length !== mappings.length) {
      return res.status(400).json({
        message: `파일과 매핑 정보의 개수가 일치하지 않습니다. (파일: ${files.length}, 매핑: ${mappings.length})`
      });
    }

    // Task 생성
    const { createTask, scheduleTaskCleanup } = await import('../utils/taskManager.js');
    const taskId = createTask(productId, userId);

    // 즉시 taskId 반환
    res.json({
      success: true,
      taskId: taskId,
      data: {
        message: "업로드가 시작되었습니다",
        productId: productId,
        fileCount: files.length
      }
    });

    // 백그라운드에서 파일 처리 및 분석 실행
    processReviewsInBackground(taskId, productId, files, mappings).catch(err => {
      console.error(`❌ 백그라운드 처리 오류 (Task: ${taskId}):`, err);
    });

    // Task 자동 정리 스케줄 (30분 후)
    scheduleTaskCleanup(taskId);

  } catch (err) {
    console.error("❌ 리뷰 업로드 오류:", err);
    res.status(500).json({
      message: "리뷰 업로드 중 서버 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Multer 미들웨어 export
export { upload };
