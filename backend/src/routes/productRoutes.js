// 새 API 라우트 등록
import express from "express";
import {
    productList,
    dashboard,
    //refreshDashboard,
    keywordReview,
    analysisRequest,
    deleteProduct,
    updateProduct,
    uploadReviews,
    upload,
    //getAnalysisStatus
} from "../controllers/productController.js";

//엔드포인트 생성
const router = express.Router();

// 더 구체적인 라우트를 먼저 배치
// *현재는 미사용*/ 대시보드 새로고침 요청(refreshDashboard 라는 미들웨어를 만들어야함. refreshDashboard 로 대시보드 새로고침 한 뒤 대시보드 로드) 
//router.post("/:id/dashboard/refresh", refreshDashboard, dashboard);

// 리뷰 파일 업로드 (더 구체적인 라우트를 먼저 배치)
router.post("/:id/reviews/upload", upload.array('files', 10), uploadReviews);

// 수집된 리뷰들에 대한 감성분석 요청
router.post("/:id/reviews/analysis", analysisRequest);

//특정 키워드에 대한 리뷰 조회
router.get("/:id/reviews", keywordReview);

//대시보드 데이터 호출 - 가장 일반적인 라우트는 마지막
router.get("/:id/dashboard", dashboard); // productController.dashboard 별칭 사용!

// 제품 삭제
router.delete("/:id", deleteProduct);

// 제품 정보 수정
router.put("/:id", updateProduct);

//워크 플레이스용 제품 리스트 
router.get("/", productList);



// 분석 요청 이력 조회(선택): history_id 사용, (추후 사용 여부 판단)
// router.get("/:id/review-analyses/:analysisId", getAnalysisStatus);

export default router;

// 사용하는 api 목록
// GET /products - 제품 목록
// GET /products/{product_id}/ - 제품 대시보드 조회
// POST /products/{product_id}/refresh 대시보드 새로 고침 요청
// GET /products/{product_id}/reviews - 제품 리뷰(파라미터로 키워드)
// POST /products/{product_id}/reviews/analysis - 해당 상품 리뷰 분석 요청(Python API)
// DELETE /products/{id} - 제품 삭제