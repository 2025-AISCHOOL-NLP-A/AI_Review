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
        if (isMounted) {
          setIsAuthenticated(false);
          setLoading(false);
          localStorage.removeItem("token");
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

