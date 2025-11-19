/**
 * 데이터 파싱 유틸리티 함수
 * dashboardResponseProcessor.js의 파싱 로직을 공통화
 */

/**
 * JSON 문자열을 파싱하는 헬퍼 함수
 * @param {string|any} data - 파싱할 데이터
 * @param {any} defaultValue - 파싱 실패 시 기본값
 * @returns {any} 파싱된 데이터 또는 기본값
 */
export const parseJSON = (data, defaultValue) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn("JSON 파싱 실패:", e);
      return defaultValue;
    }
  }
  return data || defaultValue;
};

/**
 * 배열 타입 검증 및 변환
 * @param {any} data - 검증할 데이터
 * @param {Array} defaultValue - 기본값
 * @returns {Array} 배열 데이터
 */
export const ensureArray = (data, defaultValue = []) => {
  if (Array.isArray(data)) {
    return data;
  }
  if (typeof data === "string") {
    return parseJSON(data, defaultValue);
  }
  console.warn("배열이 아닙니다:", typeof data, data);
  return defaultValue;
};

/**
 * 객체 타입 검증 및 변환
 * @param {any} data - 검증할 데이터
 * @param {Object} defaultValue - 기본값
 * @returns {Object} 객체 데이터
 */
export const ensureObject = (data, defaultValue = {}) => {
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    return data;
  }
  if (typeof data === "string") {
    return parseJSON(data, defaultValue);
  }
  console.warn("객체가 아닙니다:", typeof data, data);
  return defaultValue;
};

