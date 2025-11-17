/**
 * 파일 파싱 유틸리티 함수
 * CSV 및 Excel 파일 파싱 로직을 분리하여 재사용 가능하게 만듦
 */

import * as XLSX from "xlsx";

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
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          resolve(null);
          return;
        }

        const headers = jsonData[0].map((h) => String(h || "").trim());
        const rows = [];

        for (let i = 1; i < Math.min(jsonData.length, 6); i++) {
          const row = {};
          headers.forEach((header, idx) => {
            row[header] = String(jsonData[i][idx] || "").trim();
          });
          rows.push(row);
        }

        resolve({ headers, rows });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 파일 선택 및 파싱
 * @param {File} file - 선택된 파일
 * @returns {Promise<Object|null>} { headers: string[], rows: Object[] } 또는 null
 */
export const parseFile = async (file) => {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv")) {
    const text = await file.text();
    return parseCSV(text);
  } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    return await parseExcel(file);
  } else {
    throw new Error("CSV 또는 Excel 파일만 업로드할 수 있습니다.");
  }
};

