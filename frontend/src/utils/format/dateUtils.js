/**
 * 날짜 관련 유틸리티 함수
 * 날짜 형식 변환 및 처리에 사용되는 공통 함수
 */

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 * @param {Date|string} date - 변환할 날짜
 * @returns {string} YYYY-MM-DD 형식의 날짜 문자열
 */
export const formatDateToYYYYMMDD = (date) => {
  if (!date) return "";
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
 * @returns {string} YYYY-MM-DD 형식의 오늘 날짜
 */
export const getTodayDate = () => {
  return formatDateToYYYYMMDD(new Date());
};

/**
 * 날짜 문자열을 Date 객체로 변환 (안전한 변환)
 * @param {string} dateStr - 날짜 문자열
 * @returns {Date|null} Date 객체 또는 null
 */
export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * 날짜 범위 체크
 * @param {string|Date} date - 확인할 날짜
 * @param {string|Date} startDate - 시작 날짜
 * @param {string|Date} endDate - 종료 날짜
 * @returns {boolean} 날짜가 범위 내에 있는지 여부
 */
export const isDateInRange = (date, startDate, endDate) => {
  const targetDate = formatDateToYYYYMMDD(date);
  if (!targetDate) return false;
  
  if (startDate && endDate) {
    const start = formatDateToYYYYMMDD(startDate);
    const end = formatDateToYYYYMMDD(endDate);
    return targetDate >= start && targetDate <= end;
  } else if (startDate) {
    const start = formatDateToYYYYMMDD(startDate);
    return targetDate >= start;
  } else if (endDate) {
    const end = formatDateToYYYYMMDD(endDate);
    return targetDate <= end;
  }
  
  return true;
};

