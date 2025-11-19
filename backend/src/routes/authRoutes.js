import express from "express";
import {
  registerUser,
  loginUser,
  checkDuplicate,
  sendVerification,
  findId,
  findPassword,
  verifyToken,
  verifyEmailCode,
  updateProfile,
  withdrawUser,
  refreshToken,
} from "../controllers/authController.js";

const router = express.Router();

// 회원가입
router.post("/join", registerUser);
// 로그인
router.post("/login", loginUser);
// 아이디 중복 검사
router.post("/check-duplicate", checkDuplicate);
// 이메일 인증번호 발송
router.post("/send-verification", sendVerification);
// 이메일 인증번호 확인
router.post("/verify-code", verifyEmailCode);
// 아이디 찾기
router.post("/find-id", findId);
// 비밀번호 찾기
router.post("/find-password", findPassword);
// 회원정보 수정
router.post("/update-profile", updateProfile);
// JWT 토큰 검증
router.get("/verify", verifyToken);
// 🔄 토큰 갱신 (세션 시간 연장)
router.post("/refresh", refreshToken);
// 🔹 회원탈퇴
router.delete("/withdraw", withdrawUser);

export default router;