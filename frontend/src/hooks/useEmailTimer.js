import { useState, useEffect, useRef } from "react";

/**
 * 이메일 인증 타이머 커스텀 훅
 * localStorage를 사용하여 페이지 새로고침 후에도 타이머 유지
 */
export function useEmailTimer(initialTimer = 0) {
  const [timer, setTimer] = useState(initialTimer);
  const timerRef = useRef(null);

  // 페이지 로드 시 타이머 복원
  useEffect(() => {
    const savedTimerEndTime = localStorage.getItem("emailVerificationTimerEnd");
    if (savedTimerEndTime) {
      const endTime = parseInt(savedTimerEndTime, 10);
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      if (remaining > 0) {
        setTimer(remaining);
      } else {
        // 타이머가 이미 만료된 경우
        localStorage.removeItem("emailVerificationTimerEnd");
      }
    }
  }, []);

  // 타이머 실행
  useEffect(() => {
    if (timer > 0) {
      // localStorage에 타이머 종료 시간 저장
      const endTime = Date.now() + timer * 1000;
      localStorage.setItem("emailVerificationTimerEnd", endTime.toString());

      timerRef.current = setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);
    } else {
      // 타이머가 0이 되면 localStorage에서 제거
      localStorage.removeItem("emailVerificationTimerEnd");
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timer]);

  // 타이머 시작 (60초)
  const startTimer = () => {
    setTimer(60);
    const endTime = Date.now() + 60 * 1000;
    localStorage.setItem("emailVerificationTimerEnd", endTime.toString());
  };

  // 타이머 초기화
  const resetTimer = () => {
    setTimer(0);
    localStorage.removeItem("emailVerificationTimerEnd");
  };

  // 타이머 포맷팅 (MM:SS)
  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  return {
    timer,
    startTimer,
    resetTimer,
    formatTimer,
    isActive: timer > 0,
  };
}

