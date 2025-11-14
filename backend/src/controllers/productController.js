import db from "../models/db.js";
import { getProductDashboardData as getProductDashboard } from "./dashboardController.js";
import { analyzeReviews } from "./reviewController.js"; // ✅ 실제 리뷰 분석 함수 import
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// ES 모듈에서 __dirname 사용을 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// 1. 개별 제품 조회
// ==============================
export const getProductById = async (req, res) => {
  try {
    const { id: productId } = req.params;
    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    const [rows] = await db.query(
      "SELECT * FROM tb_product WHERE product_id = ?",
      [productId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "인증된 사용자 정보가 없습니다." });
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
// 📊 제품 대시보드 조회
// ==============================
// export const dashboard = (req, res) => getProductDashboard(req, res);

export const dashboard = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
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
      [productId]
    );
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
      [productId]
    );

    //5. 상품 이름 조회
    const [[productInfo]] = await db.query(
      `SELECT 
        product_name
      FROM tb_product
      WHERE product_id = ?
      LIMIT 1`,
      [productId]
    );
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
    res.status(500).json({ message: "대시보드 조회 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 3. 대시보드 새로고침 (미들웨어)
// ==============================
export const refreshDashboard = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
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
// 4. 키워드별 리뷰 조회
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
// 5. 리뷰 분석 요청 (Python API 호출)
// ==============================
export const analysisRequest = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    // ✅ analyzeReviews 함수 호출 (Python 서버 전체 파이프라인 사용)
    // analyzeReviews는 req.params.id를 사용하므로, req.params를 그대로 전달
    req.params.id = productId;
    return await analyzeReviews(req, res);
    
  } catch (err) {
    console.error("❌ 리뷰 분석 요청 오류:", err);
    res.status(500).json({ message: "리뷰 분석 요청 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 5-1. 분석 요청 상태 조회(분석 이력 조회) — history_id로 조회
// ==============================
/*export const getAnalysisStatus = async (req, res) => {
  try {
    const { analysisId } = req.params;

    const [[row]] = await db.query(
      `SELECT 
         history_id AS analysisId,
         status,
         review_count,
         uploaded_at,
         analyzed_at,
         model
       FROM tb_analysisHistory
        WHERE history_id = ?`,
      [analysisId]
    );

    if (!row) {
      return res.status(404).json({ message: "분석 이력을 찾을 수 없습니다." });
    }

    return res.json(row);
  } catch (err) {
    console.error("❌ 분석 상태 조회 오류:", err);
    return res.status(500).json({ message: "분석 상태 조회 중 서버 오류가 발생했습니다." });
  }
};*/

// ==============================
// 6. 제품 삭제
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

    // 제품 존재 확인
    const [[existingProduct]] = await db.query(
      "SELECT product_id FROM tb_product WHERE product_id = ?",
      [productIdNum]
    );

    if (!existingProduct) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
    }

    // 제품 삭제
    const [result] = await db.query("DELETE FROM tb_product WHERE product_id = ?", [productIdNum]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
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
// 7. 제품 생성 (추가 기능)
// ==============================
export const createProduct = async (req, res) => {
  try {
    const { product_name, brand, category_id } = req.body;

    if (!product_name || !category_id) {
      return res.status(400).json({ message: "제품명과 카테고리는 필수입니다." });
    }

    const [result] = await db.query(
      "INSERT INTO tb_product (product_name, brand, category_id, created_at) VALUES (?, ?, ?, NOW())",
      [product_name, brand || null, category_id]
    );

    res.status(201).json({
      message: "제품이 성공적으로 생성되었습니다.",
      product: { product_id: result.insertId, product_name, brand, category_id }
    });

  } catch (err) {
    console.error("❌ 제품 생성 오류:", err);
    res.status(500).json({ message: "제품 생성 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 8. 제품 정보 수정 (추가 기능)
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

export const test = async (req, res) => {
  res.json({ message: "제품 테스트 API 작동 중" });
};
