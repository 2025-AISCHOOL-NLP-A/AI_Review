/**
 * 파일 업로드 보안 검증 유틸리티
 */

// 파일 크기 제한 (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 최대 파일 개수
export const MAX_FILES = 5;

// 허용된 MIME 타입
export const ALLOWED_MIME_TYPES = {
  csv: [
    'text/csv',
    'application/csv',
    'text/plain',
    'application/vnd.ms-excel', // 일부 시스템에서 CSV를 이렇게 인식
  ],
  xlsx: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  xls: [
    'application/vnd.ms-excel',
    'application/excel',
  ],
};

// 허용된 파일 확장자
export const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

/**
 * 파일 크기 검증
 * @param {File} file - 검증할 파일
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateFileSize = (file) => {
  if (!file || !file.size) {
    return { valid: false, error: '파일이 비어있습니다.' };
  }

  if (file.size === 0) {
    return { valid: false, error: '빈 파일은 업로드할 수 없습니다.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(1);
    return { 
      valid: false, 
      error: `파일 크기는 ${maxSizeMB}MB 이하여야 합니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)` 
    };
  }

  return { valid: true };
};

/**
 * 파일 확장자 검증
 * @param {string} fileName - 파일명
 * @returns {Object} { valid: boolean, extension?: string, error?: string }
 */
export const validateFileExtension = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return { valid: false, error: '파일명이 올바르지 않습니다.' };
  }

  const lowerFileName = fileName.toLowerCase();
  const extension = ALLOWED_EXTENSIONS.find(ext => lowerFileName.endsWith(ext));

  if (!extension) {
    return { 
      valid: false, 
      error: `허용된 파일 형식만 업로드할 수 있습니다. (${ALLOWED_EXTENSIONS.join(', ')})` 
    };
  }

  return { valid: true, extension };
};

/**
 * MIME 타입 검증
 * @param {File} file - 검증할 파일
 * @param {string} expectedExtension - 예상 확장자 (.csv, .xlsx, .xls)
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateMimeType = (file, expectedExtension) => {
  // MIME 타입이 없는 경우 (일부 브라우저/시스템) 확장자만으로 검증
  if (!file.type || file.type === '') {
    // 확장자 검증은 이미 통과했으므로 허용
    return { valid: true };
  }

  const extension = expectedExtension.toLowerCase();
  let allowedTypes = [];

  if (extension === '.csv') {
    allowedTypes = ALLOWED_MIME_TYPES.csv;
  } else if (extension === '.xlsx') {
    allowedTypes = ALLOWED_MIME_TYPES.xlsx;
  } else if (extension === '.xls') {
    allowedTypes = ALLOWED_MIME_TYPES.xls;
  } else {
    return { valid: false, error: '지원하지 않는 파일 형식입니다.' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `파일 형식이 올바르지 않습니다. ${extension} 파일만 업로드할 수 있습니다.` 
    };
  }

  return { valid: true };
};

/**
 * 파일명 검증 및 정리
 * @param {string} fileName - 원본 파일명
 * @returns {Object} { valid: boolean, sanitized?: string, error?: string }
 */
export const validateAndSanitizeFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return { valid: false, error: '파일명이 올바르지 않습니다.' };
  }

  // 경로 조작 문자 제거
  const dangerousChars = /[\/\\?%*:|"<>]/g;
  if (dangerousChars.test(fileName)) {
    return { 
      valid: false, 
      error: '파일명에 허용되지 않은 문자가 포함되어 있습니다. (/, \\, ?, %, *, :, |, ", <, >)' 
    };
  }

  // 파일명 길이 제한 (255자)
  if (fileName.length > 255) {
    return { 
      valid: false, 
      error: '파일명이 너무 깁니다. (최대 255자)' 
    };
  }

  // 빈 파일명 체크
  const trimmed = fileName.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: '파일명이 비어있습니다.' };
  }

  // 정리된 파일명 반환
  const sanitized = trimmed.replace(/\s+/g, ' '); // 연속된 공백 제거

  return { valid: true, sanitized };
};

/**
 * 파일 개수 검증
 * @param {number} currentCount - 현재 파일 개수
 * @param {number} additionalCount - 추가할 파일 개수
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateFileCount = (currentCount, additionalCount = 1) => {
  const totalCount = currentCount + additionalCount;

  if (totalCount > MAX_FILES) {
    return { 
      valid: false, 
      error: `최대 ${MAX_FILES}개의 파일만 업로드할 수 있습니다. (현재: ${currentCount}개, 추가 시도: ${totalCount}개)` 
    };
  }

  return { valid: true };
};

/**
 * 종합 파일 검증
 * @param {File} file - 검증할 파일
 * @param {number} currentFileCount - 현재 업로드된 파일 개수
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateFile = (file, currentFileCount = 0) => {
  // 1. 파일 존재 확인
  if (!file) {
    return { valid: false, error: '파일이 선택되지 않았습니다.' };
  }

  // 2. 파일명 검증
  const fileNameValidation = validateAndSanitizeFileName(file.name);
  if (!fileNameValidation.valid) {
    return fileNameValidation;
  }

  // 3. 확장자 검증
  const extensionValidation = validateFileExtension(file.name);
  if (!extensionValidation.valid) {
    return extensionValidation;
  }

  // 4. MIME 타입 검증
  const mimeValidation = validateMimeType(file, extensionValidation.extension);
  if (!mimeValidation.valid) {
    return mimeValidation;
  }

  // 5. 파일 크기 검증
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // 6. 파일 개수 검증
  const countValidation = validateFileCount(currentFileCount, 1);
  if (!countValidation.valid) {
    return countValidation;
  }

  return { valid: true };
};

