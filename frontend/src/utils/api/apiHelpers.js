/**
 * API 요청 헬퍼 함수
 * 공통 API 호출 패턴을 추상화
 */

/**
 * AbortSignal을 포함한 config 객체 생성
 * @param {AbortSignal|null} signal - AbortSignal
 * @param {Object} additionalConfig - 추가 설정
 * @returns {Object} config 객체
 */
export const createApiConfig = (signal = null, additionalConfig = {}) => {
  if (signal) {
    return { signal, ...additionalConfig };
  }
  return additionalConfig;
};

/**
 * 쿼리 파라미터를 포함한 config 객체 생성
 * @param {AbortSignal|null} signal - AbortSignal
 * @param {Object} params - 쿼리 파라미터
 * @returns {Object} config 객체
 */
export const createApiConfigWithParams = (signal = null, params = {}) => {
  if (signal) {
    return { params, signal };
  }
  return { params };
};

