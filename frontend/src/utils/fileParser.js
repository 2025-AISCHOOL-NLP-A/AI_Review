/**
 * 파일 파싱 유틸리티 함수
 * CSV 및 Excel 파일 파싱 로직을 분리하여 재사용 가능하게 만듦
 */

import * as XLSX from "xlsx";
import { validateFileExtension, validateMimeType, validateFileSize } from "./fileValidation";

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
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    if (file.size > MAX_SIZE) {
      reject(new Error("파일 크기가 너무 큽니다. (최대 500MB)"));
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
            row[header] = value !== undefined && value !== null 
              ? String(value).trim() 
              : "";
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

