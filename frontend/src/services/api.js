import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ✅ 요청 인터셉터: JWT 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // 대시보드 요청인 경우 상세 로깅
  if (config.url?.includes('/dashboard')) {
    console.log("🔍 API 요청 인터셉터:", {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      hasToken: !!token,
      headers: config.headers,
      hasSignal: !!config.signal,
    });
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
            localStorage.removeItem("token");
        }
        return Promise.reject(error);
    }
);

export default api;