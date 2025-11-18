import React, { useRef } from "react";
import "../../styles/modal.css";

function ProductModal({ children, onClose, disabled = false }) {
  const mouseDownRef = useRef(null);
  const isSelectingTextRef = useRef(false);

  const handleMouseDown = (e) => {
    // 모달 외부에서 mousedown이 발생한 경우
    if (e.target === e.currentTarget) {
      mouseDownRef.current = { target: e.target, time: Date.now() };
      isSelectingTextRef.current = false;
    } else {
      // 모달 내부에서 mousedown이 발생한 경우 - 텍스트 선택 가능성 확인
      const selection = window.getSelection();
      isSelectingTextRef.current = selection && selection.toString().length > 0;
      mouseDownRef.current = null;
    }
  };

  const handleMouseUp = (e) => {
    // 텍스트 선택이 완료되었는지 확인
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;
    
    // 텍스트가 선택된 경우 모달을 닫지 않음
    if (hasSelection) {
      isSelectingTextRef.current = true;
      mouseDownRef.current = null;
      return;
    }

    // 모달 외부에서 mousedown이 시작되고 mouseup이 발생한 경우에만 모달 닫기
    if (
      !disabled &&
      mouseDownRef.current &&
      mouseDownRef.current.target === e.currentTarget &&
      e.target === e.currentTarget &&
      !isSelectingTextRef.current
    ) {
      // 클릭 시간이 짧은 경우에만 모달 닫기 (드래그와 구분)
      const clickDuration = Date.now() - mouseDownRef.current.time;
      if (clickDuration < 300) {
        onClose();
      }
    }

    mouseDownRef.current = null;
    isSelectingTextRef.current = false;
  };

  const handleOverlayClick = (e) => {
    // 텍스트 선택 중이 아닐 때만 모달 닫기
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;
    
    if (!disabled && !hasSelection && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleOverlayClick}
    >
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default ProductModal;

