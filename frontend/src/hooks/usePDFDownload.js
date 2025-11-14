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
    if (!element) return;

    const downloadButton = downloadButtonRef?.current;
    if (downloadButton) downloadButton.style.display = "none";

    const { width: scrollWidth, height: scrollHeight } =
      getElementScrollSize(element);

    const contentWidth = scrollWidth;
    const contentHeight = scrollHeight;

    const screenWidth = window.innerWidth; // 화면 실제 너비
    const padding = 32; // 좌우 여백
    const targetWidth = screenWidth - padding;

    // 📌 실제 PDF 찍기 전에 화면에 보이는 비율로 축소
    const scale = targetWidth / contentWidth;
    element.style.transform = `scale(${scale})`;
    element.style.transformOrigin = "top left";
    element.style.width = `${contentWidth}px`;

    const productName =
      productInfo?.product_name ||
      dashboardData?.product?.product_name ||
      "대시보드";

    const opt = {
      margin: 0,
      filename: `${productName}_리뷰_분석.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: contentWidth * scale,
        windowHeight: contentHeight * scale,
      },
      jsPDF: {
        unit: "px",
        format: [targetWidth, contentHeight * scale], // 📌 화면 기준 크기
        orientation: "portrait",
      },
      pagebreak: { mode: "none" },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        // 원래 크기로 복구
        element.style.transform = "";
        element.style.width = "";
        if (downloadButton) downloadButton.style.display = "flex";
      })
      .catch(() => {
        element.style.transform = "";
        element.style.width = "";
        if (downloadButton) downloadButton.style.display = "flex";
      });
  }, [contentRef, downloadButtonRef, productInfo, dashboardData]);

  return handlePDFDownload;
};
