import db from "../models/db.js";
import { analyzeReviews } from "./reviewController.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// ES 모듈에서 __dirname 사용을 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// 헬퍼 함수: 공통 검증 로직
// ==============================

/**
 * 사용자 인증 확인
 * @param {object} req - Express request 객체
 * @returns {object} { isValid: boolean, userId: number, error: object | null }
 */
const validateUser = (req) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return {
      isValid: false,
      userId: null,
      error: { status: 401, message: "인증된 사용자 정보가 없습니다." }
    };
  }

  return {
    isValid: true,
    userId,
    error: null
  };
};

/**
 * 제품 ID 검증 및 숫자 변환
 * @param {string} productId - 제품 ID (문자열)
 * @returns {object} { isValid: boolean, productIdNum: number, error: object | null }
 */
const validateProductId = (productId) => {
  if (!productId) {
    return {
      isValid: false,
      productIdNum: null,
      error: { status: 400, message: "제품 ID가 필요합니다." }
    };
  }

  const productIdNum = Number.parseInt(productId, 10);
  if (isNaN(productIdNum) || productIdNum <= 0) {
    return {
      isValid: false,
      productIdNum: null,
      error: { status: 400, message: "유효한 제품 ID가 필요합니다." }
    };
  }

  return {
    isValid: true,
    productIdNum,
    error: null
  };
};

/**
 * 제품 존재 및 사용자 권한 확인
 * @param {number} productIdNum - 제품 ID (숫자)
 * @param {number} userId - 사용자 ID (숫자)
 * @returns {Promise<object>} { isValid: boolean, product: object | null, error: object | null }
 */
const validateProductOwnership = async (productIdNum, userId) => {
  try {
    const [[product]] = await db.query(
      "SELECT product_id, user_id FROM tb_product WHERE product_id = ? AND user_id = ?",
      [productIdNum, userId]
    );

    if (!product) {
      return {
        isValid: false,
        product: null,
        error: { status: 404, message: "제품을 찾을 수 없거나 접근 권한이 없습니다." }
      };
    }

    return {
      isValid: true,
      product,
      error: null
    };
  } catch (err) {
    console.error("❌ 제품 권한 확인 오류:", err);
    return {
      isValid: false,
      product: null,
      error: { status: 500, message: "제품 권한 확인 중 서버 오류가 발생했습니다." }
    };
  }
};

