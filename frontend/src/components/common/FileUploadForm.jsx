import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import PreviewModal from "./PreviewModal";
import "../../styles/modal.css";
import "./FileUploadForm.css";

/**
 * FileUploadForm - 파일 업로드 및 컬럼 매핑 관리 공통 컴포넌트
 * 
 * @param {Object} props
 * @param {Function} props.onFilesReady - 매핑 완료된 파일들이 준비되었을 때 호출
 *   (files: Array<{ file: File, mapping: { reviewColumn, dateColumn, ratingColumn } }>) => void
 * @param {boolean} props.disabled - 업로드 비활성화 여부
 */
export default function FileUploadForm({ onFilesReady, disabled = false }) {
  const [mappedFiles, setMappedFiles] = useState([]); // [{ id, file, mapping, previewData }]
  const [previewFile, setPreviewFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // CSV 파일 파싱 (따옴표 처리 개선)
  const parseCSV = (text) => {
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

  // Excel 파일 파싱
  const parseExcel = (file) => {
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

  // 파일 읽기 및 Preview 표시
  const handleFileSelect = async (files) => {
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    
    if (fileArray.length === 0) return;

    // 첫 번째 파일만 Preview에 표시
    const file = fileArray[0];
    const fileName = file.name.toLowerCase();

    try {
      let data = null;

      if (fileName.endsWith(".csv")) {
        const text = await file.text();
        data = parseCSV(text);
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        data = await parseExcel(file);
      } else {
        alert("CSV 또는 Excel 파일만 업로드할 수 있습니다.");
        return;
      }

      if (!data || !data.headers || data.headers.length === 0) {
        alert("파일을 읽을 수 없거나 데이터가 없습니다.");
        return;
      }

      setPreviewFile(file);
      setPreviewData(data);
    } catch (error) {
      console.error("파일 파싱 오류:", error);
      alert("파일을 읽는 중 오류가 발생했습니다.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleBrowseClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  // Preview에서 확인 버튼 클릭 시
  const handlePreviewConfirm = (mapping) => {
    if (!previewFile || !previewData) return;

    // 매핑된 파일 목록에 추가
    const newMappedFile = {
      id: Date.now(),
      file: previewFile,
      mapping: mapping,
      previewData: previewData,
    };

    setMappedFiles((prev) => [...prev, newMappedFile]);

    // Preview 모달 닫기
    setPreviewFile(null);
    setPreviewData(null);
    
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // 부모 컴포넌트에 변경사항 알림
    if (onFilesReady) {
      const allMappedFiles = [...mappedFiles, newMappedFile];
      onFilesReady(allMappedFiles.map((mf) => ({
        file: mf.file,
        mapping: mf.mapping,
      })));
    }
  };

  // Preview 모달 닫기
  const handlePreviewClose = () => {
    setPreviewFile(null);
    setPreviewData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 파일 삭제
  const handleDeleteFile = (fileId) => {
    const updatedFiles = mappedFiles.filter((f) => f.id !== fileId);
    setMappedFiles(updatedFiles);

    // 부모 컴포넌트에 변경사항 알림
    if (onFilesReady) {
      onFilesReady(updatedFiles.map((mf) => ({
        file: mf.file,
        mapping: mf.mapping,
      })));
    }
  };

  // 모든 파일이 매핑되었는지 확인
  const allFilesMapped = mappedFiles.length > 0 && mappedFiles.every((f) => {
    const mapping = f.mapping;
    return mapping && mapping.reviewColumn && mapping.dateColumn;
  });

  return (
    <>
      <div
        className={`upload-dropzone ${isDragOver ? "drag-over" : ""} ${disabled ? "disabled" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleBrowseClick}
      >
        <p className="upload-text">Drop file or browse</p>
        <p className="upload-format-text">Format: Excel (.xlsx, .xls), CSV (.csv) only</p>
        <button 
          className="browse-btn" 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (!disabled) handleBrowseClick(); 
          }}
          disabled={disabled}
        >
          Browse
        </button>
        <input
          ref={fileInputRef}
          id="file_upload"
          name="files"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: "none" }}
          disabled={disabled}
        />
      </div>

      {/* 매핑 완료된 파일 목록 */}
      {mappedFiles.length > 0 && (
        <div className="mapped-files-list">
          {mappedFiles.map((mappedFile) => {
            return (
              <div key={mappedFile.id} className="mapped-file-block">
                <div className="mapped-file-info">
                  {/* 파일 아이콘 */}
                  <div className="file-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {/* 파일명 */}
                  <div className="mapped-file-name">
                    {mappedFile.file.name}
                  </div>
                </div>
                <div className="mapped-file-actions">
                  {/* 매핑 완료 체크 아이콘 */}
                  <div className="mapped-check-icon" title="매핑 완료">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {/* 삭제 버튼 */}
                  <button
                    className="delete-file-btn"
                    onClick={() => handleDeleteFile(mappedFile.id)}
                    title="삭제"
                    disabled={disabled}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview 모달 */}
      {previewFile && previewData && (
        <PreviewModal
          file={previewFile}
          previewData={previewData}
          onConfirm={handlePreviewConfirm}
          onClose={handlePreviewClose}
        />
      )}
    </>
  );
}

// 외부에서 사용할 수 있도록 유틸리티 함수 export
export { FileUploadForm };

