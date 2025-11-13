import { useState, useEffect } from "react";

/**
 * Viewport 크기와 관련된 기능을 제공하는 커스텀 훅
 * - 화면 크기 추적
 * - 스크롤 위치 추적
 * - 반응형 브레이크포인트 감지
 */
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    scrollX: typeof window !== "undefined" ? window.scrollX : 0,
    scrollY: typeof window !== "undefined" ? window.scrollY : 0,
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

/**
 * 요소의 스크롤 크기를 가져오는 함수
 * @param {HTMLElement} element - 측정할 요소
 * @returns {Object} { width, height }
 */
export const getElementScrollSize = (element) => {
  if (!element) {
    return { width: 0, height: 0 };
  }

  return {
    width: element.scrollWidth || 0,
    height: element.scrollHeight || 0,
  };
};

/**
 * 요소의 클라이언트 크기를 가져오는 함수
 * @param {HTMLElement} element - 측정할 요소
 * @returns {Object} { width, height }
 */
export const getElementClientSize = (element) => {
  if (!element) {
    return { width: 0, height: 0 };
  }

  return {
    width: element.clientWidth || 0,
    height: element.clientHeight || 0,
  };
};

/**
 * 요소의 오프셋 크기를 가져오는 함수
 * @param {HTMLElement} element - 측정할 요소
 * @returns {Object} { width, height }
 */
export const getElementOffsetSize = (element) => {
  if (!element) {
    return { width: 0, height: 0 };
  }

  return {
    width: element.offsetWidth || 0,
    height: element.offsetHeight || 0,
  };
};

/**
 * mm를 픽셀로 변환하는 함수
 * @param {number} mm - 밀리미터 값
 * @param {number} dpi - DPI (기본값: 96)
 * @returns {number} 픽셀 값
 */
export const mmToPx = (mm, dpi = 96) => {
  // 1 inch = 25.4 mm
  // 1 inch = dpi pixels
  // 따라서: mm * (dpi / 25.4) = pixels
  return mm * (dpi / 25.4);
};

/**
 * A4 용지 크기를 픽셀로 변환
 * @param {number} dpi - DPI (기본값: 96)
 * @returns {Object} { width, height } 픽셀 단위
 */
export const getA4SizeInPx = (dpi = 96) => {
  // A4 크기: 210mm x 297mm
  return {
    width: mmToPx(210, dpi),
    height: mmToPx(297, dpi),
  };
};

/**
 * PDF 생성에 최적화된 viewport 크기 계산
 * @param {HTMLElement} element - PDF로 변환할 요소
 * @param {Object} options - 옵션
 * @param {number} options.scale - 스케일 (기본값: 2)
 * @param {number} options.dpi - DPI (기본값: 192)
 * @param {number} options.margin - 마진 mm (기본값: 10)
 * @returns {Object} { width, height, windowWidth, scale }
 */
export const calculatePDFViewport = (element, options = {}) => {
  const { scale = 2, dpi = 192, margin = 10 } = options;

  if (!element) {
    const a4Size = getA4SizeInPx(dpi);
    return {
      width: a4Size.width,
      height: a4Size.height,
      windowWidth: a4Size.width,
      scale,
    };
  }

  const scrollSize = getElementScrollSize(element);
  const a4Size = getA4SizeInPx(dpi);
  const marginPx = mmToPx(margin, dpi);

  return {
    width: scrollSize.width || a4Size.width,
    height: scrollSize.height || a4Size.height,
    windowWidth: a4Size.width - marginPx * 2, // 마진 제외한 너비
    scale,
  };
};

/**
 * 요소의 뷰포트 위치를 가져오는 함수
 * @param {HTMLElement} element - 측정할 요소
 * @returns {Object} { top, left, right, bottom, width, height }
 */
export const getElementViewportPosition = (element) => {
  if (!element || typeof window === "undefined") {
    return {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
    };
  }

  const rect = element.getBoundingClientRect();

  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    right: rect.right + window.scrollX,
    bottom: rect.bottom + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
};

/**
 * 요소가 뷰포트에 보이는지 확인하는 함수
 * @param {HTMLElement} element - 확인할 요소
 * @param {number} threshold - 보이는 것으로 간주할 최소 퍼센트 (0-1)
 * @returns {boolean} 요소가 보이는지 여부
 */
export const isElementInViewport = (element, threshold = 0) => {
  if (!element || typeof window === "undefined") {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const elementHeight = rect.height;
  const elementWidth = rect.width;

  const visibleHeight = Math.max(
    0,
    Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
  );
  const visibleWidth = Math.max(
    0,
    Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0)
  );

  const visibleArea = visibleHeight * visibleWidth;
  const elementArea = elementHeight * elementWidth;

  if (elementArea === 0) return false;

  const visibleRatio = visibleArea / elementArea;

  return visibleRatio >= threshold;
};

