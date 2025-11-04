// API 서비스 - 백엔드와 통신
const API_BASE_URL = 'http://localhost:3000';

const authService = {
  // 로그인
  async login(loginId, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login_id: loginId,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, message: data.message || '로그인에 실패했습니다.' };
      }
    } catch (error) {
      console.error('로그인 요청 중 오류:', error);
      return { success: false, message: '로그인 요청 중 오류가 발생했습니다.' };
    }
  },

  // 아이디 중복 검사
  async checkDuplicate(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, exists: data.exists };
      } else {
        return { success: false, message: data.message || '중복 검사 중 오류가 발생했습니다.' };
      }
    } catch (error) {
      console.error('중복 검사 중 오류:', error);
      return { success: false, message: '중복 검사 중 오류가 발생했습니다.' };
    }
  },

  // 이메일 인증번호 발송
  async sendVerification(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message || '인증번호가 발송되었습니다.' };
      } else {
        return { success: false, message: data.message || '이메일 발송 중 오류가 발생했습니다.' };
      }
    } catch (error) {
      console.error('이메일 인증 요청 중 오류:', error);
      return { success: false, message: '이메일 인증 요청 중 오류가 발생했습니다.' };
    }
  },

  // 회원가입
  async join(userId, password, email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          password: password,
          email: email
        })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message || '회원가입이 완료되었습니다.' };
      } else {
        return { success: false, message: data.message || '회원가입에 실패했습니다.' };
      }
    } catch (error) {
      console.error('회원가입 요청 중 오류:', error);
      return { success: false, message: '회원가입 요청 중 오류가 발생했습니다.' };
    }
  },

  // 아이디 찾기
  async findId(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/find-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, loginId: data.login_id, message: data.message };
      } else {
        return { success: false, message: data.message || '일치하는 정보를 찾을 수 없습니다.' };
      }
    } catch (error) {
      console.error('아이디 찾기 요청 중 오류:', error);
      return { success: false, message: '요청 중 오류가 발생했습니다.' };
    }
  },

  // 비밀번호 찾기
  async findPassword(loginId, email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/find-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login_id: loginId,
          email: email
        })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message || '비밀번호 재설정 링크를 이메일로 발송했습니다.' };
      } else {
        return { success: false, message: data.message || '일치하는 정보를 찾을 수 없습니다.' };
      }
    } catch (error) {
      console.error('비밀번호 찾기 요청 중 오류:', error);
      return { success: false, message: '요청 중 오류가 발생했습니다.' };
    }
  }
};

export default authService;

