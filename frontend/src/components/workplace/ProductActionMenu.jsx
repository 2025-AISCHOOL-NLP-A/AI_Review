import React, { useRef, useEffect } from "react";

/**
 * 제품 액션 드롭다운 메뉴 컴포넌트
 */
export default function ProductActionMenu({
  isOpen,
  onEdit,
  onAddReview,
  onDelete,
  position,
  onClose,
}) {
  const menuRef = useRef(null);
  const mouseDownRef = useRef(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e) => {
      // 메뉴 내부가 아닌 경우 mousedown 위치 저장
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        mouseDownRef.current = { target: e.target, time: Date.now() };
      } else {
        mouseDownRef.current = null;
      }
    };

    const handleMouseUp = (e) => {
      // 텍스트 선택이 완료되었는지 확인
      const selection = window.getSelection();
      const hasSelection = selection && selection.toString().length > 0;
      
      // 텍스트가 선택된 경우 메뉴를 닫지 않음
      if (hasSelection) {
        mouseDownRef.current = null;
        return;
      }

      // 메뉴 외부에서 mousedown이 시작되고 mouseup이 발생한 경우에만 메뉴 닫기
      if (
        mouseDownRef.current &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        // 클릭 시간이 짧은 경우에만 메뉴 닫기 (드래그와 구분)
        const clickDuration = Date.now() - mouseDownRef.current.time;
        if (clickDuration < 300) {
          onClose();
        }
      }

      mouseDownRef.current = null;
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="dropdown-menu"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
      }}
    >
      <button onClick={onEdit} className="dropdown-item">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        Edit
      </button>
      <button onClick={onAddReview} className="dropdown-item">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Add Review
      </button>
      <button onClick={onDelete} className="dropdown-item delete">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        Delete
      </button>
    </div>
  );
}

