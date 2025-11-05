// 새 API 라우트 등록
import express from "express";
import { getSonyProductInfo } from "../controllers/dashboardController.js";

//엔드포인트 생성
const router = express.Router();
router.get("/sony", getSonyProductInfo);

export default router;