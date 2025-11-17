/**
 * 공통 에러 처리 유틸리티
 * 서비스 레이어에서 사용하는 공통 에러 처리 로직
 */

/**
 * AbortError인지 확인
 * @param {Error} error - 확인할 에러 객체
 * @returns {boolean} AbortError 여부
 */
export const isAbortError = (error) => {
  return (
    error?.name === "AbortError" ||
    error?.name === "CanceledError" ||
    error?.code === "ERR_CANCELED"
  );
};

/**
 * 에러 메시지 추출
 * @param {Error} error - 에러 객체
 * @param {string} defaultMessage - 기본 메시지
 * @returns {string} 에러 메시지
 */
export const getErrorMessage = (error, defaultMessage = "오류가 발생했습니다.") => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return defaultMessage;
};

/**
 * 공통 API 에러 처리
 * @param {Error} error - 에러 객체
 * @param {string} defaultMessage - 기본 메시지
 * @param {Function} onAbortError - AbortError 처리 함수 (선택사항)
 * @returns {Object|null} 에러 응답 객체 또는 null (AbortError인 경우)
 */
export const handleApiError = (error, defaultMessage, onAbortError = null) => {
  // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
  if (isAbortError(error)) {
    if (onAbortError) {
      onAbortError(error);
    } else {
      throw error;
    }
    return null;
  }

  const message = getErrorMessage(error, defaultMessage);
  return {
    success: false,
    message,
    status: error?.response?.status,
  };
};

/**
 * HTTP 상태 코드별 에러 메시지 매핑
 */
export const ERROR_MESSAGES = {
  400: "잘못된 요청입니다.",
  401: "인증이 필요합니다.",
  403: "접근 권한이 없습니다.",
  404: "요청한 리소스를 찾을 수 없습니다.",
  500: "서버 오류가 발생했습니다.",
};

/**
 * 상태 코드별 기본 메시지 가져오기
 * @param {number} status - HTTP 상태 코드
 * @returns {string} 에러 메시지
 */
export const getErrorMessageByStatus = (status) => {
  return ERROR_MESSAGES[status] || "오류가 발생했습니다.";
};

