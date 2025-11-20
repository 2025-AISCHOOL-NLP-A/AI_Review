import express from "express";
import {
    productList,
    dashboard,
    keywordReview,
    deleteProduct,
    updateProduct,
    uploadReviews,
    upload,
    createProductWithReviews,
} from "../controllers/productController.js";

const router = express.Router();

// SSE 엔드포인트는 app.js에서 별도로 등록 (인증 미들웨어 없이)
// EventSource는 헤더를 설정할 수 없으므로 쿼리 파라미터로 토큰을 받습니다.

// 리뷰 파일 업로드
router.post("/:id/reviews/upload", upload.array('files', 10), uploadReviews);

// 특정 키워드에 대한 리뷰 조회
router.get("/:id/reviews", keywordReview);

// 대시보드 데이터 호출
router.get("/:id/dashboard", dashboard);

// 제품 삭제
router.delete("/:id", deleteProduct);

// 제품 정보 수정
router.put("/:id", updateProduct);

// 워크플레이스용 제품 리스트
router.get("/", productList);

// 제품 생성
router.post("/", createProductWithReviews);

export default router;