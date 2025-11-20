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
    primary: getColorFromCSSVar(element, '--chart-primary-color', "#6F98FF"),
    primaryHover: getColorFromCSSVar(element, '--chart-primary-hover', "#587FE6"),
    primaryBg: getColorFromCSSVar(element, '--chart-primary-bg', "rgba(111, 152, 255, 0.25)"),
    neutral: getColorFromCSSVar(element, '--chart-neutral-color', "#FFC577"),
    neutralHover: getColorFromCSSVar(element, '--chart-neutral-hover', "#F3B96B"),
    neutralBg: getColorFromCSSVar(element, '--chart-neutral-bg', "rgba(255, 197, 119, 0.25)"),
    lineColor: getColorFromCSSVar(element, '--chart-line-color', "rgba(0, 0, 0, 0.8)"),
    gridColor: getColorFromCSSVar(element, '--chart-grid-color', "rgba(0, 0, 0, 0.1)"),
    textColor: getColorFromCSSVar(element, '--chart-text-color', "#6B7280"),
  };
};


