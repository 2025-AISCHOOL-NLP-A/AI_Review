/**
 * 스토리지 관련 유틸리티 함수
 */

/**
 * sessionStorage 키 상수
 */
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER_EMAIL: "userEmail",
};

/**
 * 토큰 저장
 * @param {string} token - JWT 토큰
 */
export const setToken = (token) => {
  sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

/**
 * 토큰 가져오기
 * @returns {string|null} JWT 토큰
 */
export const getToken = () => {
  return sessionStorage.getItem(STORAGE_KEYS.TOKEN);
};

/**
 * 토큰 제거
 */
export const removeToken = () => {
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
};

/**
 * 사용자 이메일 저장
 * @param {string} email - 사용자 이메일
 */
export const setUserEmail = (email) => {
  sessionStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
};

/**
 * 사용자 이메일 가져오기
 * @returns {string|null} 사용자 이메일
 */
export const getUserEmail = () => {
  return sessionStorage.getItem(STORAGE_KEYS.USER_EMAIL);
};

/**
 * 사용자 이메일 제거
 */
export const removeUserEmail = () => {
  sessionStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
};

/**
 * 인증 정보 제거 (토큰 + 이메일)
 */
export const clearAuthData = () => {
  removeToken();
  removeUserEmail();
};

