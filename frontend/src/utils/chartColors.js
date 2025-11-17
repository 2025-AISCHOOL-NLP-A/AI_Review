/**
 * 차트 색상 유틸리티 함수
 * CSS 변수에서 색상을 안전하게 가져오는 함수
 */

/**
 * CSS 변수에서 색상 가져오기 (더 안전한 방법)
 * @param {HTMLElement|null} element - 참조할 요소 (null이면 document.documentElement 사용)
 * @param {string} varName - CSS 변수 이름
 * @param {string} fallback - 기본값
 * @returns {string} 색상 값
 */
export const getColorFromCSSVar = (element, varName, fallback) => {
  try {
    const targetElement = element || document.documentElement;
    const value = getComputedStyle(targetElement).getPropertyValue(varName).trim();
    return value || fallback;
  } catch (error) {
    return fallback;
  }
};

/**
 * 차트에 필요한 모든 색상을 한 번에 가져오기
 * @param {HTMLElement|null} element - 참조할 요소
 * @returns {Object} 색상 객체
 */
export const getChartColors = (element = null) => {
  return {
    primary: getColorFromCSSVar(element, '--chart-primary-color', "#5B8EFF"),
    neutral: getColorFromCSSVar(element, '--chart-neutral-color', "#CBD5E1"),
    newReview: getColorFromCSSVar(element, '--chart-new-review-color', "#111827"),
    font: getColorFromCSSVar(element, '--chart-font-color', "#333333"),
  };
};

