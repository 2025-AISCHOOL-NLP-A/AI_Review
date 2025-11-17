// usePDFDownload.js
import { useCallback } from "react";
import html2pdf from "html2pdf.js";
import { getElementScrollSize } from "../hooks/useViewport";

/**
 * 대시보드 PDF 다운로드용 커스텀 훅
 * - DOM 레이아웃을 전혀 변경하지 않음 (transform, width 조작 없음)
 * - 첫 번째 다운로드부터 항상 같은 규칙으로 동작
 * - 가로는 "화면 너비 - 여유" 범위 안에서만 사용 (가로 스크롤 방지)
 * - 세로는 그 비율에 맞춰서 계산 → 페이지 안에서 공백 최소화
 * - 사이드바 포함, footer만 PDF에서 제외
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

    // 4) 현재 브라우저 화면 너비 기준으로 PDF 가로폭 결정
    const viewportWidth =
      (typeof window !== "undefined" && window.innerWidth) ||
      document.documentElement.clientWidth ||
      contentWidth;

    // 화면 좌우 여유 (너무 꽉 차면 보기 답답하니까 약간만 뺌)
    const SIDE_PADDING = 40;

    // PDF 가로폭 상/하한 (너무 좁지도, 너무 넓지도 않게)
    const MAX_PDF_WIDTH = 1600;
    const MIN_PDF_WIDTH = 900;

    // 👉 실제 PDF 페이지 너비
    //    - 화면 너비 - 여유 값 안에서
    //    - MIN_PDF_WIDTH ~ MAX_PDF_WIDTH 사이로 고정
    const pageWidth = Math.min(
      MAX_PDF_WIDTH,
      Math.max(MIN_PDF_WIDTH, viewportWidth - SIDE_PADDING)
    );

    // 콘텐츠를 pageWidth에 맞추기 위한 축소 비율
    const scaleToFitWidth = pageWidth / contentWidth;

    // 세로는 같은 비율로 줄이기
    const pageHeight = contentHeight * scaleToFitWidth;

    // 세로 읽기용 고정
    const orientation = "portrait";

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
        // ❗ DOM 자체 크기는 건드리지 않고, 원본 그대로 캡처
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
        // ❗ 우리가 계산한 pageWidth/pageHeight에 딱 맞게 페이지 크기 설정
        //    → PDF 내부에서 공백 거의 없이 꽉 채워짐
        format: [pageWidth, pageHeight],
        orientation,
      },
      pagebreak: {
        mode: "none", // 한 장짜리 긴 페이지 (세로 스크롤만)
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
