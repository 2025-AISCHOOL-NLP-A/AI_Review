import React, { useState } from "react";
import FileUploadForm from "../common/FileUploadForm";
import dashboardService from "../../services/dashboardService";

export default function ProductUploadForm({ onClose, formData, onSuccess }) {
  const [mappedFiles, setMappedFiles] = useState([]); // [{ file, mapping }]
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FileUploadForm에서 파일이 준비되었을 때 호출
  const handleFilesReady = (files) => {
    setMappedFiles(files);
  };

  // 모든 파일이 매핑되었는지 확인
  const allFilesMapped = mappedFiles.length > 0 && mappedFiles.every((f) => {
    return f.mapping && f.mapping.reviewColumn && f.mapping.dateColumn;
  });

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
        category_id: formData.category || null,
      };

      const result = await dashboardService.createProduct(productData);

      if (!result.success) {
        alert(result.message || "제품 생성에 실패했습니다.");
        setIsSubmitting(false);
        return;
      }

      const productId = result.data?.product?.product_id || result.data?.product_id;

      if (!productId) {
        alert("제품 ID를 가져올 수 없습니다.");
        setIsSubmitting(false);
        return;
      }

      // 파일이 있으면 업로드
      if (mappedFiles.length > 0) {
        if (!allFilesMapped) {
          alert("모든 파일의 컬럼 매핑을 완료해주세요.");
          setIsSubmitting(false);
          return;
        }

        // 파일 업로드 및 매핑 정보 전송
        const uploadResult = await dashboardService.uploadReviewFiles(productId, mappedFiles);

        if (!uploadResult.success) {
          alert(uploadResult.message || "파일 업로드에 실패했습니다.");
          setIsSubmitting(false);
          return;
        }
      }

      alert("제품이 성공적으로 생성되었습니다.");
      
      // onSuccess 콜백이 있으면 onSuccess에서 모달을 닫도록 하고,
      // 없으면 여기서 모달을 닫음
      if (onSuccess) {
        onSuccess(result.data?.product);
      } else {
        onClose();
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

      <FileUploadForm 
        onFilesReady={handleFilesReady}
        disabled={isSubmitting}
      />

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
          disabled={isSubmitting || !formData || (mappedFiles.length > 0 && !allFilesMapped)}
        >
          {isSubmitting ? "처리 중..." : "Analyze"}
        </button>
      </div>
    </>
  );
}

