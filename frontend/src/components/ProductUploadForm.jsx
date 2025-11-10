import React, { useState, useRef } from "react";

export default function ProductUploadForm({ onClose, formData }) {
  const [files, setFiles] = useState([]);
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

  const handleAnalyze = () => {
    // 나중에 분석 기능 연결 예정
    console.log("Analyze clicked with files:", files);
    console.log("Form data:", formData);
    // 여기에 분석 로직 추가 예정
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
        <button className="cancel" onClick={onClose}>
          Cancel
        </button>
        <button className="next" onClick={handleAnalyze}>
          Analyze
        </button>
      </div>
    </>
  );
}

