import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

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
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted && !abortController.signal.aborted) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      try {
        const userData = await authService.getMe(abortController.signal);
        if (isMounted && !abortController.signal.aborted) {
          setUser(userData);
          setIsAuthenticated(true);
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
            localStorage.removeItem("token");
            localStorage.removeItem("userEmail");
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
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      const userData = await authService.getMe();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
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

