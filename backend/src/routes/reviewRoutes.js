import express from "express";
import { analyzeReviews } from "../controllers/reviewController.js"; // ✅ 이름 맞춤

const router = express.Router();

// 리뷰 분석 실행
router.post("/products/:product_id/reviews/analysis", analyzeReviews);

export default router;
