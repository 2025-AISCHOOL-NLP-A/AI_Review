// dotenv를 가장 먼저 로드 (다른 모듈보다 먼저)
import dotenv from "dotenv";
dotenv.config();

// dotenv 메시지 필터링 (다른 import 전에 설정)
const originalLog = console.log;
console.log = (...args) => {
  const message = args[0];
  // dotenv 메시지 필터링
  if (typeof message === 'string' && message.includes('[dotenv@')) {
    return; // dotenv 메시지 무시
  }
  originalLog(...args);
};

import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import { verifyAuth } from "./middlewares/authMiddleware.js"
import reviewRoutes from "./routes/reviewRoutes.js";
import insightRoutes from "./routes/insightRoutes.js";
import { getUploadProgress } from "./controllers/sseController.js";

// console.log 복원 (다른 로그는 정상 출력)
console.log = originalLog;
const app = express();

// 보안 헤더 설정 (HTTP 헤더로만 작동)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS 설정 - 환경 변수로 여러 origin 지원
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ["http://localhost:5173"];

app.use(cors({
  origin: allowedOrigins,
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

// SSE 엔드포인트는 별도로 등록 (인증 미들웨어 없이)
// EventSource는 헤더를 설정할 수 없으므로 쿼리 파라미터로 토큰을 받습니다.
// 컨트롤러에서 쿼리 파라미터 토큰으로 인증 처리
app.get("/products/:productId/reviews/upload/progress/:taskId", getUploadProgress);

// 인사이트 라우트 추가
app.use("/insights", verifyAuth, insightRoutes);

// 제품과 대시보드 라우트 추가 (SSE 엔드포인트 제외)
app.use("/products", verifyAuth, productRoutes);

// 리뷰 단독 분석 API (FastAPI 연동 테스트용)
app.use("/reviews", verifyAuth, reviewRoutes);

// Health check 엔드포인트 (Docker healthcheck용)
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});