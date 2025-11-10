import db from "../models/db.js";
import { getProductDashboardData as getProductDashboard } from "./dashboardController.js";
import { analyzeReviews } from "./reviewController.js";
import dotenv from "dotenv";

dotenv.config();

// ==============================
// 📦 제품 목록 조회
// ==============================
export const productList = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.brand,
        c.category_name,
        IFNULL(d.product_score, 0) AS product_score,
        IFNULL(d.total_reviews, 0) AS total_reviews,
        d.updated_at
      FROM tb_product p
      LEFT JOIN tb_productCategory c ON p.category_id = c.category_id
      LEFT JOIN tb_productDashboard d ON p.product_id = d.product_id
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

// 대시보드 조회는 dashboardController.getProductDashboardData를 사용
// dashboard 별칭: 라우트 체인에서 사용하기 편하도록 동일 동작으로 래핑
export const dashboard = (req, res) => getProductDashboard(req, res);


// ==============================
// 대시보드 새로고침 (미들웨어)
// ==============================
export const refreshDashboard = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    // TODO: 대시보드 새로고침 로직 구현
    // - 최신 리뷰 데이터 수집
    // - 캐시 무효화
    // - 분석 데이터 업데이트
    
    console.log(`🔄 대시보드 새로고침 완료 (productId=${productId})`);
    
    // 다음 미들웨어(dashboard)로 전달
    next();
  } catch (err) {
    console.error("❌ 대시보드 새로고침 오류:", err);
    res.status(500).json({ message: "대시보드 새로고침 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 💬 키워드별 리뷰 조회
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
// 🧠 리뷰 분석 요청 (FastAPI 호출 → DB 저장)
// ==============================
export const analysisRequest = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    console.log(`🧠 리뷰 분석 요청 수신 (productId=${productId})`);

    // ✅ 실제 리뷰 분석 수행 (FastAPI → DB)
    await analyzeReviews(req, res);

    // analyzeReviews 내부에서 이미
    // tb_reviewAnalysis + tb_productDashboard까지 갱신 처리함

  } catch (err) {
    console.error("❌ 리뷰 분석 요청 오류:", err);
    res.status(500).json({ message: "리뷰 분석 요청 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 🗑️ 제품 삭제
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
// ➕ 제품 생성
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
// ✏️ 제품 정보 수정
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
    