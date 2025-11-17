import { useState, useEffect, useRef, useCallback } from "react";

/**
 * 회원정보 수정 페이지용 이메일 타이머 커스텀 훅
 * localStorage 키를 다르게 사용하여 회원가입 타이머와 구분
 */
const TIMER_STORAGE_KEY = "emailVerificationTimerEndUpdate";
const DEFAULT_TIMER_SECONDS = 60;

export const useEmailTimerUpdate = (initialTimer = 0) => {
  const [timer, setTimer] = useState(initialTimer);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const timerRef = useRef(null);

  // localStorage에서 타이머 복원
  const restoreTimer = useCallback(() => {
    const savedTimerEndTime = localStorage.getItem(TIMER_STORAGE_KEY);
    if (savedTimerEndTime) {
      const endTime = parseInt(savedTimerEndTime, 10);
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      if (remaining > 0) {
        setTimer(remaining);
        setIsEmailSent(true);
        return true;
      } else {
        localStorage.removeItem(TIMER_STORAGE_KEY);
      }
    }
    return false;
  }, []);

  // 페이지 로드 시 타이머 복원
  useEffect(() => {
    restoreTimer();
  }, [restoreTimer]);

  // 타이머 실행
  useEffect(() => {
    if (timer > 0) {
      const endTime = Date.now() + timer * 1000;
      localStorage.setItem(TIMER_STORAGE_KEY, endTime.toString());

      timerRef.current = setTimeout(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timer]);

  // 타이머 시작
  const startTimer = useCallback((seconds = DEFAULT_TIMER_SECONDS) => {
    setTimer(seconds);
    const endTime = Date.now() + seconds * 1000;
    localStorage.setItem(TIMER_STORAGE_KEY, endTime.toString());
    setIsEmailSent(true);
  }, []);

  // 타이머 초기화
  const resetTimer = useCallback(() => {
    setTimer(0);
    localStorage.removeItem(TIMER_STORAGE_KEY);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 타이머 포맷팅 (MM:SS)
  const formatTimer = useCallback(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }, [timer]);

  return {
    timer,
    startTimer,
    resetTimer,
    formatTimer,
    isActive: timer > 0,
    isEmailSent,
    setIsEmailSent,
  };
};

