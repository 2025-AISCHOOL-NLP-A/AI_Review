// 새 API 라우트 등록
import express from "express";
import { getProductDashboardData } from "../controllers/dashboardController.js";

//엔드포인트 생성
const router = express.Router();
router.get("/ping", (_req, res) => res.json({ ok: true }));
router.get("/data", getProductDashboardData);

export default router;

