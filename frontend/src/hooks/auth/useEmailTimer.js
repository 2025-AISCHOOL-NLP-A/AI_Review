import { useState, useEffect, useRef, useCallback } from "react";

/**
 * 이메일 인증 타이머 커스텀 훅
 * localStorage를 사용하여 페이지 새로고침 후에도 타이머 유지
 */
const TIMER_STORAGE_KEY = "emailVerificationTimerEnd";
const DEFAULT_TIMER_SECONDS = 60;

export function useEmailTimer(initialTimer = 0) {
  const [timer, setTimer] = useState(initialTimer);
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
      // localStorage에 타이머 종료 시간 저장
      const endTime = Date.now() + timer * 1000;
      localStorage.setItem(TIMER_STORAGE_KEY, endTime.toString());

      timerRef.current = setTimeout(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      // 타이머가 0이 되면 localStorage에서 제거
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
  };
}

