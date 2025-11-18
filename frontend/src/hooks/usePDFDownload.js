// usePDFDownload.js
import { useCallback } from "react";
import html2pdf from "html2pdf.js";
import { getElementScrollSize } from "../hooks/useViewport";

/**
 * 대시보드 PDF 다운로드용 커스텀 훅
 * - DOM 스타일(폭/패딩) 절대 안 건드림
 * - 대시보드 실제 너비를 기준으로 PDF 비율만 조정
 * - PDF 가로폭이 화면 너비를 넘지 않게 고정 → 가로 스크롤 방지
 */
export const usePDFDownload = ({
  contentRef,
  downloadButtonRef = null,
  productInfo = null,
  dashboardData = null,
}) => {
  const handlePDFDownload = useCallback(() => {
    const element = contentRef?.current;
    if (!element) {
      console.warn("PDF 다운로드: contentRef가 비어 있습니다.");
      return;
    }

    // 1) 다운로드 버튼 잠시 숨기기
    const downloadButton = downloadButtonRef?.current;
    if (downloadButton) {
      downloadButton.style.display = "none";
    }

    // 2) footer는 PDF에서만 숨기기
    const footerElement = document.getElementById("dashboard-footer");
    const prevFooterDisplay = footerElement ? footerElement.style.display : "";
    if (footerElement) {
      footerElement.style.display = "none";
    }

    // 3) 실제 대시보드 전체 크기(스크롤 기준) 측정
    const { width: scrollWidth, height: scrollHeight } =
      getElementScrollSize(element);

    const contentWidth = scrollWidth || element.clientWidth || 1280;
    const contentHeight = scrollHeight || element.clientHeight || 720;

    // 4) 현재 브라우저 화면 너비
    const viewportWidth =
      (typeof window !== "undefined" && window.innerWidth) ||
      document.documentElement.clientWidth ||
      contentWidth;

    // 화면 좌우 여유 (조금만 뺌)
    const SIDE_PADDING = 40;

    // PDF 가로폭은
    //  - "내용 폭"을 넘지 않고
    //  - "화면 폭 - 여유"도 넘지 않게 제한
    const maxAllowedWidth = Math.max(600, viewportWidth - SIDE_PADDING);
    const pageWidth = Math.min(contentWidth, maxAllowedWidth);

    // 내용 → PDF 페이지로 줄여 넣기 위한 비율
    const scaleToFitWidth = pageWidth / contentWidth;
    const pageHeight = contentHeight * scaleToFitWidth;

    // 5) 파일명
    const productName =
      productInfo?.product_name ||
      dashboardData?.product?.product_name ||
      "대시보드";

    const opt = {
      margin: 0,
      filename: `${productName}_리뷰_분석_리포트.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        // DOM은 원본 그대로, 캔버스만 고해상도로
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        width: contentWidth,
        height: contentHeight,
        windowWidth: contentWidth,
        windowHeight: contentHeight,
      },
      jsPDF: {
        unit: "px",
        // 페이지 크기 = 우리가 계산한 pageWidth / pageHeight
        // → 가로는 화면 안에 들어오고, 세로는 비율 유지
        format: [pageWidth, pageHeight],
        orientation: "portrait",
      },
      pagebreak: {
        mode: "none", // 한 장짜리 긴 페이지
      },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        // 6) 버튼 / footer 복구
        if (downloadButton) {
          downloadButton.style.display = "flex";
        }
        if (footerElement) {
          footerElement.style.display = prevFooterDisplay;
        }
      })
      .catch((err) => {
        console.error("PDF 생성 중 오류:", err);
        alert("PDF 생성 중 오류가 발생했습니다. 다시 시도해 주세요.");

        if (downloadButton) {
          downloadButton.style.display = "flex";
        }
        if (footerElement) {
          footerElement.style.display = prevFooterDisplay;
        }
      });
  }, [contentRef, downloadButtonRef, productInfo, dashboardData]);

  return handlePDFDownload;
};
