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
    // TODO: 제품 목록 조회 로직 구현
    // - 카테고리별 필터링
    // - 페이지네이션
    // - 검색 기능
    
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

    // TODO: 키워드별 리뷰 조회 로직 구현
    // - 특정 키워드가 포함된 리뷰 필터링
    // - 페이지네이션 적용
    // - 감정별 분류
    // - 날짜별 정렬
    
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

    // TODO: 리뷰 분석 요청 로직 구현
    // - 중복 분석 요청 방지 체크
    // - 제품 리뷰 데이터 수집
    // - Python AI 서버로 분석 요청
    // - 분석 상태 업데이트
    // - 결과 저장
    
    res.json({
      message: "리뷰 분석 요청이 접수되었습니다.",
      productId,
      status: "processing",
      analysisId: null
    });
  } catch (err) {
    console.error("❌ 리뷰 분석 요청 오류:", err);
    res.status(500).json({
      message: "리뷰 분석 요청 중 서버 오류가 발생했습니다.",
      error: err.message
    });
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
// ➕ 제품 생성
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

    // TODO: 제품 정보 수정 로직 구현
    // - 제품 존재 확인
    // - 권한 확인
    // - 수정 데이터 검증
    // - 데이터베이스 업데이트
    
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

}
    