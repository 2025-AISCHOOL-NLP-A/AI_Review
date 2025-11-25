import express from "express";
import {
    productList,
    dashboard,
    deleteProduct,
    updateProduct,
    createProductWithReviews,
} from "../controllers/productController.js";
import {
    uploadReviews,
    upload,
} from "../controllers/reviewController.js";
const router = express.Router();

// 리뷰 파일 업로드
router.post("/:id/reviews/upload", upload.array('files', 10), uploadReviews);

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