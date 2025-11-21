import { useState, useEffect, useRef } from "react";

/**
 * 드롭다운 메뉴 위치 관리 및 외부 클릭 감지 커스텀 훅
 */
export function useDropdownMenu(workplaceData) {
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const menuRefs = useRef({});
  const dropdownRef = useRef(null);

  // 드롭다운 위치 계산
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (openMenuIndex !== null) {
        const menuElement = menuRefs.current[openMenuIndex];
        if (menuElement) {
          const rect = menuElement.getBoundingClientRect();
          const dropdownHeight = 120; // 대략적인 드롭다운 높이
          const dropdownWidth = 140; // 드롭다운 너비
          
          // 화면 하단에 가까우면 위로, 아니면 아래로
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          
          let top, right;
          
          if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
            // 위로 표시
            top = Math.max(4, rect.top - dropdownHeight - 4);
          } else {
            // 아래로 표시
            top = Math.min(rect.bottom + 4, window.innerHeight - dropdownHeight - 4);
          }
          
          // 오른쪽 정렬, 화면 밖으로 나가지 않도록
          right = Math.max(4, window.innerWidth - rect.right);
          // 왼쪽으로 넘어가지 않도록
          if (rect.right - dropdownWidth < 0) {
            right = window.innerWidth - rect.left;
          }
          
          setDropdownPosition({ top, right });
        }
      }
    };

    if (openMenuIndex !== null) {
      updateDropdownPosition();
      
      // 스크롤 및 리사이즈 시 위치 업데이트
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [openMenuIndex, workplaceData]);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const mouseDownRef = { current: null };

    const handleMouseDown = (e) => {
      if (openMenuIndex !== null) {
        const menuElement = menuRefs.current[openMenuIndex];
        const dropdownElement = dropdownRef.current;
        if (menuElement && dropdownElement) {
          // 메뉴 버튼이나 드롭다운 내부가 아닌 경우 mousedown 위치 저장
          if (!menuElement.contains(e.target) && !dropdownElement.contains(e.target)) {
            mouseDownRef.current = { target: e.target, time: Date.now() };
          } else {
            mouseDownRef.current = null;
          }
        }
      }
    };

    const handleMouseUp = (e) => {
      if (openMenuIndex !== null) {
        // 텍스트 선택이 완료되었는지 확인
        const selection = window.getSelection();
        const hasSelection = selection && selection.toString().length > 0;
        
        // 텍스트가 선택된 경우 메뉴를 닫지 않음
        if (hasSelection) {
          mouseDownRef.current = null;
          return;
        }

        const menuElement = menuRefs.current[openMenuIndex];
        const dropdownElement = dropdownRef.current;
        if (menuElement && dropdownElement) {
          // 메뉴 외부에서 mousedown이 시작되고 mouseup이 발생한 경우에만 메뉴 닫기
          if (
            mouseDownRef.current &&
            !menuElement.contains(e.target) &&
            !dropdownElement.contains(e.target)
          ) {
            // 클릭 시간이 짧은 경우에만 메뉴 닫기 (드래그와 구분)
            const clickDuration = Date.now() - mouseDownRef.current.time;
            if (clickDuration < 300) {
              setOpenMenuIndex(null);
            }
          }
        }
      }

      mouseDownRef.current = null;
    };

    if (openMenuIndex !== null) {
      document.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [openMenuIndex]);

  return {
    openMenuIndex,
    setOpenMenuIndex,
    dropdownPosition,
    menuRefs,
    dropdownRef,
  };
}

