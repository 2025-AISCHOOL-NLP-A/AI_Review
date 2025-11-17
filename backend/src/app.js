import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import { verifyAuth } from "./middlewares/authMiddleware.js"
import reviewRoutes from "./routes/reviewRoutes.js";
import insightRoutes from "./routes/insightRoutes.js";

dotenv.config();
const app = express();

// CORS 설정
app.use(cors({
  origin: "http://localhost:5173", // React dev server 주소
  credentials: true,
}));

// 요청 로깅 (디버그용)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// JSON Body 파서
app.use(express.json());

// 라우트 등록
app.use("/auth", authRoutes);

// 인사이트 라우트 추가
app.use("/insights", verifyAuth, insightRoutes);

// 제품과 대시보드 라우트 추가
app.use("/products", verifyAuth, productRoutes);

// 리뷰 단독 분석 API (FastAPI 연동 테스트용)
app.use("/reviews", reviewRoutes);

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});