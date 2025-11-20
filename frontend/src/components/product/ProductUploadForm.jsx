import React, { useState } from "react";
import FileUploadForm from "../common/FileUploadForm";
import dashboardService from "../../services/dashboardService";

export default function ProductUploadForm({ onClose, formData, onSuccess, onSubmittingChange }) {
  const [mappedFiles, setMappedFiles] = useState([]); // [{ file, mapping }]
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productId, setProductId] = useState(null); // 생성된 제품 ID

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

  // 업로드 시작 시 호출
  const handleUploadStart = () => {
    // FileUploadForm에서 업로드가 시작되면 isSubmitting 유지
  };

  // 업로드 완료 시 호출
  const handleUploadComplete = (uploadResult) => {
    if (!uploadResult.success) {
      alert(`제품은 생성되었지만 파일 업로드에 실패했습니다: ${uploadResult.message || "파일 업로드에 실패했습니다."}`);
    }

    // 업로드 완료 후 성공 메시지 표시
    alert("제품이 성공적으로 생성되었습니다.");

    // 제품 생성 성공 시 항상 onSuccess 호출하여 워크플레이스로 돌아가기
    if (onSuccess) {
      onSuccess({ product_id: productId });
    } else {
      onClose();
    }

    setIsSubmitting(false);
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

      const createdProductId = result.data?.product?.product_id || result.data?.product_id;

      if (!createdProductId) {
        alert("제품 ID를 가져올 수 없습니다.");
        setIsSubmitting(false);
        return;
      }

      setProductId(createdProductId);

      // 파일이 없으면 바로 완료
      if (mappedFiles.length === 0) {
        alert("제품이 성공적으로 생성되었습니다.");

        if (onSuccess) {
          onSuccess(result.data?.product || { product_id: createdProductId });
        } else {
          onClose();
        }
        setIsSubmitting(false);
      }
      // 파일이 있으면 FileUploadForm이 자동으로 업로드 시작 (autoUpload=true)
      // handleUploadComplete에서 완료 처리
    } catch (error) {
      console.error("제품 생성 중 오류:", error);
      alert("제품 생성 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h2>Upload Files</h2>
      <p>Please upload your file.</p>

      <FileUploadForm
        onFilesReady={handleFilesReady}
        productId={productId}
        onUploadStart={handleUploadStart}
        onUploadComplete={handleUploadComplete}
        autoUpload={true}
        disabled={isSubmitting && !productId}
      />

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
