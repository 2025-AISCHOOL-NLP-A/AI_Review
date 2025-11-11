import React, { useState, useRef } from "react";

export default function ProductUploadForm({ onClose, formData }) {
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    // 중복 요청 방지
    if (isSubmitting) {
      return;
    }

    // 나중에 분석 기능 연결 예정
    console.log("Analyze clicked with files:", files);
    console.log("Form data:", formData);
    
    setIsSubmitting(true);
    try {
      // 여기에 분석 로직 추가 예정
      // 예: await api.uploadAndAnalyze(formData, files);
    } catch (error) {
      console.error("분석 중 오류:", error);
      alert("분석 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h2>Upload Files</h2>
      <p>Please upload your file.</p>

      <div
        className="upload-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {files.length > 0 ? (
          <div className="upload-file-list">
            {files.map((file, index) => (
              <div key={index} className="upload-file-item">
                <span>{file.name}</span>
                <span className="file-size">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="upload-text">Drop file or browse</p>
            <button className="browse-btn" onClick={handleBrowseClick}>
              Browse Files
            </button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>

      <div className="button-row">
        <button 
          className="cancel" 
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          className="next" 
          onClick={handleAnalyze}
          disabled={isSubmitting || files.length === 0}
        >
          {isSubmitting ? "처리 중..." : "Analyze"}
        </button>
      </div>
    </>
  );
}

