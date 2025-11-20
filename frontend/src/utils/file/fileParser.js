/**
 * 파일 파싱 유틸리티 함수
 * CSV 및 Excel 파일 파싱 로직을 분리하여 재사용 가능하게 만듦
 */

import * as XLSX from "xlsx";
import { validateFileExtension, validateMimeType, validateFileSize } from "./fileValidation";

/**
 * Excel 날짜 일련번호를 YYYY-MM-DD 형식 문자열로 변환
 * Excel은 1900-01-01을 기준일(serial number 1)로 사용하며,
 * 1900년을 윤년으로 잘못 처리하는 버그가 있음 (Lotus 1-2-3 호환성)
 * 
 * @param {number} serialNumber - Excel 날짜 일련번호
 * @returns {string|number} YYYY-MM-DD 형식 문자열 또는 원본 값
 */
const convertExcelDateToString = (serialNumber) => {
  // 숫자가 아니거나 유효한 날짜 범위가 아니면 원본 반환
  if (typeof serialNumber !== 'number' || serialNumber < 1 || serialNumber > 100000) {
    return serialNumber;
  }

  let date;

  // Excel의 1900 윤년 버그 처리
  if (serialNumber <= 60) {
    // 1900-01-01 ~ 1900-02-29 (60은 존재하지 않는 1900-02-29)
    // 기준일: 1899-12-31
    const excelEpoch = new Date(1899, 11, 31);
    date = new Date(excelEpoch.getTime() + serialNumber * 86400000);
  } else {
    // 1900-03-01 이후 (serial number 61부터)
    // 버그 보정: 1일 빼기
    const excelEpoch = new Date(1899, 11, 30);
    date = new Date(excelEpoch.getTime() + serialNumber * 86400000);
  }

  // 유효한 날짜인지 확인
  if (isNaN(date.getTime())) {
    return serialNumber;
  }

  // YYYY-MM-DD 형식으로 포맷
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * CSV 파일 파싱 (따옴표 처리 개선)
 * @param {string} text - CSV 파일 텍스트
 * @returns {Object|null} { headers: string[], rows: Object[] } 또는 null
 */
export const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return null;

  // CSV 파싱 헬퍼 함수 (따옴표 처리)
  const parseCSVLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // 다음 따옴표 건너뛰기
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, ""));
  const rows = [];

  for (let i = 1; i < Math.min(lines.length, 6); i++) {
    const values = parseCSVLine(lines[i]).map((v) => v.replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }

  return { headers, rows };
};

/**
 * Excel 파일 파싱
 * @param {File} file - Excel 파일
 * @returns {Promise<Object|null>} { headers: string[], rows: Object[] } 또는 null
 */
export const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // 파일 크기 제한 (추가 안전장치)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      reject(new Error("파일 크기가 너무 큽니다. (최대 10MB)"));
      return;
    }

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);

        // Excel 파일 파싱 옵션: 매크로 비활성화, 안전 모드
        const workbook = XLSX.read(data, {
          type: "array",
          cellFormula: false, // 수식 비활성화 (보안)
          cellHTML: false, // HTML 비활성화 (보안)
        });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          resolve(null);
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          resolve(null);
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "", // 빈 셀 기본값
        });

        if (jsonData.length === 0) {
          resolve(null);
          return;
        }

        const headers = jsonData[0].map((h) => String(h || "").trim());

        // 헤더 검증
        if (headers.length === 0 || headers.every(h => h === "")) {
          reject(new Error("파일에 유효한 헤더가 없습니다."));
          return;
        }

        const rows = [];

        for (let i = 1; i < Math.min(jsonData.length, 6); i++) {
          const row = {};
          headers.forEach((header, idx) => {
            // 값 정리 및 안전 처리
            const value = jsonData[i][idx];

            if (value === undefined || value === null) {
              row[header] = "";
            } else if (typeof value === 'number') {
              // 숫자 값이 Excel 날짜 일련번호일 가능성 확인 후 변환
              const converted = convertExcelDateToString(value);
              row[header] = String(converted).trim();
            } else {
              row[header] = String(value).trim();
            }
          });
          rows.push(row);
        }

        resolve({ headers, rows });
      } catch (error) {
        reject(new Error(`Excel 파일 파싱 중 오류가 발생했습니다: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("파일을 읽는 중 오류가 발생했습니다."));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * 파일 선택 및 파싱
 * @param {File} file - 선택된 파일
 * @returns {Promise<Object|null>} { headers: string[], rows: Object[] } 또는 null
 */
export const parseFile = async (file) => {
  // 파일 크기 재검증 (이중 체크)
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    throw new Error(sizeValidation.error);
  }

  // 확장자 검증
  const extensionValidation = validateFileExtension(file.name);
  if (!extensionValidation.valid) {
    throw new Error(extensionValidation.error);
  }

  const extension = extensionValidation.extension;

  // MIME 타입 검증
  const mimeValidation = validateMimeType(file, extension);
  if (!mimeValidation.valid) {
    throw new Error(mimeValidation.error);
  }

  // 파일 파싱
  if (extension === ".csv") {
    const text = await file.text();
    return parseCSV(text);
  } else if (extension === ".xlsx" || extension === ".xls") {
    return await parseExcel(file);
  } else {
    throw new Error("CSV 또는 Excel 파일만 업로드할 수 있습니다.");
  }
};

