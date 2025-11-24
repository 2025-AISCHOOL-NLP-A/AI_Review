// usePDFDownload.js
import { useCallback } from "react";
import html2pdf from "html2pdf.js";

/**
 * 대시보드 PDF 다운로드용 커스텀 훅
 * - 가로: 대시보드 실제 폭(clientWidth)
 * - 세로: scrollHeight 전체
 * - 어떤 이유로든 2페이지 이상 생성되면,
 *   마지막 페이지(대부분 빈 페이지)를 자동으로 삭제
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

    // 3) 실제 대시보드 크기 측정
    const baseWidth = element.clientWidth || element.offsetWidth || 1280;
    const baseHeight = element.scrollHeight || element.clientHeight || 720;

    let pageWidth = baseWidth;
    let pageHeight = baseHeight;

    // 너무 길면 한계 높이 안으로 축소 (옵션)
    const MAX_PAGE_HEIGHT = 14000;
    if (pageHeight > MAX_PAGE_HEIGHT) {
      const ratio = MAX_PAGE_HEIGHT / pageHeight;
      pageWidth = pageWidth * ratio;
      pageHeight = MAX_PAGE_HEIGHT;
    }

    const productName =
      productInfo?.product_name ||
      dashboardData?.product?.product_name ||
      "대시보드";

    const opt = {
      margin: 0,
      filename: `${productName}_리뷰_분석_리포트.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        width: baseWidth,
        height: baseHeight,
        windowWidth: baseWidth,
        windowHeight: baseHeight,
      },
      jsPDF: {
        unit: "px",
        format: [pageWidth, pageHeight],
        orientation: "portrait",
      },
      pagebreak: {
        mode: "none",
      },
    };

    // 🚩 핵심: PDF 생성 후 마지막 페이지를 지우고 저장
    const worker = html2pdf().set(opt).from(element);

    worker
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        const totalPages = pdf.internal.getNumberOfPages();
        // 대부분의 경우 2페이지일 때, 2번째가 빈 페이지라서 삭제
        if (totalPages > 1) {
          pdf.deletePage(totalPages);
        }
      })
      .then(() => worker.save())
      .then(() => {
        // UI 복구
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
