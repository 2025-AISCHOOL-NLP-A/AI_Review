// 새 API 라우트 등록
import express from "express";
import {
    productList,
    dashboard,
    refreshDashboard,
    keywordReview,
    analysisRequest
} from "../controllers/productController.js";
import { getProductDashboardData } from "../controllers/dashboardController.js";


//엔드포인트 생성
const router = express.Router();

// 더 구체적인 라우트를 먼저 배치
//연결 테스트용
router.get("/ping", (_req, res) => res.json({ ok: true }));

//대시보드 새로고침 요청(refreshDashboard 라는 미들웨어를 만들어야함. refreshDashboard 로 대시보드 새로고침 한 뒤 대시보드 로드) 
router.post("/:id/refresh", refreshDashboard, dashboard);

// 수집된 리뷰들에 대한 감성분석 요청
router.post("/:id/reviews/analysis", analysisRequest);

//특정 키워드에 대한 리뷰 조회
router.get("/:id/reviews", keywordReview);

//대시보드용 - 가장 일반적인 라우트는 마지막
router.get("/:id", getProductDashboardData);

//워크 플레이스용 제품 리스트 
router.get("/", productList);



export default router;

// 사용하는 api 목록
// GET /products - 제품 목록
// GET /products/{product_id}/ - 제품 대시보드 조회
// POST /products/{product_id}/refresh 대시보드 새로 고침 요청
// GET /products/{product_id}/reviews - 제품 리뷰(파라미터로 키워드)
// POST /products/{product_id}/reviews/analysis - 해당 상품 리뷰 분석 요청(Python API)
// DELETE /products/{id} - 제품 삭제