// ==============================
// 1. 개별 제품 조회 (사용자 권한 확인)
// ==============================
export const getProductById = async (req, res) => {
  try {
    const { id: productId } = req.params;

    // 사용자 인증 확인
    const { isValid: isUserValid, userId, error: userError } = validateUser(req);
    if (!isUserValid) {
      return res.status(userError.status).json({ message: userError.message });
    }

    // 제품 ID 검증
    const { isValid: isIdValid, productIdNum, error: idError } = validateProductId(productId);
    if (!isIdValid) {
      return res.status(idError.status).json({ message: idError.message });
    }

    // 제품 조회 및 권한 확인
    const [rows] = await db.query(
      "SELECT * FROM tb_product WHERE product_id = ? AND user_id = ?",
      [productIdNum, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "제품을 찾을 수 없거나 접근 권한이 없습니다." });
    }

    return res.json({ data: rows[0] });
  } catch (err) {
    console.error("❌ 제품 조회 오류:", err);
    return res.status(500).json({ message: "제품 조회 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 2. 제품 목록 조회 (사용자별)
// ==============================
export const productList = async (req, res) => {
  try {
    // 사용자 인증 확인
    const { isValid, userId, error } = validateUser(req);
    if (!isValid) {
      return res.status(error.status).json({ message: error.message });
    }

    // 해당 사용자의 제품만 조회
    const [rows] = await db.query(`
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

    res.json({
      message: "제품 목록 조회 성공",
      products: rows
    });
  } catch (err) {
    console.error("❌ 제품 목록 조회 오류:", err);
    res.status(500).json({ message: "제품 목록 조회 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 3. 제품 대시보드 조회 (사용자 권한 확인)
// ==============================
export const dashboard = async (req, res) => {
  try {
    const { id: productId } = req.params;

    // 사용자 인증 확인
    const { isValid: isUserValid, userId, error: userError } = validateUser(req);
    if (!isUserValid) {
      return res.status(userError.status).json({ message: userError.message });
    }

    // 제품 ID 검증
    const { isValid: isIdValid, productIdNum, error: idError } = validateProductId(productId);
    if (!isIdValid) {
      return res.status(idError.status).json({ message: idError.message });
    }

    // 제품 권한 확인
    const { isValid: isOwnerValid, error: ownerError } = await validateProductOwnership(productIdNum, userId);
    if (!isOwnerValid) {
      return res.status(ownerError.status).json({ message: ownerError.message });
    }

    // 1. 대시보드 테이블 전체 조회
    const [[dashboardData]] = await db.query(
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
      [productIdNum]
    );

    if (!dashboardData) {
      return res.status(404).json({ message: "대시보드 데이터를 찾을 수 없습니다." });
    }

    // 2. 워드클라우드 이미지 처리
    let wordcloudImage = null;
    if (dashboardData.wordcloud_path) {
      try {
        const staticPath = path.join(__dirname, "../../../model_server/static");
        const imagePath = path.join(staticPath, dashboardData.wordcloud_path.replace("/static/", ""));
        
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          wordcloudImage = `data:image/png;base64,${imageBuffer.toString("base64")}`;
        }
      } catch (err) {
        console.error("워드클라우드 이미지 로드 오류:", err);
        wordcloudImage = null;
      }
    }

    // 3. 인사이트 조회
    let insight = null;
    if (dashboardData.insight_id) {
      const [[insightData]] = await db.query(
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
      insight = insightData || null;
    }

    // 4. 최신 리뷰 10개 조회
    const [recentReviews] = await db.query(
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
      [productIdNum]
    );

    // 5. 응답 데이터 구성
    res.json({
      message: "대시보드 조회 성공",
      dashboard: {
        product_id: dashboardData.product_id,
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
    res.status(500).json({ message: "대시보드 조회 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 4. 대시보드 새로고침 (미들웨어)
// ==============================
export const refreshDashboard = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

    // 제품 ID 검증
    const { isValid, error } = validateProductId(productId);
    if (!isValid) {
      return res.status(error.status).json({ message: error.message });
    }

    // TODO: 향후 캐시 무효화 / 데이터 재갱신 로직 추가
    console.log(`🔄 대시보드 새로고침 완료 (productId=${productId})`);

    next(); // 다음 미들웨어(dashboard)로 이동
  } catch (err) {
    console.error("❌ 대시보드 새로고침 오류:", err);
    res.status(500).json({ message: "대시보드 새로고침 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 5. 키워드별 리뷰 조회 (사용자 권한 확인)
// ==============================
export const keywordReview = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { keyword, page = 1, limit = 20 } = req.query;

    // 사용자 인증 확인
    const { isValid: isUserValid, userId, error: userError } = validateUser(req);
    if (!isUserValid) {
      return res.status(userError.status).json({ message: userError.message });
    }

    // 제품 ID 검증
    const { isValid: isIdValid, productIdNum, error: idError } = validateProductId(productId);
    if (!isIdValid) {
      return res.status(idError.status).json({ message: idError.message });
    }

    // 제품 권한 확인
    const { isValid: isOwnerValid, error: ownerError } = await validateProductOwnership(productIdNum, userId);
    if (!isOwnerValid) {
      return res.status(ownerError.status).json({ message: ownerError.message });
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
    `, [productIdNum, keyword, offset, parseInt(limit)]);

    res.json({
      message: "키워드별 리뷰 조회 성공",
      productId: productIdNum,
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
// 6. 리뷰 분석 요청 (Python API 호출, 사용자 권한 확인)
// ==============================
export const analysisRequest = async (req, res) => {
  try {
    const { id: productId } = req.params;

    // 사용자 인증 확인
    const { isValid: isUserValid, userId, error: userError } = validateUser(req);
    if (!isUserValid) {
      return res.status(userError.status).json({ message: userError.message });
    }

    // 제품 ID 검증
    const { isValid: isIdValid, productIdNum, error: idError } = validateProductId(productId);
    if (!isIdValid) {
      return res.status(idError.status).json({ message: idError.message });
    }

    // 제품 권한 확인
    const { isValid: isOwnerValid, error: ownerError } = await validateProductOwnership(productIdNum, userId);
    if (!isOwnerValid) {
      return res.status(ownerError.status).json({ message: ownerError.message });
    }

    // analyzeReviews 함수 호출 (Python 서버 전체 파이프라인 사용)
    req.params.id = productIdNum;
    return await analyzeReviews(req, res);
    
  } catch (err) {
    console.error("❌ 리뷰 분석 요청 오류:", err);
    res.status(500).json({ message: "리뷰 분석 요청 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 7. 제품 삭제 (사용자 권한 확인)
// ==============================
export const deleteProduct = async (req, res) => {
  try {
    const { id: productId } = req.params;

    // 사용자 인증 확인
    const { isValid: isUserValid, userId, error: userError } = validateUser(req);
    if (!isUserValid) {
      return res.status(userError.status).json({ message: userError.message });
    }

    // 제품 ID 검증
    const { isValid: isIdValid, productIdNum, error: idError } = validateProductId(productId);
    if (!isIdValid) {
      return res.status(idError.status).json({ message: idError.message });
    }

    // 제품 권한 확인 및 삭제 (한 번의 쿼리로 처리)
    const [result] = await db.query(
      "DELETE FROM tb_product WHERE product_id = ? AND user_id = ?",
      [productIdNum, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "제품을 찾을 수 없거나 삭제 권한이 없습니다." });
    }

    res.json({
      message: "제품이 성공적으로 삭제되었습니다.",
      productId: productIdNum
    });

  } catch (err) {
    console.error("❌ 제품 삭제 오류:", err);
    console.error("❌ 에러 상세:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
      sqlMessage: err.sqlMessage
    });
    res.status(500).json({ message: "제품 삭제 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 8. 제품 생성 (사용자 ID 자동 설정)
// ==============================
export const createProduct = async (req, res) => {
  try {
    const { product_name, brand, category_id } = req.body;

    // 사용자 인증 확인
    const { isValid, userId, error } = validateUser(req);
    if (!isValid) {
      return res.status(error.status).json({ message: error.message });
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

    // 로그인한 사용자의 ID로 제품 생성
    const [result] = await db.query(
      "INSERT INTO tb_product (product_name, brand, category_id, user_id, registered_date) VALUES (?, ?, ?, ?, NOW())",
      [product_name.trim(), brand && brand.trim() !== "" ? brand.trim() : null, categoryIdNum, userId]
    );

    res.status(201).json({
      message: "제품이 성공적으로 생성되었습니다.",
      product: { 
        product_id: result.insertId, 
        product_name: product_name.trim(), 
        brand: brand && brand.trim() !== "" ? brand.trim() : null, 
        category_id: categoryIdNum, 
        user_id: userId 
      }
    });

  } catch (err) {
    console.error("❌ 제품 생성 오류:", err);
    res.status(500).json({ message: "제품 생성 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 9. 제품 정보 수정 (사용자 권한 확인)
// ==============================
export const updateProduct = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { product_name, brand, category_id } = req.body;

    // 사용자 인증 확인
    const { isValid: isUserValid, userId, error: userError } = validateUser(req);
    if (!isUserValid) {
      return res.status(userError.status).json({ message: userError.message });
    }

    // 제품 ID 검증
    const { isValid: isIdValid, productIdNum, error: idError } = validateProductId(productId);
    if (!isIdValid) {
      return res.status(idError.status).json({ message: idError.message });
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

    // 제품 정보 업데이트 (권한 확인 포함)
    const [result] = await db.query(
      `UPDATE tb_product 
       SET product_name = ?, brand = ?, category_id = ?
       WHERE product_id = ? AND user_id = ?`,
      [product_name.trim(), brand && brand.trim() !== "" ? brand.trim() : null, categoryIdNum, productIdNum, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "제품을 찾을 수 없거나 수정 권한이 없습니다." });
    }

    res.json({
      message: "제품 정보가 성공적으로 수정되었습니다.",
      productId: productIdNum,
      updated: { 
        product_name: product_name.trim(), 
        brand: brand && brand.trim() !== "" ? brand.trim() : null, 
        category_id: categoryIdNum 
      }
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
// 10. 테스트 API
// ==============================
export const test = async (req, res) => {
  res.json({ message: "제품 테스트 API 작동 중" });
};
