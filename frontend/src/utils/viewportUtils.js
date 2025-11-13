/**
 * Viewport 관련 유틸리티 함수들
 * PDF 다운로드 및 레이아웃 조정에 사용
 */

/**
 * PDF 다운로드 시 요소 스타일을 PDF에 최적화하도록 변경
 * @param {HTMLElement} element - 스타일을 변경할 요소
 * @param {Object} options - 옵션
 * @param {string} options.width - 너비 (기본값: "210mm")
 * @param {string} options.maxWidth - 최대 너비 (기본값: "210mm")
 * @param {string} options.padding - 패딩 (기본값: "20px")
 * @returns {Object} 원본 스타일 (복원용)
 */
export const applyPDFStyles = (element, options = {}) => {
  if (!element) {
    return {};
  }

  const {
    width = "210mm",
    maxWidth = "210mm",
    padding = "20px",
  } = options;

  // 원본 스타일 저장
  const originalStyles = {
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    padding: element.style.padding,
    boxSizing: element.style.boxSizing,
  };

  // PDF 최적화 스타일 적용
  element.style.width = width;
  element.style.maxWidth = maxWidth;
  element.style.padding = padding;
  element.style.boxSizing = "border-box";

  return originalStyles;
};

/**
 * PDF 다운로드 시 카드 요소들의 스타일을 변경
 * @param {NodeList|Array} cards - 카드 요소들
 * @returns {Array} 원본 스타일 배열 (복원용)
 */
export const applyPDFCardStyles = (cards) => {
  if (!cards || cards.length === 0) {
    return [];
  }

  const originalStyles = [];

  Array.from(cards).forEach((card, index) => {
    originalStyles[index] = {
      width: card.style.width,
      minWidth: card.style.minWidth,
      maxWidth: card.style.maxWidth,
      flex: card.style.flex,
    };

    // PDF 최적화 스타일 적용
    card.style.width = "auto";
    card.style.minWidth = "0";
    card.style.maxWidth = "100%";
    card.style.flex = "1 1 auto";
  });

  return originalStyles;
};

/**
 * 원본 스타일 복원
 * @param {HTMLElement} element - 스타일을 복원할 요소
 * @param {Object} originalStyles - 원본 스타일 객체
 */
export const restoreStyles = (element, originalStyles) => {
  if (!element || !originalStyles) {
    return;
  }

  Object.keys(originalStyles).forEach((key) => {
    if (originalStyles[key] !== undefined) {
      element.style[key] = originalStyles[key] || "";
    }
  });
};

/**
 * 카드 요소들의 원본 스타일 복원
 * @param {NodeList|Array} cards - 카드 요소들
 * @param {Array} originalStyles - 원본 스타일 배열
 */
export const restoreCardStyles = (cards, originalStyles) => {
  if (!cards || !originalStyles || cards.length === 0) {
    return;
  }

  Array.from(cards).forEach((card, index) => {
    if (originalStyles[index]) {
      const styles = originalStyles[index];
      if (styles.width !== undefined) {
        card.style.width = styles.width || "";
      }
      if (styles.minWidth !== undefined) {
        card.style.minWidth = styles.minWidth || "";
      }
      if (styles.maxWidth !== undefined) {
        card.style.maxWidth = styles.maxWidth || "";
      }
      if (styles.flex !== undefined) {
        card.style.flex = styles.flex || "";
      }
    }
  });
};

/**
 * PDF 다운로드 옵션 생성
 * @param {HTMLElement} contentElement - PDF로 변환할 콘텐츠 요소
 * @param {Object} options - 옵션
 * @param {string} options.filename - 파일명 (기본값: "대시보드_리포트.pdf")
 * @param {number} options.scale - 스케일 (기본값: 2)
 * @param {number} options.dpi - DPI (기본값: 192)
 * @param {Array<number>} options.margin - 마진 [top, right, bottom, left] mm (기본값: [10, 10, 10, 10])
 * @returns {Object} html2pdf 옵션 객체
 */
export const createPDFOptions = (contentElement, options = {}) => {
  const {
    filename = "대시보드_리포트.pdf",
    scale = 2,
    dpi = 192,
    margin = [10, 10, 10, 10],
  } = options;

  // 요소의 스크롤 크기 가져오기
  const width = contentElement?.scrollWidth || 0;
  const height = contentElement?.scrollHeight || 0;

  // A4 너비를 픽셀로 변환
  // 1 inch = 25.4 mm
  // 1 inch = dpi pixels
  // 따라서: mm * (dpi / 25.4) = pixels
  // 210mm * (dpi / 25.4) = windowWidth
  // 기존 코드: 210 * 3.779527559 ≈ 794px (96 DPI 기준)
  // 3.779527559 = 96 / 25.4 (96 DPI 기준 변환율)
  // 새로운 코드: dpi가 192이면 210 * (192 / 25.4) ≈ 1588px
  const mmToPx = (mm) => mm * (dpi / 25.4);
  const windowWidth = mmToPx(210);

  return {
    margin,
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale,
      logging: false,
      dpi,
      letterRendering: true,
      useCORS: true,
      width,
      height,
      windowWidth,
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
};

