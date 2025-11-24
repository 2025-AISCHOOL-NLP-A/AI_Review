import { useState } from "react";

/**
 * 제품 모달 상태 관리 커스텀 훅
 */
export function useProductModal() {
  const [modalStep, setModalStep] = useState(null); // 'info' | 'upload' | 'edit' | 'addReview' | null
  const [productFormData, setProductFormData] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null); // 수정/추가 리뷰용 선택된 제품
  const [isUploading, setIsUploading] = useState(false); // 업로드 중 상태

  // 모달 닫기
  const handleCloseModal = () => {
    setModalStep(null);
    setProductFormData(null);
    setSelectedItem(null);
    setIsUploading(false); // 업로드 상태 초기화
  };

  // Add 버튼 클릭 - Step 1 모달 열기
  const handleAdd = () => {
    setModalStep("info");
    setProductFormData(null);
  };

  // Step 1에서 Next 클릭 - Step 2로 이동
  const handleNextStep = (formData) => {
    setProductFormData(formData);
    setModalStep("upload");
  };

  // Edit 버튼 클릭 - 수정 모드로 ProductInfoForm 열기
  const handleEdit = (item) => {
    setSelectedItem(item);
    setModalStep("edit");
  };

  // Add Review 버튼 클릭 - Add Review 모달 열기
  const handleAddReview = (item) => {
    setSelectedItem(item);
    setModalStep("addReview");
  };

  return {
    modalStep,
    productFormData,
    selectedItem,
    isUploading,
    setIsUploading,
    handleCloseModal,
    handleAdd,
    handleNextStep,
    handleEdit,
    handleAddReview,
  };
}

