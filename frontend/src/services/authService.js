// src/services/authService.js
import api from "./api";

const authService = {
  /** 🔐 로그인 */
  async login(loginId, password) {
    try {
      const res = await api.post("/auth/login", {
        login_id: loginId,
        password,
      });

      // ✅ JWT 토큰 저장
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      return { success: true, data: res.data };
    } catch (err) {
      console.error("로그인 요청 중 오류:", err);
      const msg = err.response?.data?.message || "로그인에 실패했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 🚪 로그아웃 */
  logout() {
    localStorage.removeItem("token");
  },

  /** 🧍 회원가입 */
  async join(userId, password, email) {
    try {
      const res = await api.post("/auth/join", {
        user_id: userId,
        password,
        email,
      });
      return { success: true, message: res.data.message };
    } catch (err) {
      console.error("회원가입 요청 중 오류:", err);
      const msg = err.response?.data?.message || "회원가입 중 오류가 발생했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 🔎 아이디 중복 검사 */
  async checkDuplicate(userId) {
    try {
      const res = await api.post("/auth/check-duplicate", { user_id: userId });
      return { success: true, exists: res.data.exists };
    } catch (err) {
      const msg = err.response?.data?.message || "중복 검사 중 오류가 발생했습니다.";
      return { success: false, message: msg };
    }
  },

  /** ✉️ 이메일 인증번호 발송 */
  async sendVerification(email) {
    try {
      const res = await api.post("/auth/send-verification", { email });
      return { success: true, message: res.data.message };
    } catch (err) {
      console.error("이메일 인증번호 발송 오류:", err);
      const msg = err.response?.data?.message || "이메일 발송 중 오류가 발생했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 🧾 이메일 인증번호 확인 */
  async verifyCode(email, code) {
    try {
      const res = await api.post("/auth/verify-code", { email, code });
      return { success: true, message: res.data.message };
    } catch (err) {
      console.error("이메일 인증번호 확인 오류:", err);
      const msg = err.response?.data?.message || "인증번호 확인 중 오류가 발생했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 🆔 아이디 찾기 */
  async findId(email) {
    try {
      const res = await api.post("/auth/find-id", { email });
      return {
        success: true,
        loginId: res.data.login_id,
        message: res.data.message,
      };
    } catch (err) {
      console.error("아이디 찾기 오류:", err);
      const msg = err.response?.data?.message || "일치하는 정보를 찾을 수 없습니다.";
      return { success: false, message: msg };
    }
  },

  /** 🔑 비밀번호 찾기 */
  async findPassword(loginId, email) {
    try {
      const res = await api.post("/auth/find-password", {
        login_id: loginId,
        email,
      });
      return { success: true, message: res.data.message };
    } catch (err) {
      console.error("비밀번호 찾기 오류:", err);
      const msg = err.response?.data?.message || "비밀번호 찾기 중 오류가 발생했습니다.";
      return { success: false, message: msg };
    }
  },
};

export default authService;
