import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

// ✅ CORS는 딱 한 번만, JSON 파서보다 먼저 설정
app.use(cors({
  origin: "http://localhost:5173", // React dev server 주소
  credentials: true,
}));

// ✅ JSON Body 파서
app.use(express.json());
// ✅ 라우트 등록
app.use("/auth", authRoutes);
// ✅ 이메일 인증 라우터 등록
// app.use("/api/auth", authRoutes);

// ✅ 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
