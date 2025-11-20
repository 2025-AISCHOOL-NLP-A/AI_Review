import React, { useState, useRef } from "react";
import PreviewModal from "./PreviewModal";
import FileList from "./FileList";
import { parseFile } from "../../utils/file/fileParser";
import { validateFile } from "../../utils/file/fileValidation";
import dashboardService from "../../services/dashboardService";
import "../../styles/modal.css";
import "./FileUploadForm.css";

/**
 * FileUploadForm - 파일 업로드 및 컬럼 매핑 관리 공통 컴포넌트
 * 
 * @param {Object} props
 * @param {Function} props.onFilesReady - 매핑 완료된 파일들이 준비되었을 때 호출
 *   (files: Array<{ file: File, mapping: { reviewColumn, dateColumn, ratingColumn } }>) => void
 * @param {number} props.productId - 제품 ID (업로드 시 필요)
 * @param {Function} props.onUploadComplete - 업로드 완료 시 호출 (result) => void
 * @param {Function} props.onUploadStart - 업로드 시작 시 호출 () => void
 * @param {boolean} props.autoUpload - 파일 매핑 완료 시 자동 업로드 여부 (기본: false)
 * @param {boolean} props.disabled - 업로드 비활성화 여부
 */
export default function FileUploadForm({
  onFilesReady,
  productId,
  onUploadComplete,
  onUploadStart,
  autoUpload = false,
  disabled = false
}) {
  const [mappedFiles, setMappedFiles] = useState([]); // [{ id, file, mapping, previewData }]
  const [previewFile, setPreviewFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const progressRef = useRef(0);
  const fileInputRef = useRef(null);

  // productId가 설정되고 autoUpload가 true이며 파일이 있으면 자동 업로드
  React.useEffect(() => {
    if (autoUpload && productId && mappedFiles.length > 0 && !isUploading) {
      const filesToUpload = mappedFiles.map((mf) => ({
        file: mf.file,
        mapping: mf.mapping,
      }));
      executeUpload(filesToUpload);
    }
  }, [productId]); // productId 변경 시에만 실행

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
    if (disabled || isUploading) return;
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleBrowseClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  // 업로드 실행
  const executeUpload = async (filesToUpload) => {
    if (!productId) {
      console.error("productId가 필요합니다.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setProgressMessage("파일 업로드 준비 중...");
    progressRef.current = 0;

    if (onUploadStart) {
      onUploadStart();
    }

    try {
      const progressCallback = (progress, message) => {
        progressRef.current = progress;
        setUploadProgress(progress);
        if (message) {
          setProgressMessage(message);
        }
      };

      const uploadResult = await dashboardService.uploadReviewFiles(
        productId,
        filesToUpload,
        progressCallback
      );

      // 진행도가 100%가 아니면 최대 5초 대기
      if (progressRef.current < 100) {
        let waitCount = 0;
        const maxWait = 5;
        while (progressRef.current < 100 && waitCount < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          waitCount++;
        }

        if (progressRef.current < 100) {
          progressRef.current = 100;
          setUploadProgress(100);
          setProgressMessage("처리 완료");
        }
      }

      if (onUploadComplete) {
        onUploadComplete(uploadResult);
      }

      return uploadResult;
    } catch (error) {
      console.error("업로드 오류:", error);
      setProgressMessage("업로드 실패");
      throw error;
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setProgressMessage("");
      }, 500);
    }
  };

  // Preview에서 확인 버튼 클릭 시
  const handlePreviewConfirm = async (mapping) => {
    if (!previewFile || !previewData) return;

    // 매핑된 파일 목록에 추가
    const newMappedFile = {
      id: Date.now(),
      file: previewFile,
      mapping: mapping,
      previewData: previewData,
    };

    const updatedMappedFiles = [...mappedFiles, newMappedFile];
    setMappedFiles(updatedMappedFiles);

    // Preview 모달 닫기
    setPreviewFile(null);
    setPreviewData(null);

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // 부모 컴포넌트에 변경사항 알림
    const filesToNotify = updatedMappedFiles.map((mf) => ({
      file: mf.file,
      mapping: mf.mapping,
    }));

    if (onFilesReady) {
      onFilesReady(filesToNotify);
    }

    // 자동 업로드 모드이고 productId가 있으면 업로드 실행
    if (autoUpload && productId) {
      await executeUpload(filesToNotify);
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
        className={`upload-dropzone ${isDragOver ? "drag-over" : ""} ${disabled || isUploading ? "disabled" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleBrowseClick}
      >
        <p className="upload-text">Drop file or browse</p>
        <p className="upload-format-text">Format: Excel (.xlsx, .xls), CSV (.csv) only (최대 10MB, 최대 5개)</p>
        <button
          className="browse-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled && !isUploading) handleBrowseClick();
          }}
          disabled={disabled || isUploading}
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
          disabled={disabled || isUploading}
        />
      </div>

      {/* 업로드 진행도 표시 */}
      {isUploading && (
        <div className="upload-progress-container">
          <div className="upload-progress-header">
            <span className="upload-progress-text">
              {progressMessage || "업로드 중..."}
            </span>
            <span className="upload-progress-percent">{uploadProgress}%</span>
          </div>
          <div className="upload-progress-bar">
            <div
              className="upload-progress-fill"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="upload-loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      )}

      {/* 매핑 완료된 파일 목록 */}
      <FileList
        mappedFiles={mappedFiles}
        onDelete={handleDeleteFile}
        disabled={disabled || isUploading}
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


