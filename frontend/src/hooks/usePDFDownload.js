import { useCallback } from "react";
import html2pdf from "html2pdf.js";
import {
  applyPDFStyles,
  applyPDFCardStyles,
  restoreStyles,
  restoreCardStyles,
  createPDFOptions,
} from "../utils/viewportUtils";

/**
 * PDF 다운로드 기능을 제공하는 커스텀 훅
 * @param {Object} params - 파라미터
 * @param {React.RefObject} params.contentRef - PDF로 변환할 콘텐츠 요소의 ref
 * @param {React.RefObject} params.downloadButtonRef - 다운로드 버튼의 ref (선택사항)
 * @param {Object} params.productInfo - 제품 정보 (파일명 생성용)
 * @param {Object} params.dashboardData - 대시보드 데이터 (파일명 생성용)
 * @returns {Function} handlePDFDownload - PDF 다운로드 핸들러 함수
 */
export const usePDFDownload = ({
  contentRef,
  downloadButtonRef = null,
  productInfo = null,
  dashboardData = null,
}) => {
  const handlePDFDownload = useCallback(() => {
    if (!contentRef?.current) {
      console.warn("PDF 다운로드: 콘텐츠 요소가 없습니다.");
      return;
    }

    const downloadButton = downloadButtonRef?.current;
    const contentElement = contentRef.current;

    // 다운로드 버튼 숨기기
    if (downloadButton) {
      downloadButton.style.display = "none";
    }

    // PDF 변환을 위한 스타일 적용 (viewport 유틸리티 사용)
    const originalStyles = applyPDFStyles(contentElement, {
      width: "210mm",
      maxWidth: "210mm",
      padding: "20px",
    });

    // 모든 카드에 PDF 최적화 스타일 적용
    const cards = contentElement.querySelectorAll(".card");
    const originalCardStyles = applyPDFCardStyles(cards);

    // PDF 옵션 생성 (viewport 유틸리티 사용)
    const productName =
      productInfo?.product_name ||
      dashboardData?.product?.product_name ||
      "대시보드";
    const pdfOptions = createPDFOptions(contentElement, {
      filename: `${productName}_리뷰_분석_리포트.pdf`,
      scale: 2,
      dpi: 192,
      margin: [10, 10, 10, 10],
    });

    // PDF 생성
    html2pdf()
      .set(pdfOptions)
      .from(contentElement)
      .save()
      .then(() => {
        // 원본 스타일 복원
        restoreStyles(contentElement, originalStyles);
        restoreCardStyles(cards, originalCardStyles);

        // 다운로드 버튼 다시 표시
        if (downloadButton) {
          downloadButton.style.display = "flex";
        }
      })
      .catch((error) => {
        console.error("PDF 생성 중 오류 발생:", error);

        // 오류 발생 시에도 원본 스타일 복원
        restoreStyles(contentElement, originalStyles);
        restoreCardStyles(cards, originalCardStyles);

        // 다운로드 버튼 다시 표시
        if (downloadButton) {
          downloadButton.style.display = "flex";
        }

        alert("PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
      });
  }, [contentRef, downloadButtonRef, productInfo, dashboardData]);

  return handlePDFDownload;
};

