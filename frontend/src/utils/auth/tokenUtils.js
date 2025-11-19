/**
 * JWT 토큰 관련 유틸리티 함수
 */

/**
 * JWT 토큰에서 만료 시간 가져오기
 * @param {string} token - JWT 토큰
 * @returns {number|null} 만료 시간 (밀리초), 파싱 실패 시 null
 */
export const getTokenExpirationTime = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // JWT exp는 초 단위이므로 밀리초로 변환
    return exp;
  } catch (error) {
    return null;
  }
};

/**
 * JWT 토큰 만료 여부 확인
 * @param {string} token - JWT 토큰
 * @returns {boolean} 만료 여부
 */
export const isTokenExpired = (token) => {
  const exp = getTokenExpirationTime(token);
  if (!exp) return true;
  return Date.now() >= exp;
};

/**
 * 로그아웃까지 남은 시간 계산 (밀리초)
 * @param {string} token - JWT 토큰
 * @returns {number|null} 남은 시간 (밀리초), 토큰이 없거나 만료된 경우 null
 */
export const getRemainingTime = (token) => {
  if (!token) return null;
  const exp = getTokenExpirationTime(token);
  if (!exp) return null;
  const remaining = exp - Date.now();
  return remaining > 0 ? remaining : null;
};

/**
 * 밀리초를 시간:분:초 형식으로 변환
 * @param {number} ms - 밀리초
 * @returns {string} "HH:MM:SS" 형식의 문자열
 */
export const formatRemainingTime = (ms) => {
  if (ms === null || ms <= 0) return "00:00:00";
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

