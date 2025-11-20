import React, { useState } from "react";
import FileUploadForm from "../common/FileUploadForm";
import dashboardService from "../../services/dashboardService";

export default function ProductUploadForm({ onClose, formData, onSuccess, onSubmittingChange }) {
  const [mappedFiles, setMappedFiles] = useState([]); // [{ file, mapping }]
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 업로드 진행도 (0-100)
  const [progressMessage, setProgressMessage] = useState(""); // 진행도 메시지

  // isSubmitting 상태 변경 시 부모에게 알림
  React.useEffect(() => {
    if (onSubmittingChange) {
      onSubmittingChange(isSubmitting);
    }
  }, [isSubmitting, onSubmittingChange]);

  // 업로드 중일 때 브라우저 닫기/새로고침 방지
  React.useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isSubmitting) {
        e.preventDefault();
        e.returnValue = "파일 업로드가 진행 중입니다. 페이지를 떠나시겠습니까?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isSubmitting]);

  // FileUploadForm에서 파일이 준비되었을 때 호출
  const handleFilesReady = (files) => {
    setMappedFiles(files);
  };

  // 창 닫기 처리 (업로드 중일 때 경고 표시)
  const handleClose = () => {
    if (isSubmitting) {
      const confirmClose = window.confirm("파일 업로드가 진행 중입니다. 정말 닫으시겠습니까?");
      if (!confirmClose) {
        return;
      }
    }
    onClose();
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

      // 파일이 있으면 업로드 (실패해도 제품은 생성되었으므로 계속 진행)
      if (mappedFiles.length > 0) {
        if (!allFilesMapped) {
          alert("모든 파일의 컬럼 매핑을 완료해주세요.");
          setIsSubmitting(false);
          return;
        }

        // 파일 업로드 및 매핑 정보 전송 (SSE 방식)
        setUploadProgress(0); // 진행도 초기화
        setProgressMessage("파일 업로드 준비 중...");
        const uploadResult = await dashboardService.uploadReviewFiles(
          productId, 
          mappedFiles,
          (progress, message) => {
            setUploadProgress(progress);
            if (message) {
              setProgressMessage(message);
            }
          }
        );

        if (!uploadResult.success) {
          alert(`제품은 생성되었지만 파일 업로드에 실패했습니다: ${uploadResult.message || "파일 업로드에 실패했습니다."}`);
          // 파일 업로드 실패해도 제품은 생성되었으므로 워크플레이스로 돌아감
        }
      }

      alert("제품이 성공적으로 생성되었습니다.");
      
      // 제품 생성 성공 시 항상 onSuccess 호출하여 워크플레이스로 돌아가기
      if (onSuccess) {
        onSuccess(result.data?.product || { product_id: productId });
      } else {
        onClose();
      }
    } catch (error) {
      console.error("제품 생성 중 오류:", error);
      alert("제품 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0); // 진행도 초기화
      setProgressMessage(""); // 메시지 초기화
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

      {/* 업로드 진행도 표시 */}
      {isSubmitting && (
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

      <div className="button-row">
        <button 
          className="cancel" 
          onClick={handleClose}
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

