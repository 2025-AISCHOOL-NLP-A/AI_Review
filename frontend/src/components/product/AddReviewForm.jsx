import React, { useState } from "react";
import FileUploadForm from "../common/FileUploadForm";
import dashboardService from "../../services/dashboardService";
import "../../styles/modal.css";

/**
 * AddReviewForm - 기존 제품에 리뷰 추가용 파일 업로드 폼
 * 
 * @param {Object} props
 * @param {Function} props.onClose - 모달 닫기
 * @param {number} props.productId - 제품 ID
 * @param {Function} props.onSuccess - 성공 시 콜백 () => void
 */
export default function AddReviewForm({ onClose, productId, onSuccess, onSubmittingChange }) {
  const [mappedFiles, setMappedFiles] = useState([]); // [{ file, mapping }]
  const [isSubmitting, setIsSubmitting] = useState(false);

  // isSubmitting 상태 변경 시 부모에게 알림
  React.useEffect(() => {
    if (onSubmittingChange) {
      onSubmittingChange(isSubmitting);
    }
  }, [isSubmitting, onSubmittingChange]);

  // FileUploadForm에서 파일이 준비되었을 때 호출
  const handleFilesReady = (files) => {
    setMappedFiles(files);
  };

  // 모든 파일이 매핑되었는지 확인
  const allFilesMapped = mappedFiles.length > 0 && mappedFiles.every((f) => {
    return f.mapping && f.mapping.reviewColumn && f.mapping.dateColumn;
  });

  // Analyze 버튼 클릭
  const handleAnalyze = async () => {
    if (isSubmitting) return;

    if (!productId) {
      alert("제품 ID가 없습니다.");
      return;
    }

    if (!allFilesMapped) {
      alert("모든 파일의 컬럼 매핑을 완료해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 파일 업로드 및 매핑 정보 전송
      const uploadResult = await dashboardService.uploadReviewFiles(productId, mappedFiles);

      if (!uploadResult.success) {
        alert(uploadResult.message || "파일 업로드에 실패했습니다.");
        return;
      }

      alert("리뷰가 성공적으로 업로드되었습니다.");
      
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("파일 업로드 중 오류:", error);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h2>Add Review</h2>
      <p>Please upload your review files. (Excel, CSV files only)</p>

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
          disabled={isSubmitting || !allFilesMapped}
        >
          {isSubmitting ? "처리 중..." : "Analyze"}
        </button>
      </div>
    </>
  );
}

