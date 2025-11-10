import db from "../models/db.js";
import { getProductDashboardData as getProductDashboard } from "./dashboardController.js";
import dotenv from "dotenv";

dotenv.config();

// ==============================
// 제품 목록 조회
// ==============================
export const productList = async (req, res) => {
  try {
    // TODO: 제품 목록 조회 로직 구현
    // - 카테고리별 필터링
    // - 페이지네이션
    // - 검색 기능

    res.json({
      message: "제품 목록 조회 성공",
      products: []
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
// 키워드별 리뷰 조회
// ==============================
export const keywordReview = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { keyword, page = 1, limit = 20 } = req.query;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    // TODO: 키워드별 리뷰 조회 로직 구현
    // - 특정 키워드가 포함된 리뷰 필터링
    // - 페이지네이션 적용
    // - 감정별 분류
    // - 날짜별 정렬

    res.json({
      message: "키워드별 리뷰 조회 성공",
      productId,
      keyword,
      reviews: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0
      }
    });
  } catch (err) {
    console.error("❌ 키워드별 리뷰 조회 오류:", err);
    res.status(500).json({ message: "키워드별 리뷰 조회 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 리뷰 분석 요청 (Python API 호출)
// ==============================
export const analysisRequest = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    // 1) 제품 정보 조회 (category_id 가져오기)
    const [products] = await db.query(
      "SELECT product_id, category_id, product_name FROM tb_product WHERE product_id = ?",
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
    }

    const product = products[0];

    // 2) 중복 분석 요청 방지 체크
    const [[existingAnalysis]] = await db.query(
      `SELECT history_id, status FROM tb_analysisHistory 
       WHERE product_id = ? AND status = 'process' 
       ORDER BY uploaded_at DESC LIMIT 1`,
      [productId]
    );

    if (existingAnalysis) {
      return res.status(409).json({
        message: "이미 분석이 진행 중입니다.",
        status: "processing",
        historyId: existingAnalysis.history_id
      });
    }

    // 3) 제품의 리뷰 데이터 수집 (분석되지 않은 리뷰만)
    const [reviews] = await db.query(
      `SELECT r.review_id, r.review_text, r.rating, r.review_date 
       FROM tb_review r
       LEFT JOIN tb_reviewAnalysis ra ON r.review_id = ra.review_id
       WHERE r.product_id = ? 
         AND ra.review_id IS NULL
       ORDER BY r.review_date DESC`,
      [productId]
    );

    if (reviews.length === 0) {
      return res.status(400).json({
        message: "분석할 리뷰가 없습니다.",
        productId
      });
    }

    // 4) 분석 이력 생성
    const userId = req.user?.id || 10001; // 인증된 사용자 ID
    const [historyResult] = await db.query(
      `INSERT INTO tb_analysisHistory 
       (user_id, review_count, status, uploaded_at, model) 
       VALUES (?, ?, 'process', NOW(), ?)`,
      [userId, reviews.length, `category_${product.category_id}`]
    );

    const historyId = historyResult.insertId;

    // 5) Python AI 서버로 분석 요청
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${pythonApiUrl}/api/analysis/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: parseInt(productId),
          category_id: product.category_id,
          reviews: reviews.map(r => ({
            review_id: r.review_id,
            text: r.review_text,
            rating: parseFloat(r.rating),
            date: r.review_date
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Python API 오류: ${response.status}`);
      }

      const analysisResult = await response.json();

      // 6) 분석 상태 업데이트 (성공)
      await db.query(
        `UPDATE tb_analysisHistory 
         SET status = 'success', analyzed_at = NOW() 
         WHERE history_id = ?`,
        [historyId]
      );

      console.log(`✅ 리뷰 분석 완료 (productId=${productId}, historyId=${historyId})`);

      res.json({
        message: "리뷰 분석이 완료되었습니다.",
        productId: parseInt(productId),
        categoryId: product.category_id,
        status: "success",
        historyId,
        totalReviews: reviews.length,
        result: analysisResult
      });

    } catch (pythonError) {
      // Python API 호출 실패 시 상태 업데이트
      await db.query(
        `UPDATE tb_analysisHistory 
         SET status = 'fail', analyzed_at = NOW() 
         WHERE history_id = ?`,
        [historyId]
      );

      console.error("❌ Python API 호출 오류:", pythonError);

      return res.status(503).json({
        message: "AI 분석 서비스에 연결할 수 없습니다. Python 서버가 실행 중인지 확인해주세요.",
        error: pythonError.message,
        historyId
      });
    }

  } catch (err) {
    console.error("❌ 리뷰 분석 요청 오류:", err);
    res.status(500).json({
      message: "리뷰 분석 요청 중 서버 오류가 발생했습니다.",
      error: err.message
    });
  }
};

// ==============================
// 제품 삭제
// ==============================
export const deleteProduct = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    // TODO: 제품 삭제 로직 구현
    // - 권한 확인 (관리자 또는 소유자)
    // - 관련 데이터 삭제 (리뷰, 분석 결과, 인사이트 등)
    // - 외래키 제약 조건 처리

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
// 제품 생성 (추가 기능)
// ==============================
export const createProduct = async (req, res) => {
  try {
    const { product_name, brand, category_id } = req.body;

    if (!product_name || !category_id) {
      return res.status(400).json({ message: "제품명과 카테고리는 필수입니다." });
    }

    // TODO: 제품 생성 로직 구현
    // - 제품 정보 검증
    // - 중복 제품 확인
    // - 데이터베이스 저장

    res.status(201).json({
      message: "제품이 성공적으로 생성되었습니다.",
      product: {
        product_name,
        brand,
        category_id
      }
    });
  } catch (err) {
    console.error("❌ 제품 생성 오류:", err);
    res.status(500).json({ message: "제품 생성 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 제품 정보 수정 (추가 기능)
// ==============================
export const updateProduct = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { product_name, brand, category_id } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    // TODO: 제품 정보 수정 로직 구현
    // - 제품 존재 확인
    // - 권한 확인
    // - 수정 데이터 검증
    // - 데이터베이스 업데이트

    res.json({
      message: "제품 정보가 성공적으로 수정되었습니다.",
      productId,
      updated: {
        product_name,
        brand,
        category_id
      }
    });
  } catch (err) {
    console.error("❌ 제품 정보 수정 오류:", err);
    res.status(500).json({ message: "제품 정보 수정 중 서버 오류가 발생했습니다." });
  }
};

export const test = async (req, res) => {

}
