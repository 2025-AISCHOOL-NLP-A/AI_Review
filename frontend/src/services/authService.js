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
      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);
        // 이메일 정보도 localStorage에 저장
        if (res.data.user && res.data.user.email) {
          localStorage.setItem("userEmail", res.data.user.email);
        }
        return { success: true, data: res.data };
      }
      
      // 토큰이 없으면 실패로 처리
      return { success: false, message: "로그인에 실패했습니다." };
    } catch (err) {
      // 401 에러는 정상적인 로그인 실패이므로 에러를 throw하지 않고 처리
      if (err.response && err.response.status === 401) {
        const msg = err.response?.data?.message || "아이디 또는 비밀번호가 올바르지 않습니다.";
        return { success: false, message: msg };
      }
      // 기타 에러
      const msg = err.response?.data?.message || "로그인에 실패했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 🚪 로그아웃 */
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
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
      const msg = err.response?.data?.message || "이메일 발송 중 오류가 발생했습니다.";
      return { success: false, message: msg };
    }
  },

  /** ✅ 이메일 인증번호 확인 */
  async verifyCode(email, code) {
    try {
      const res = await api.post("/auth/verify-code", { email, code });
      return { success: true, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || "인증번호가 일치하지 않습니다.";
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
      const msg = err.response?.data?.message || "비밀번호 찾기 중 오류가 발생했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 👤 현재 사용자 정보 가져오기 */
  async getMe() {
    try {
      const res = await api.get("/auth/verify");
      if (res.data.valid && res.data.user) {
        // JWT에 있는 정보만 반환 (id, login_id)
        // email은 localStorage에서 가져오기 (로그인 시 저장됨)
        const email = localStorage.getItem("userEmail") || "";
        return {
          id: res.data.user.id,
          login_id: res.data.user.login_id,
          email: email
        };
      }
      throw new Error("사용자 정보를 가져올 수 없습니다.");
    } catch (err) {
      console.error("사용자 정보 조회 중 오류:", err);
      throw err;
    }
  },

  /** ✏️ 회원정보 수정 */
  async updateProfile(payload) {
    try {
      const res = await api.post("/auth/update-profile", payload);
      return { success: true, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || "회원정보 수정 중 오류가 발생했습니다.";
      return { success: false, message: msg };
    }
  },
};

export default authService;
