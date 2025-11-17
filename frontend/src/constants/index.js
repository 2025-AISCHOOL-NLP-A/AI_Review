/**
 * Constants 모음
 * 모든 상수를 한 곳에서 export하여 관리
 */

export { TERMS_OF_SERVICE, PRIVACY_POLICY } from "./terms";

// 카테고리 상수
export const CATEGORIES = {
  ELECTRONICS: 101,
  COSMETICS: 102,
  GAMES: 103,
};

export const CATEGORY_NAMES = {
  [CATEGORIES.ELECTRONICS]: "전자기기",
  [CATEGORIES.COSMETICS]: "화장품",
  [CATEGORIES.GAMES]: "게임",
};

// 기본 설정 상수
export const DEFAULT_PRODUCTS_PER_PAGE = 10;
export const DEFAULT_EMAIL_TIMER_SECONDS = 60;

// localStorage 키
export const STORAGE_KEYS = {
  SIDEBAR_OPEN: "sidebarOpen",
  SETTINGS_OPEN: "settingsOpen",
  EMAIL_TIMER_END: "emailVerificationTimerEnd",
};

