import React from "react";
import "../../styles/modal.css";

function ProductModal({ children, onClose, disabled = false }) {
  const handleOverlayClick = (e) => {
    // 업로드 중이 아닐 때만 모달 닫기
    if (!disabled && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default ProductModal;

