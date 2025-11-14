import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// JWT 토큰 만료 시간 체크 함수
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // JWT exp는 초 단위이므로 밀리초로 변환
    return Date.now() >= exp;
  } catch (error) {
    return true; // 토큰 파싱 실패 시 만료된 것으로 간주
  }
};

// ✅ 요청 인터셉터: JWT 자동 첨부 및 만료 체크
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    // 토큰 만료 체크
    if (isTokenExpired(token)) {
      // 만료된 토큰은 제거하고 요청을 취소
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("userEmail");
      // 요청을 취소하여 401 에러를 명시적으로 발생시킴
      return Promise.reject({
        response: {
          status: 401,
          data: { message: "토큰이 만료되었습니다." }
        }
      });
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // AbortSignal은 axios가 자동으로 처리하므로 추가 작업 불필요
  return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // 토큰 만료 또는 인증 실패 시 토큰만 제거
            // 브라우저 이동은 제거 - 각 컴포넌트에서 react-router-dom의 navigate() 사용
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("userEmail");
        }
        return Promise.reject(error);
    }
);

export default api;