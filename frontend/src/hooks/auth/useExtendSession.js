import { useState } from "react";
import authService from "../../services/authService";

export const useExtendSession = (refreshUser, isExpired) => {
  const [isExtending, setIsExtending] = useState(false);

  const handleExtendSession = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isExtending || isExpired) return;

    setIsExtending(true);
    try {
      const result = await authService.refreshToken();
      if (result.success) {
        // 사용자 정보 새로고침
        await refreshUser();
        // 성공 메시지 (선택사항 - 간단한 알림)
        alert("세션이 연장되었습니다.");
      } else {
        alert(result.message || "세션 연장에 실패했습니다.");
      }
    } catch (error) {
      console.error("세션 연장 오류:", error);
      alert("세션 연장 중 오류가 발생했습니다.");
    } finally {
      setIsExtending(false);
    }
  };

  return { isExtending, handleExtendSession };
};

