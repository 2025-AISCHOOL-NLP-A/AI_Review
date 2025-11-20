/**
 * 입력 데이터 Sanitization 유틸리티
 * XSS, SQL Injection 등 공격을 방지하기 위한 입력 정리 함수들
 */

/**
 * HTML 태그 제거 및 이스케이프
 * @param {string} input - 입력 문자열
 * @returns {string} 정리된 문자열
 */
export const sanitizeHtml = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // HTML 태그 제거
  const withoutTags = input.replace(/<[^>]*>/g, '');
  
  // HTML 엔티티 디코딩 후 다시 인코딩 (이중 인코딩 방지)
  const decoded = withoutTags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // 특수 문자 이스케이프
  return decoded
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * SQL Injection 위험 문자 제거
 * @param {string} input - 입력 문자열
 * @returns {string} 정리된 문자열
 */
export const sanitizeSql = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // SQL Injection 위험 문자 제거
  return input
    .replace(/['";\\]/g, '') // 작은따옴표, 큰따옴표, 세미콜론, 백슬래시 제거
    .replace(/--/g, '') // SQL 주석 제거
    .replace(/\/\*/g, '') // 블록 주석 시작 제거
    .replace(/\*\//g, '') // 블록 주석 끝 제거
    .replace(/;/g, ''); // 세미콜론 제거
};

/**
 * 경로 조작 문자 제거
 * @param {string} input - 입력 문자열
 * @returns {string} 정리된 문자열
 */
export const sanitizePath = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // 경로 조작 문자 제거
  return input
    .replace(/[\/\\]/g, '') // 슬래시, 백슬래시 제거
    .replace(/\.\./g, '') // 상위 디렉토리 표시 제거
    .replace(/[?%*:|"<>]/g, ''); // 특수 문자 제거
};

/**
 * JavaScript 코드 주입 방지
 * @param {string} input - 입력 문자열
 * @returns {string} 정리된 문자열
 */
export const sanitizeScript = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // JavaScript 이벤트 핸들러 및 스크립트 태그 제거
  return input
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // onclick, onerror 등 제거
    .replace(/<script/gi, '')
    .replace(/<\/script>/gi, '')
    .replace(/eval\(/gi, '')
    .replace(/expression\(/gi, '');
};

/**
 * 일반 텍스트 입력 정리 (기본)
 * @param {string} input - 입력 문자열
 * @param {Object} options - 옵션
 * @param {boolean} options.allowHtml - HTML 허용 여부 (기본: false)
 * @param {boolean} options.maxLength - 최대 길이
 * @param {boolean} options.trim - 앞뒤 공백 제거 여부 (기본: true)
 * @returns {string} 정리된 문자열
 */
export const sanitizeText = (input, options = {}) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const { allowHtml = false, maxLength = null, trim = true } = options;
  let sanitized = trim ? input.trim() : input;

  // HTML 제거 (허용하지 않는 경우)
  if (!allowHtml) {
    sanitized = sanitizeHtml(sanitized);
  }

  // 스크립트 제거
  sanitized = sanitizeScript(sanitized);

  // 길이 제한
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * 이메일 주소 정리 및 검증
 * @param {string} email - 이메일 주소
 * @returns {string} 정리된 이메일 주소 또는 빈 문자열
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // 기본 정리
  let sanitized = email.trim().toLowerCase();

  // 이메일 형식 검증
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(sanitized)) {
    return '';
  }

  // 특수 문자 제거 (이메일 형식에 맞지 않는 것들)
  sanitized = sanitized.replace(/[<>'"\\]/g, '');

  return sanitized;
};

/**
 * 숫자만 추출
 * @param {string} input - 입력 문자열
 * @returns {string} 숫자만 포함된 문자열
 */
export const sanitizeNumber = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // 숫자만 추출
  return input.replace(/[^0-9]/g, '');
};

/**
 * URL 정리 및 검증
 * @param {string} url - URL 문자열
 * @returns {string} 정리된 URL 또는 빈 문자열
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  let sanitized = url.trim();

  // javascript:, data:, vbscript: 같은 위험한 프로토콜 제거
  const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;
  if (dangerousProtocols.test(sanitized)) {
    return '';
  }

  // http:// 또는 https://로 시작하는지 확인
  if (!/^https?:\/\//i.test(sanitized)) {
    return '';
  }

  return sanitized;
};

/**
 * 종합 입력 정리 (여러 위험 요소 제거)
 * @param {string} input - 입력 문자열
 * @param {Object} options - 옵션
 * @returns {string} 정리된 문자열
 */
export const sanitizeInput = (input, options = {}) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const {
    type = 'text', // 'text', 'email', 'number', 'url', 'path'
    maxLength = null,
    allowHtml = false,
    trim = true, // 기본적으로 trim 적용, 검색 필드 등에서는 false로 설정
  } = options;

  let sanitized = trim ? input.trim() : input;

  // 타입별 정리
  switch (type) {
    case 'email':
      return sanitizeEmail(sanitized);
    case 'number':
      return sanitizeNumber(sanitized);
    case 'url':
      return sanitizeUrl(sanitized);
    case 'path':
      sanitized = sanitizePath(sanitized);
      break;
    default:
      // text 타입
      sanitized = sanitizeText(sanitized, { allowHtml, maxLength, trim });
      break;
  }

  // SQL Injection 방지 (경로 제외)
  if (type !== 'path') {
    sanitized = sanitizeSql(sanitized);
  }

  return sanitized;
};

/**
 * 객체의 모든 문자열 값 정리 (재귀적)
 * @param {Object|Array} obj - 정리할 객체 또는 배열
 * @param {Object} options - 옵션
 * @returns {Object|Array} 정리된 객체 또는 배열
 */
export const sanitizeObject = (obj, options = {}) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeInput(obj, options);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key], options);
      }
    }
    return sanitized;
  }

  return obj;
};

