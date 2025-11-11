import React, { useState, useRef } from "react";
import dashboardService from "../services/dashboardService";

export default function ProductUploadForm({ onClose, formData, onSuccess }) {
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

    if (!formData) {
      alert("제품 정보를 먼저 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 제품 생성
      const productData = {
        product_name: formData.productName,
        brand: formData.brand || null,
        category_id: parseInt(formData.category, 10),
      };

      const result = await dashboardService.createProduct(productData);

      if (result.success) {
        alert("제품이 성공적으로 생성되었습니다.");
        // onSuccess 콜백이 있으면 onSuccess에서 모달을 닫도록 하고,
        // 없으면 여기서 모달을 닫음
        if (onSuccess) {
          onSuccess(result.data?.product);
        } else {
          onClose();
        }
        
        // TODO: 파일 업로드 및 분석 로직은 추후 구현
        // if (files.length > 0) {
        //   // 파일 업로드 및 분석 요청
        // }
      } else {
        alert(result.message || "제품 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("제품 생성 중 오류:", error);
      alert("제품 생성 중 오류가 발생했습니다.");
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
          id="product_file_upload"
          name="product_files"
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
          disabled={isSubmitting || !formData}
        >
          {isSubmitting ? "처리 중..." : "Analyze"}
        </button>
      </div>
    </>
  );
}

