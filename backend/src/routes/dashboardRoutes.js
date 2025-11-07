//삭제 예정(SQL데이터 호출용으로 사용) 

///import { getDashboardData, getProductDashboardData, getDashboardDefault } from "../controllers/dashboardController.js";
import express from "express";
const router = express.Router();


/*
// 기본 대시보드: 제품 id = 1001
router.get("/", getDashboardDefault);

// 쿼리 기반: /dashboard/data?productId=XXXX
router.get("/data", getDashboardData);

// 파라미터 기반: /dashboard/:id
router.get("/:id", getProductDashboardData);
*/
export default router;
