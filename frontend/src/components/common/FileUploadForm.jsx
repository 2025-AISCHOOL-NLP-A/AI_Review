import React, { useState, useRef } from "react";
import PreviewModal from "./PreviewModal";
import FileList from "./FileList";
import { parseFile } from "../../utils/fileParser";
import { validateFile } from "../../utils/fileValidation";
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

  // 파일 읽기 및 Preview 표시
  const handleFileSelect = async (files) => {
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    
    if (fileArray.length === 0) return;

    // 첫 번째 파일만 Preview에 표시
    const file = fileArray[0];

    // 파일 검증 (보안 체크)
    const validation = validateFile(file, mappedFiles.length);
    if (!validation.valid) {
      alert(validation.error || "파일 검증에 실패했습니다.");
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      const data = await parseFile(file);

      if (!data || !data.headers || data.headers.length === 0) {
        alert("파일을 읽을 수 없거나 데이터가 없습니다.");
        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setPreviewFile(file);
      setPreviewData(data);
    } catch (error) {
      console.error("파일 파싱 오류:", error);
      alert(error.message || "파일을 읽는 중 오류가 발생했습니다.");
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        <p className="upload-format-text">Format: Excel (.xlsx, .xls), CSV (.csv) only (최대 500MB, 최대 5개)</p>
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
      <FileList
        mappedFiles={mappedFiles}
        onDelete={handleDeleteFile}
        disabled={disabled}
      />

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

