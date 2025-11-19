/**
 * 숫자 관련 유틸리티 함수
 * 숫자 포맷팅 및 계산에 사용되는 공통 함수
 */

/**
 * 숫자를 소수점 자릿수로 반올림
 * @param {number} value - 반올림할 숫자
 * @param {number} decimals - 소수점 자릿수 (기본값: 2)
 * @returns {number} 반올림된 숫자
 */
export const roundTo = (value, decimals = 2) => {
  if (typeof value !== "number" || isNaN(value)) return 0;
  return Number(value.toFixed(decimals));
};

/**
 * 비율을 퍼센트로 변환 (0-1 범위 → 0-100 범위)
 * @param {number} ratio - 비율 (0-1 범위)
 * @returns {number} 퍼센트 (0-100 범위)
 */
export const ratioToPercent = (ratio) => {
  if (typeof ratio !== "number" || isNaN(ratio)) return 0;
  // 이미 퍼센트 범위(100보다 크거나 같음)인 경우 그대로 반환
  if (ratio >= 100) return roundTo(ratio);
  // 0-1 범위인 경우 100을 곱해서 퍼센트로 변환
  return roundTo(ratio * 100);
};

/**
 * 퍼센트를 비율로 변환 (0-100 범위 → 0-1 범위)
 * @param {number} percent - 퍼센트 (0-100 범위)
 * @returns {number} 비율 (0-1 범위)
 */
export const percentToRatio = (percent) => {
  if (typeof percent !== "number" || isNaN(percent)) return 0;
  // 이미 비율 범위(1보다 작거나 같음)인 경우 그대로 반환
  if (percent <= 1) return roundTo(percent);
  // 0-100 범위인 경우 100으로 나눠서 비율로 변환
  return roundTo(percent / 100);
};

/**
 * 안전한 숫자 변환
 * @param {any} value - 변환할 값
 * @param {number} defaultValue - 기본값 (기본값: 0)
 * @returns {number} 변환된 숫자
 */
export const toNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * 숫자 범위 제한
 * @param {number} value - 제한할 값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @returns {number} 제한된 값
 */
export const clamp = (value, min, max) => {
  const num = toNumber(value, min);
  return Math.max(min, Math.min(max, num));
};

