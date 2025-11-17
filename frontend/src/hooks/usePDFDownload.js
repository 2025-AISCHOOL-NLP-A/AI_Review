// usePDFDownload.js
import { useCallback } from "react";
import html2pdf from "html2pdf.js";
import { getElementScrollSize } from "../hooks/useViewport";

/**
 * 대시보드 PDF 다운로드용 커스텀 훅
 * - 어떤 컴퓨터/모니터든 항상 같은 규칙으로 동작
 * - 가로는 "최대 900px" 안으로만 줄여서 가로 스크롤 안 생기게
 * - 세로는 내용 비율대로 길게 → 세로 스크롤로만 전체 내용을 보게
 * - 사이드바는 포함, footer만 PDF에서 제외
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

    // 1) 다운로드 버튼 숨기기 (버튼은 PDF에 안 나오게)
    const downloadButton = downloadButtonRef?.current;
    if (downloadButton) {
      downloadButton.style.display = "none";
    }

    // 2) footer는 PDF에서만 잠깐 숨기고, 끝나면 다시 되돌림
    const footerElement = document.getElementById("dashboard-footer");
    const prevFooterDisplay = footerElement ? footerElement.style.display : "";

    if (footerElement) {
      footerElement.style.display = "none";
    }

    // 3) 실제 대시보드 전체 크기(스크롤 기준) 측정
    const { width: scrollWidth, height: scrollHeight } =
      getElementScrollSize(element);

    const contentWidth = scrollWidth || element.clientWidth || 1024;
    const contentHeight = scrollHeight || element.clientHeight || 768;

    // ===========================
    // 4) PDF 가로폭 고정 규칙
    // ===========================
    // - 모니터/브라우저 크기와 상관없이, 항상 900px 안으로만 줄임
    // - 너무 넓어서 "가로 스크롤" 생기는 걸 최대한 방지
    // - 콘텐츠 너비가 1640px보다 작으면 그대로 사용 (키우지는 않음)
    const MAX_PDF_WIDTH = 1640;

    const pageWidth = Math.min(contentWidth, MAX_PDF_WIDTH);
    const scaleToFitWidth = pageWidth / contentWidth;
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
        // 대시보드 전체를 "원래 크기" 기준으로 캡처
        // (축소/확대는 jsPDF 쪽에서만 처리 → 잘림 방지)
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
        // PDF 페이지 크기
        // - 가로: 최대 900px
        // - 세로: 원본 비율대로 줄인 높이
        format: [pageWidth, pageHeight],
        orientation,
      },
      pagebreak: {
        mode: "none", // 한 장짜리 긴 페이지 (세로로만 스크롤)
      },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        // 6) 버튼 / footer 원복
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
