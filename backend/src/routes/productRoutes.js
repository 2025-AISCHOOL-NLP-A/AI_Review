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
import { getUploadProgress } from "../controllers/sseController.js";

const router = express.Router();

// SSE 엔드포인트: 업로드 진행 상황 스트리밍
router.get("/:productId/reviews/upload/progress/:taskId", getUploadProgress);

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