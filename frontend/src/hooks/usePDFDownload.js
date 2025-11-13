import { useCallback } from "react";
import html2pdf from "html2pdf.js";

/**
 * 화면에 보이는 대시보드를 "그 크기 그대로" PDF 한 장으로 저장하는 훅
 * - A4에 맞춰 리사이즈하지 않음
 * - PDF 페이지 크기를 대시보드의 scrollWidth/scrollHeight와 동일하게 맞춤
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

    const downloadButton = downloadButtonRef?.current;

    // 1) 다운로드 버튼 잠시 숨기기
    if (downloadButton) {
      downloadButton.style.display = "none";
    }

    // 2) 현재 대시보드의 실제 크기 측정
    const rect = element.getBoundingClientRect();
    const scrollWidth = element.scrollWidth || rect.width || 1024;
    const scrollHeight = element.scrollHeight || rect.height || 768;

    // PDF 페이지도 이 크기에 맞춰서 만들 것
    const pageWidth = scrollWidth;
    const pageHeight = scrollHeight;

    // 3) 파일명 생성
    const productName =
      productInfo?.product_name ||
      dashboardData?.product?.product_name ||
      "대시보드";

    const opt = {
      margin: 0, // 페이지 크기를 콘텐츠와 동일하게 쓸 것이므로 여백 0
      filename: `${productName}_리뷰_분석_리포트.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2, // 해상도
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        width: pageWidth,
        height: pageHeight,
        windowWidth: pageWidth,
        windowHeight: pageHeight,
      },
      jsPDF: {
        // 👉 PDF 페이지 크기를 "픽셀 단위로 콘텐츠와 똑같이"
        unit: "px",
        format: [pageWidth, pageHeight],
        orientation: "portrait",
      },
      // 한 장짜리 긴 PDF로 전체를 넣을 거라 pagebreak는 끔
      pagebreak: {
        mode: "none",
      },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        if (downloadButton) {
          downloadButton.style.display = "flex";
        }
      })
      .catch((err) => {
        console.error("PDF 생성 중 오류:", err);
        alert("PDF 생성 중 오류가 발생했습니다. 다시 시도해 주세요.");
        if (downloadButton) {
          downloadButton.style.display = "flex";
        }
      });
  }, [contentRef, downloadButtonRef, productInfo, dashboardData]);

  return handlePDFDownload;
};
