import db from "../models/db.js";
import { getProductDashboardData as getProductDashboard } from "./dashboardController.js";
import { analyzeReviews } from "./reviewController.js"; // ✅ 실제 리뷰 분석 함수 import
import dotenv from "dotenv";

dotenv.config();

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
// 2. 제품 목록 조회
// ==============================
export const productList = async (req, res) => {
  try {
    // const [rows] = await db.query(`
    //   SELECT 
    //     p.product_id,
    //     p.product_name,
    //     p.brand,
    //     c.category_name,
    //     IFNULL(d.product_score, 0) AS product_score,
    //     IFNULL(d.total_reviews, 0) AS total_reviews,
    //     d.updated_at
    //   FROM tb_product p
    //   LEFT JOIN tb_productCategory c ON p.category_id = c.category_id
    //   LEFT JOIN tb_productDashboard d ON p.product_id = d.product_id
    //   ORDER BY p.product_id DESC
    // `);
    const [rows] = await db.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.brand,
        p.registered_date,
        p.category_id
      FROM tb_product p
      ORDER BY p.product_id DESC
    `);

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
      // TODO: 이미지 파일을 읽어서 base64로 인코딩하거나 URL로 제공
      wordcloudImage = dashboardData.wordcloud_path;
    }

    // 3. 인사이트 조회
    let insight = null;
    if (dashboardData.insight_id) {
      const [[insightData]] = await db.query(
        `SELECT 
          insight_id,
          product_id,
          user_id,
          avg_rating,
          pos_top_keywords,
          neg_top_keywords,
          insight_summary,
          improvement_suggestion,
          created_at
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

    /*
    // 사용자의 인증정보 확인(JWT payload: { id, login_id })
    const userId = req.user?.id; // JWT payload: { id, login_id }
    if (!userId) {
      return res.status(401).json({ message: "인증 정보가 없습니다." });
    }
    // 분석 이력 생성 (status: 'process' 로 접수)
    const [result] = await db.query(
      `INSERT INTO tb_analysisHistory (user_id, status, uploaded_at)
       VALUES (?, 'process', NOW())`,
      [userId]
    );
    const analysisId = result.insertId; // = history_id
    */

    // TODO: 리뷰 분석 요청 로직 구현
    // - 중복 분석 요청 방지 체크
    // - 제품 리뷰 데이터 수집
    // - Python AI 서버로 분석 요청
    // - 분석 상태 업데이트
    // - 결과 저장
    
    // TODO: 분석 작업 생성 후 고유 ID 획득 (DB insert 등)
    // const analysisId = Date.now().toString(); // 예시

    res
      //.status(202) //// 요청을 정상 수신했지만 처리(분석)가 아직 완료되지 않음을 타냄
      //.set("Location", `/products/${productId}/review/analyses/${analysisId}`)
      .json({
      message: "리뷰 분석 요청이 접수되었습니다.",
      productId,
      status: "processing",
      analysisId: null
    });
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

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    await db.query("DELETE FROM tb_product WHERE product_id = ?", [productId]);

    res.json({
      message: "제품이 성공적으로 삭제되었습니다.",
      productId
    });

  } catch (err) {
    console.error("❌ 제품 삭제 오류:", err);
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
    const { id: productId } = req.params;
    const { product_name, brand, category_id } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    await db.query(
      `UPDATE tb_product 
       SET product_name = ?, brand = ?, category_id = ?, updated_at = NOW()
       WHERE product_id = ?`,
      [product_name, brand, category_id, productId]
    );

    res.json({
      message: "제품 정보가 성공적으로 수정되었습니다.",
      productId,
      updated: { product_name, brand, category_id }
    });

  } catch (err) {
    console.error("❌ 제품 정보 수정 오류:", err);
    res.status(500).json({ message: "제품 정보 수정 중 서버 오류가 발생했습니다." });
  }
};

export const test = async (req, res) => {
  res.json({ message: "제품 테스트 API 작동 중" });
};
