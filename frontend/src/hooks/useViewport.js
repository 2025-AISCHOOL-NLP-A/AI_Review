import { useState, useEffect } from "react";

/**
 * Viewport 크기와 관련된 기능을 제공하는 커스텀 훅
 * - 화면 크기 추적
 * - 스크롤 위치 추적
 * - 반응형 브레이크포인트 감지
 */
export const useViewport = () => {
  const [viewport, setViewport] = useState(() => {
    if (typeof window === "undefined") {
      return { width: 0, height: 0, scrollX: 0, scrollY: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      });
    };

    const handleScroll = () => {
      setViewport((prev) => ({
        ...prev,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      }));
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    // 초기값 설정
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 브레이크포인트 체크 함수
  const isMobile = viewport.width < 640; // sm
  const isTablet = viewport.width >= 640 && viewport.width < 1024; // md, lg
  const isDesktop = viewport.width >= 1024; // lg 이상

  return {
    ...viewport,
    isMobile,
    isTablet,
    isDesktop,
  };
};

// 유틸리티 함수들은 viewportUtils.js로 이동
// 하위 호환성을 위해 re-export
export {
  getElementScrollSize,
  getElementClientSize,
  getElementOffsetSize,
  mmToPx,
  getA4SizeInPx,
  calculatePDFViewport,
  getElementViewportPosition,
  isElementInViewport,
} from "../utils/ui/viewportUtils";
