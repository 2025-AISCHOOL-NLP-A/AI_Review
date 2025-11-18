import db from "../models/db.js";
import { getProductDashboardData as getProductDashboard } from "./dashboardController.js";
import { analyzeReviews } from "./reviewController.js"; // ✅ 실제 리뷰 분석 함수 import
import { analyzeProductReviews } from "../services/absaService.js"; // Python 서버 직접 호출
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import XLSX from "xlsx";
import csv from "csv-parser";
import { Readable } from "stream";

dotenv.config();

// ES 모듈에서 __dirname 사용을 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// 1. 제품 목록 조회 (사용자별)
// ==============================
export const productList = async (req, res) => {
  try {
    // 사용자 인증 확인
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "인증된 사용자 정보가 없습니다." });
    }

    // 해당 사용자의 제품만 조회 (재시도 로직 포함)
    let rows;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        [rows] = await db.query(`
          SELECT 
            p.product_id,
            p.product_name,
            p.brand,
            p.registered_date,
            p.category_id,
            p.user_id
          FROM tb_product p
          WHERE p.user_id = ?
          ORDER BY p.product_id DESC
        `, [userId]);
        break; // 성공 시 루프 종료
      } catch (queryErr) {
        retryCount++;
        if (queryErr.code === 'ECONNRESET' || queryErr.code === 'PROTOCOL_CONNECTION_LOST') {
          if (retryCount < maxRetries) {
            console.log(`🔄 DB 연결 오류 발생. 재시도 ${retryCount}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // 지수 백오프
            continue;
          }
        }
        throw queryErr; // 다른 에러이거나 재시도 횟수 초과 시 throw
      }
    }

    res.json({
      message: "제품 목록 조회 성공",
      products: rows
    });
  } catch (err) {
    console.error("❌ 제품 목록 조회 오류:", err);
    
    // DB 연결 관련 에러인 경우
    if (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(503).json({ 
        message: "데이터베이스 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요." 
      });
    }
    
    res.status(500).json({ 
      message: "제품 목록 조회 중 서버 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ==============================
// 📊 제품 대시보드 조회
// ==============================
// export const dashboard = (req, res) => getProductDashboard(req, res);

// DB 쿼리 재시도 헬퍼 함수
const executeQueryWithRetry = async (queryFn, maxRetries = 3) => {
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      return await queryFn();
    } catch (queryErr) {
      retryCount++;
      if ((queryErr.code === 'ECONNRESET' || queryErr.code === 'PROTOCOL_CONNECTION_LOST') && retryCount < maxRetries) {
        console.log(`🔄 DB 연결 오류 발생. 재시도 ${retryCount}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // 지수 백오프
        continue;
      }
      throw queryErr; // 다른 에러이거나 재시도 횟수 초과 시 throw
    }
  }
};

