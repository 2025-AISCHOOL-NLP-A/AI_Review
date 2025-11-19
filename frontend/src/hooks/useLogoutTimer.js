import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../utils/storage";
import { getRemainingTime, formatRemainingTime, isTokenExpired } from "../utils/tokenUtils";
import { useUser } from "../contexts/UserContext";

/**
 * 로그아웃까지 남은 시간을 실시간으로 추적하는 커스텀 훅
 * 세션 만료 시 자동으로 로그아웃 처리
 * @returns {Object} { remainingTime: string, isExpired: boolean }
 */
export const useLogoutTimer = () => {
  const [remainingTime, setRemainingTime] = useState("00:00:00");
  const [isExpired, setIsExpired] = useState(false);
  const navigate = useNavigate();
  const { logout } = useUser();

  useEffect(() => {
    const updateTimer = () => {
      const token = getToken();
      if (!token) {
        setRemainingTime("00:00:00");
        setIsExpired(true);
        return;
      }

      // 토큰 만료 체크
      if (isTokenExpired(token)) {
        setRemainingTime("00:00:00");
        setIsExpired(true);
        // 세션 만료 시 자동 로그아웃 처리
        logout();
        // 로그인 페이지로 리다이렉트
        navigate("/login", { replace: true, state: { expired: true } });
        return;
      }

      const remaining = getRemainingTime(token);
      if (remaining === null || remaining <= 0) {
        setRemainingTime("00:00:00");
        setIsExpired(true);
        // 세션 만료 시 자동 로그아웃 처리
        logout();
        navigate("/login", { replace: true, state: { expired: true } });
        return;
      }

      setRemainingTime(formatRemainingTime(remaining));
      setIsExpired(false);
    };

    // 초기 업데이트
    updateTimer();

    // 1초마다 업데이트
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [navigate, logout]);

  return { remainingTime, isExpired };
};

