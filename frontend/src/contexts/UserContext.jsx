import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";
import { isTokenExpired } from "../utils/auth/tokenUtils";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // 사용자 정보 로드
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const loadUser = async () => {
      // 초기 상태: 로딩 중으로 설정
      if (isMounted && !abortController.signal.aborted) {
        setLoading(true);
      }

      const token = sessionStorage.getItem("token");
      if (!token) {
        if (isMounted && !abortController.signal.aborted) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      // 토큰 만료 체크 - 만료된 토큰은 즉시 제거하고 로그아웃 처리
      if (isTokenExpired(token)) {
        if (isMounted && !abortController.signal.aborted) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("userEmail");
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      try {
        const userData = await authService.getMe(abortController.signal);
        if (isMounted && !abortController.signal.aborted) {
          // 토큰이 다시 체크되어 유효한 경우에만 인증 상태 설정
          const currentToken = sessionStorage.getItem("token");
          if (currentToken && !isTokenExpired(currentToken)) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // 요청 중에 토큰이 만료된 경우
            setUser(null);
            setIsAuthenticated(false);
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("userEmail");
          }
          setLoading(false);
        }
      } catch (error) {
        // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
        if (error.name === 'AbortError' || error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || abortController.signal.aborted) {
          return;
        }
        // 401 오류는 토큰이 만료되었거나 유효하지 않은 경우
        if (error.response && error.response.status === 401) {
          if (isMounted && !abortController.signal.aborted) {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("userEmail");
          }
        } else {
          if (isMounted && !abortController.signal.aborted) {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
          }
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    // 토큰 만료 체크
    if (isTokenExpired(token)) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("userEmail");
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      const userData = await authService.getMe();
      // 토큰이 여전히 유효한지 다시 확인
      const currentToken = sessionStorage.getItem("token");
      if (currentToken && !isTokenExpired(currentToken)) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userEmail");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setUser(null);
        setIsAuthenticated(false);
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userEmail");
      } else {
        // 다른 오류도 처리
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  };

  // 로그아웃
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    refreshUser,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;

