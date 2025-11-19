import db from "../models/db.js";
import { analyzeProductReviews } from "../services/absaService.js"; // Python 서버 전체 파이프라인 호출

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

/**
 * 리뷰 데이터 내보내기 (CSV)
 */
export const exportReviews = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "인증 정보가 필요합니다." });
    }

    const { where, params } = buildReviewFilter(req.query, userId);
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `
      SELECT 
        r.review_id,
        p.product_name,
        r.review_text,
        r.rating,
        COALESCE(ra.sentiment, 'neutral') AS sentiment,
        r.review_date,
        r.source
      ${baseJoinFragment}
      ${whereSql}
      ORDER BY r.review_date DESC
      `,
      params
    );

    const format = req.query.format === "excel" ? "excel" : "csv";
    const filename = `reviews_${new Date().getTime()}.${format === "excel" ? "xlsx" : "csv"}`;

    const header = [
      "review_id",
      "product_name",
      "review_text",
      "rating",
      "sentiment",
      "review_date",
      "source",
    ];

    const csvBody = rows
      .map((row) =>
        [
          escapeCsv(row.review_id),
          escapeCsv(row.product_name),
          escapeCsv(row.review_text),
          escapeCsv(row.rating),
          escapeCsv(row.sentiment),
          escapeCsv(row.review_date),
          escapeCsv(row.source),
        ].join(",")
      )
      .join("\n");

    const csvContent = "\uFEFF" + header.join(",") + "\n" + csvBody;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (err) {
    console.error("리뷰 내보내기 오류:", err);
    res.status(500).json({ message: "리뷰 데이터를 내보내는 중 오류가 발생했습니다." });
  }
};

/**
 * 리뷰 분석 컨트롤러
 * ------------------------------------------------------------
 * Python 서버에서 전체 분석 파이프라인을 트리거인자로 호출
 * - 리뷰 분석 (FastAPI)
 * - tb_reviewAnalysis에 결과 저장
 * - tb_productDashboard 업데이트 (이후 호출)
 * - 대시보드 생성
 */
export const analyzeReviews = async (req, res) => {
  const productId = parsePositiveInt(req.params.product_id, null);
  const { domain } = req.query; // 선택적 파라미터

  try {
    if (!productId) {
      return res.status(400).json({ success: false, error: "유효한 product_id가 필요합니다." });
    }

    console.log(`🚀 ${productId}번 제품 리뷰 분석 시작 (도메인: ${domain || "자동"})`);

    // 1️⃣ Python 서버에서 전체 파이프라인 호출
    const result = await analyzeProductReviews(productId, domain);

    console.log(`✅ 분석 완료:`, result);

    // 2️⃣ Python 서버에서 이미 모든 처리가 완료되었으므로 결과만 반환
    res.json({
      success: true,
      product_id: result.product_id || productId,
      review_count: result.review_count || 0,
      analyzed_count: result.analyzed_count || 0,
      inserted_count: result.inserted_count || 0,
      wordcloud_path: result.wordcloud_path || null,
      message: result.message || "리뷰 분석 및 대시보드 갱신 완료",
    });
  } catch (err) {
    console.error("🚨 리뷰 분석 오류:", err);
    
    // Python 서버에서 내려준 에러 응답 처리
    if (err.response) {
      const status = err.response.status;
      const errorMessage = err.response.data?.detail || err.response.data?.message || err.message;
      return res.status(status).json({ 
        success: false,
        error: errorMessage 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

