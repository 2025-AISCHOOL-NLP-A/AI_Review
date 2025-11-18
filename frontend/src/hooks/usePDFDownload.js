// usePDFDownload.js
import { useCallback } from "react";
import html2pdf from "html2pdf.js";

/**
 * 대시보드 PDF 다운로드용 커스텀 훅
 * - 모니터 해상도와 무관하게 동일한 규칙으로 동작
 * - 가로: 대시보드 실제 폭(clientWidth) 그대로 사용 (가운데 정렬 유지)
 * - 세로: scrollHeight 전체 사용 → 그래프 / 텍스트 하단 잘림 방지
 * - 너무 긴 경우, 비율 유지하여 1페이지 안으로 자동 축소 (불필요한 2페이지 방지)
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
    //    - 가로: 화면에 보이는 폭(clientWidth) 기준
    //    - 세로: 전체 내용 높이(scrollHeight) 기준
    const baseWidth = element.clientWidth || element.offsetWidth || 1280;
    const baseHeight = element.scrollHeight || element.clientHeight || 720;

    // 기본적으로는 “보이는 크기 그대로” 페이지 크기로 사용
    let pageWidth = baseWidth;
    let pageHeight = baseHeight;

    // 📌 PDF 한 페이지가 가질 수 있는 최대 높이(라이브러리 한계 고려)
    const MAX_PAGE_HEIGHT = 14000; // px 기준

    // 너무 길면(예: 특정 상품에서 텍스트가 많을 때)
    // → 비율 유지하면서 전체를 축소해서 1페이지에 넣는다.
    if (pageHeight > MAX_PAGE_HEIGHT) {
      const ratio = MAX_PAGE_HEIGHT / pageHeight;
      pageWidth = pageWidth * ratio;
      pageHeight = MAX_PAGE_HEIGHT;
    }

    // 4) 파일명
    const productName =
      productInfo?.product_name ||
      dashboardData?.product?.product_name ||
      "대시보드";

    const opt = {
      margin: 0,
      filename: `${productName}_리뷰_분석_리포트.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        // DOM 레이아웃은 그대로 두고, 현재 전체 스크롤 영역을 캡처
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY, // 화면 어디까지 내려가 있었든 상관없이 전체 캡처
        width: baseWidth,
        height: baseHeight,
        windowWidth: baseWidth,
        windowHeight: baseHeight,
      },
      jsPDF: {
        unit: "px",
        // 페이지 크기 = 우리가 계산한 pageWidth / pageHeight
        //  → 가로 여백 없이, 세로는 잘리지 않게 한 장에 전부 들어감
        format: [pageWidth, pageHeight],
        orientation: "portrait",
      },
      pagebreak: {
        mode: "none", // 여러 페이지로 나누지 말고 한 장으로
      },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        // 5) 버튼 / footer 복구
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
