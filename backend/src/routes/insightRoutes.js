import express from "express";
import {
  listInsights,
  getInsightById,
  requestInsight,
} from "../controllers/insightController.js";

const router = express.Router();

// GET /insights?product_id=... - 인사이트 목록(파라미터로 제품 id 받으면 그 제품 리스트만)
router.get("/", listInsights);

// GET /insights/:id - 인사이트 상세
router.get("/:id", getInsightById);

// POST /insights/request - 분석 요청(파라미터로 제품 id, 기간, 요청사항등)
router.post("/request", requestInsight);

export default router;