export const dashboard = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    // 1. 대시보드 테이블 전체 조회 (재시도 로직 포함)
    let dashboardData;
    try {
      const result = await executeQueryWithRetry(async () => {
        const [[data]] = await db.query(
          `SELECT 
            product_id,
            total_reviews,
            sentiment_distribution,
            product_score,
            date_sentimental,
            keyword_summary,
            heatmap,
            wordcloud_path,
            insight_id,
            updated_at
          FROM tb_productDashboard
          WHERE product_id = ?`,
          [productId]
        );
        return data;
      });
      dashboardData = result;
    } catch (queryErr) {
      if (queryErr.code === 'ECONNRESET' || queryErr.code === 'PROTOCOL_CONNECTION_LOST') {
        return res.status(503).json({ 
          message: "데이터베이스 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요." 
        });
      }
      throw queryErr;
    }
    
    if (!dashboardData) {
      return res.status(404).json({ message: "대시보드 데이터를 찾을 수 없습니다." });
    }

    // 2. 워드클라우드 이미지 처리
    let wordcloudImage = null;
    if (dashboardData.wordcloud_path) {
      try {
        // model_server/static 경로 구성
        const staticPath = path.join(__dirname, "../../../model_server/static");
        const imagePath = path.join(staticPath, dashboardData.wordcloud_path.replace("/static/", ""));
        
        // 파일 존재 여부 확인
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          wordcloudImage = `data:image/png;base64,${imageBuffer.toString("base64")}`;
        } else {
          wordcloudImage = null;
        }
      } catch (err) {
        wordcloudImage = null;
      }
    }

    // 3. 인사이트 조회 (재시도 로직 포함)
    let insight = null;
    if (dashboardData.insight_id) {
      try {
        const result = await executeQueryWithRetry(async () => {
          const [[data]] = await db.query(
            `SELECT 
              insight_id,
              product_id,
              user_id,
              pos_top_keywords,
              neg_top_keywords,
              insight_summary,
              improvement_suggestion,
              created_at,
              content
            FROM tb_productInsight
            WHERE insight_id = ?`,
            [dashboardData.insight_id]
          );
          return data;
        });
        insight = result || null;
      } catch (queryErr) {
        console.error("⚠️ 인사이트 조회 실패 (계속 진행):", queryErr.message);
        insight = null; // 인사이트 조회 실패해도 계속 진행
      }
    }

    // 4. 최신 리뷰 10개 조회 (재시도 로직 포함)
    let recentReviews = [];
    try {
      const result = await executeQueryWithRetry(async () => {
        const [data] = await db.query(
          `SELECT 
            review_id,
            product_id,
            review_text,
            rating,
            review_date,
            source
          FROM tb_review
          WHERE product_id = ?
          ORDER BY review_date DESC
          LIMIT 10`,
          [productId]
        );
        return data;
      });
      recentReviews = result || [];
    } catch (queryErr) {
      console.error("⚠️ 최신 리뷰 조회 실패 (계속 진행):", queryErr.message);
      recentReviews = []; // 리뷰 조회 실패해도 계속 진행
    }

    //5. 상품 이름 조회 (재시도 로직 포함)
    let productInfo = null;
    try {
      const result = await executeQueryWithRetry(async () => {
        const [[data]] = await db.query(
          `SELECT 
            product_name
          FROM tb_product
          WHERE product_id = ?
          LIMIT 1`,
          [productId]
        );
        return data;
      });
      productInfo = result;
    } catch (queryErr) {
      console.error("⚠️ 제품 정보 조회 실패 (계속 진행):", queryErr.message);
      productInfo = null; // 제품 정보 조회 실패해도 계속 진행
    }
    // 5. 응답 데이터 구성
    res.json({
      message: "대시보드 조회 성공",
      dashboard: {
        product_id: dashboardData.product_id,
        product_name: productInfo?.product_name,
        total_reviews: dashboardData.total_reviews,
        sentiment_distribution: dashboardData.sentiment_distribution,
        product_score: dashboardData.product_score,
        date_sentimental: dashboardData.date_sentimental,
        keyword_summary: dashboardData.keyword_summary,
        heatmap: dashboardData.heatmap,
        wordcloud: wordcloudImage,
        updated_at: dashboardData.updated_at
      },
      insight,
      recent_reviews: recentReviews
    });

  } catch (err) {
    console.error("❌ 대시보드 조회 오류:", err);
    
    // DB 연결 관련 에러인 경우
    if (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(503).json({ 
        message: "데이터베이스 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요." 
      });
    }
    
    res.status(500).json({ 
      message: "대시보드 조회 중 서버 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ==============================
// 3. 키워드별 리뷰 조회
// ==============================
export const keywordReview = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { keyword, page = 1, limit = 20 } = req.query;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    const offset = (page - 1) * limit;

    const [rows] = await db.query(`
      SELECT 
        r.review_id,
        r.review_text,
        ra.sentiment,
        k.keyword_text
      FROM tb_review r
      JOIN tb_reviewAnalysis ra ON r.review_id = ra.review_id
      JOIN tb_keyword k ON ra.keyword_id = k.keyword_id
      WHERE r.product_id = ? AND k.keyword_text = ?
      ORDER BY r.review_id DESC
      LIMIT ?, ?
    `, [productId, keyword, offset, parseInt(limit)]);

    res.json({
      message: "키워드별 리뷰 조회 성공",
      productId,
      keyword,
      count: rows.length,
      reviews: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error("❌ 키워드별 리뷰 조회 오류:", err);
    res.status(500).json({ message: "키워드별 리뷰 조회 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 4. 리뷰 분석 (내부 함수)
// ==============================
// 내부에서 사용할 리뷰 분석 함수 (응답 없이 분석만 수행)
const performAnalysis = async (productId, domain = null) => {
  try {
    console.log(`📦 ${productId}번 제품 리뷰 분석 시작 (도메인: ${domain || "자동"})`);
    
    // Python 서버 직접 호출
    const result = await analyzeProductReviews(productId, domain);
    
    console.log(`✅ 분석 완료:`, result);
    return result;
  } catch (err) {
    console.error("❌ 분석 실행 오류:", err);
    throw err;
  }
};

// ==============================
// 5. 제품 삭제
// ==============================
export const deleteProduct = async (req, res) => {
  try {
    const { id: productId } = req.params;

    // 제품 ID 검증
    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    const productIdNum = Number.parseInt(productId, 10);
    if (isNaN(productIdNum) || productIdNum <= 0) {
      return res.status(400).json({ message: "유효한 제품 ID가 필요합니다." });
    }

    // 제품 존재 확인 및 소유권 확인
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "인증된 사용자 정보가 없습니다." });
    }

    const [[existingProduct]] = await db.query(
      "SELECT product_id, user_id FROM tb_product WHERE product_id = ?",
      [productIdNum]
    );

    if (!existingProduct) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
    }

    // 소유권 확인
    if (existingProduct.user_id !== userId) {
      return res.status(403).json({ message: "이 제품을 삭제할 권한이 없습니다." });
    }

    // 트랜잭션 시작하여 관련 데이터 삭제
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. tb_productDashboard 삭제 (insight_id 참조하므로 먼저 삭제)
      await connection.query("DELETE FROM tb_productDashboard WHERE product_id = ?", [productIdNum]);

      // 2. tb_productInsight 삭제 (product_id CASCADE이지만 명시적으로 삭제)
      await connection.query("DELETE FROM tb_productInsight WHERE product_id = ?", [productIdNum]);

      // 3. tb_review 삭제 (product_id CASCADE이지만 명시적으로 삭제)
      // tb_reviewAnalysis는 tb_review의 CASCADE로 자동 삭제됨
      await connection.query("DELETE FROM tb_review WHERE product_id = ?", [productIdNum]);

      // 4. tb_productKeyword 삭제 (product_id CASCADE이지만 명시적으로 삭제)
      await connection.query("DELETE FROM tb_productKeyword WHERE product_id = ?", [productIdNum]);

      // 5. 마지막으로 tb_product 삭제
      const [result] = await connection.query("DELETE FROM tb_product WHERE product_id = ?", [productIdNum]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
      }

      await connection.commit();
      connection.release();

      res.json({
        message: "제품이 성공적으로 삭제되었습니다.",
        productId: productIdNum
      });

    } catch (err) {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      throw err;
    }
  } catch (err) {
    console.error("❌ 제품 삭제 오류:", err);
    console.error("❌ 에러 상세:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
      sqlMessage: err.sqlMessage
    });
    
    // 외래 키 제약 조건 오류인 경우
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      return res.status(409).json({ 
        message: "제품 삭제 중 관련 데이터 처리 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 
      });
    }
    
    res.status(500).json({ 
      message: "제품 삭제 중 서버 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


// ==============================
// 6. 제품 정보 수정
// ==============================
export const updateProduct = async (req, res) => {
  try {
    console.log("📝 제품 수정 요청 받음:", req.params, req.body);
    const { id: productId } = req.params;
    const { product_name, brand, category_id } = req.body;

    // 제품 ID 검증
    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    const productIdNum = Number.parseInt(productId, 10);
    if (isNaN(productIdNum) || productIdNum <= 0) {
      return res.status(400).json({ message: "유효한 제품 ID가 필요합니다." });
    }

    // 필수 필드 검증
    if (!product_name || product_name.trim() === "") {
      return res.status(400).json({ message: "제품명은 필수입니다." });
    }

    if (!category_id) {
      return res.status(400).json({ message: "카테고리는 필수입니다." });
    }

    const categoryIdNum = Number.parseInt(category_id, 10);
    if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
      return res.status(400).json({ message: "유효한 카테고리 ID가 필요합니다." });
    }

    // 제품 존재 확인
    const [[existingProduct]] = await db.query(
      "SELECT product_id FROM tb_product WHERE product_id = ?",
      [productIdNum]
    );

    if (!existingProduct) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
    }

    // 제품 정보 업데이트
    await db.query(
      `UPDATE tb_product 
       SET product_name = ?, brand = ?, category_id = ?
       WHERE product_id = ?`,
      [product_name.trim(), brand && brand.trim() !== "" ? brand.trim() : null, categoryIdNum, productIdNum]
    );

    res.json({
      message: "제품 정보가 성공적으로 수정되었습니다.",
      productId: productIdNum,
      updated: { product_name: product_name.trim(), brand: brand && brand.trim() !== "" ? brand.trim() : null, category_id: categoryIdNum }
    });

  } catch (err) {
    console.error("❌ 제품 정보 수정 오류:", err);
    console.error("❌ 에러 상세:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql
    });
    res.status(500).json({ 
      message: "제품 정보 수정 중 서버 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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

// 리뷰 업로드 메인 함수
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
    
    // 파일과 매핑 정보 확인
    const files = req.files || [];
    // 프론트엔드에서 각 파일마다 mappings를 append하므로 배열로 받음
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
    
    let totalInserted = 0;
    let totalSkipped = 0;
    let totalDuplicated = 0;
    const errors = [];
    
    // 각 파일 처리
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mapping = mappings[i];
      
      if (!mapping || !mapping.reviewColumn || !mapping.dateColumn) {
        errors.push(`${file.originalname}: 리뷰 컬럼과 날짜 컬럼 매핑이 필요합니다.`);
        continue;
      }
      
      try {
        let rows = [];
        const ext = path.extname(file.originalname).toLowerCase();
        
        // 파일 파싱
        if (ext === '.csv') {
          rows = await parseCSV(file.buffer);
        } else if (ext === '.xlsx' || ext === '.xls') {
          rows = parseExcel(file.buffer);
        } else {
          errors.push(`${file.originalname}: 지원하지 않는 파일 형식입니다.`);
          continue;
        }
        
        if (!rows || rows.length === 0) {
          errors.push(`${file.originalname}: 데이터가 없습니다.`);
          continue;
        }
        
        // 첫 번째 행에서 사용 가능한 컬럼명 확인 (스팀 리뷰용)
        const firstRow = rows[0] || {};
        const availableColumns = Object.keys(firstRow);
        const hasVotedUp = availableColumns.includes('voted_up');
        const hasWeightedScore = availableColumns.includes('weighted_vote_score');
        const isSteamFormat = hasVotedUp && hasWeightedScore;
        
        // 각 행 처리
        for (const row of rows) {
          try {
            const reviewText = String(row[mapping.reviewColumn] || '').trim();
            const dateValue = row[mapping.dateColumn];
            const ratingValue = mapping.ratingColumn ? row[mapping.ratingColumn] : null;
            
            // 필수 필드 검증
            if (!reviewText) {
              totalSkipped++;
              continue;
            }
            
            // 날짜 파싱
            const reviewDate = parseDate(dateValue);
            if (!reviewDate) {
              totalSkipped++;
              continue;
            }
            
            // 평점 처리
            let rating = 3.0; // 기본값
            
            // 스팀 리뷰 형식인 경우 (voted_up이 평점 컬럼으로 선택된 경우)
            if (isSteamFormat && mapping.ratingColumn === 'voted_up') {
              const votedUp = row['voted_up'];
              const weightedScore = row['weighted_vote_score'];
              rating = calculateSteamRating(votedUp, weightedScore);
            } 
            // 일반 평점 컬럼이 선택된 경우
            else if (ratingValue !== null && ratingValue !== undefined) {
              const parsedRating = parseFloat(ratingValue);
              if (!isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 5) {
                rating = parsedRating;
              }
            }
            
            // 중복 체크
            const isDuplicate = await checkDuplicateReview(productId, reviewText, reviewDate);
            if (isDuplicate) {
              totalDuplicated++;
              continue;
            }
            
            // 리뷰 삽입
            await db.query(
              `INSERT INTO tb_review (product_id, review_text, rating, review_date, source)
               VALUES (?, ?, ?, ?, ?)`,
              [productId, reviewText, rating, reviewDate, null]
            );
            
            totalInserted++;
          } catch (rowError) {
            console.error(`❌ 리뷰 삽입 오류 (${file.originalname}):`, rowError);
            totalSkipped++;
          }
        }
      } catch (fileError) {
        console.error(`❌ 파일 처리 오류 (${file.originalname}):`, fileError);
        errors.push(`${file.originalname}: ${fileError.message}`);
      }
    }
    
    // 리뷰 업로드 후 리뷰 분석 자동 실행 (비동기, 에러가 발생해도 업로드는 성공)
    let analysisError = null;
    if (totalInserted > 0) {
      try {
        console.log(`🔄 리뷰 ${totalInserted}개 추가됨. 자동 분석 시작...`);
        await performAnalysis(productId);
        console.log(`✅ 자동 분석 완료`);
      } catch (analysisErr) {
        analysisError = analysisErr;
        console.error(`⚠️ 자동 분석 실패 (리뷰 업로드는 성공):`, analysisErr);
        // 분석 실패해도 업로드는 성공으로 처리
      }
    }

    res.json({
      message: "리뷰 업로드 완료",
      summary: {
        totalInserted,
        totalSkipped,
        totalDuplicated,
        totalProcessed: totalInserted + totalSkipped + totalDuplicated
      },
      errors: errors.length > 0 ? errors : undefined,
      analysisStatus: totalInserted > 0 
        ? (analysisError ? "failed" : "completed")
        : "skipped",
      analysisError: analysisError ? analysisError.message : undefined
    });
    
  } catch (err) {
    console.error("❌ 리뷰 업로드 오류:", err);
    res.status(500).json({ 
      message: "리뷰 업로드 중 서버 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ==============================
// 8. 제품 생성
// ==============================
export const createProductWithReviews = async (req, res) => {
  try {
    const { product_name, brand, category_id } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "인증된 사용자 정보가 없습니다." });
    }
    
    if (!product_name || !category_id) {
      return res.status(400).json({ message: "제품명과 카테고리는 필수입니다." });
    }
    
    // 제품 생성
    const [result] = await db.query(
      "INSERT INTO tb_product (product_name, brand, category_id, user_id, registered_date) VALUES (?, ?, ?, ?, NOW())",
      [product_name, brand || null, category_id, userId]
    );
    
    const productId = result.insertId;
    console.log(`✅ 제품 생성 완료: ${productId}`);
    
    // 결과 반환
    res.status(201).json({
      message: "제품이 성공적으로 생성되었습니다.",
      product: { 
        product_id: productId, 
        product_name, 
        brand, 
        category_id 
      }
    });
    
  } catch (err) {
    console.error("❌ 제품 생성 오류:", err);
    res.status(500).json({ 
      message: "제품 생성 중 서버 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Multer 미들웨어 export
export { upload };
