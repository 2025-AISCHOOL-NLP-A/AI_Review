// usePDFDownload.js
import { useCallback } from "react";
import html2pdf from "html2pdf.js";
import { getElementScrollSize } from "../hooks/useViewport";

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

    // 1) 다운로드 버튼 숨기기
    if (downloadButton) {
      downloadButton.style.display = "none";
    }

    // 2) 실제 콘텐츠 전체 크기(스크롤 기준) 측정
    const { width: scrollWidth, height: scrollHeight } =
      getElementScrollSize(element);

    const contentWidth = scrollWidth || element.clientWidth || 1024;
    const contentHeight = scrollHeight || element.clientHeight || 768;

    // 3) 화면 폭 및 최대 허용 폭 기준으로 PDF 가로 폭 제한
    //    - viewportWidth: 현재 브라우저 화면 폭
    //    - MAX_PDF_WIDTH: PDF 최대 폭 (모니터 너무 커도 이 이상으로는 안 키움)
    const viewportWidth =
      (typeof window !== "undefined" && window.innerWidth) ||
      document.documentElement.clientWidth ||
      contentWidth;

    const MAX_PDF_WIDTH = 1280; // 필요하면 1200/1024 등으로 조절 가능
    const sidePadding = 40; // 화면 좌우 여유 (스크롤 안 생기게 약간 줄이기)

    // "화면을 넘지 않도록" + "너무 넓지 않도록" + "콘텐츠보다 더 키우지는 않기"
    const targetWidth = Math.min(
      contentWidth,
      Math.max(320, viewportWidth - sidePadding),
      MAX_PDF_WIDTH
    );

    // 4) targetWidth에 맞게 전체를 축소
    const scaleToFitWidth = targetWidth / contentWidth;
    const pageWidth = targetWidth;
    const pageHeight = contentHeight * scaleToFitWidth;

    // 5) orientation (크게 의미는 없지만 넣어둠)
    const orientation =
      contentWidth >= contentHeight ? "landscape" : "portrait";

    // 6) 파일명
    const productName =
      productInfo?.product_name ||
      dashboardData?.product?.product_name ||
      "대시보드";

    const opt = {
      margin: 0,
      filename: `${productName}_리뷰_분석_리포트.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        // DOM 캡처 해상도
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,

        // 실제 DOM 전체를 캡처
        width: contentWidth,
        height: contentHeight,

        // 반응형 기준이 되는 가상 창 크기 (레이아웃 깨지지 않게)
        windowWidth: contentWidth,
        windowHeight: contentHeight,
      },
      jsPDF: {
        unit: "px",
        format: [pageWidth, pageHeight], // 가로 = 제한된 폭, 세로 = 비율대로
        orientation,
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
