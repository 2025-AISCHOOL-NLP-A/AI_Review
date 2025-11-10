import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import authService from "../services/authService";

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      try {
        await authService.getMe();
        if (isMounted) {
          setIsAuthenticated(true);
          setLoading(false);
        }
      } catch (error) {
        // 401 오류는 토큰이 만료되었거나 유효하지 않은 정상적인 상황
        // 콘솔에 로그하지 않음
        if (isMounted) {
          setIsAuthenticated(false);
          setLoading(false);
          // 토큰은 이미 api 인터셉터에서 제거되었을 수 있음
          localStorage.removeItem("token");
          localStorage.removeItem("userEmail");
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;

