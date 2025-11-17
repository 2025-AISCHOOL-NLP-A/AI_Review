import React, { useState } from "react";
import "../../styles/modal.css";
import "./PreviewModal.css";

/**
 * PreviewModal - 파일 미리보기 및 컬럼 매핑 모달
 * 
 * @param {Object} props
 * @param {File} props.file - 미리보기할 파일
 * @param {Object} props.previewData - { headers: string[], rows: Object[] }
 * @param {Function} props.onConfirm - 매핑 완료 시 호출 (mapping) => void
 * @param {Function} props.onClose - 모달 닫기
 */
export default function PreviewModal({ file, previewData, onConfirm, onClose }) {
  const [reviewColumn, setReviewColumn] = useState("");
  const [dateColumn, setDateColumn] = useState("");
  const [ratingColumn, setRatingColumn] = useState("");

  // 하나의 역할은 하나의 컬럼만 선택 가능하도록 처리
  const handleReviewChange = (columnName) => {
    setReviewColumn(columnName);
    if (columnName && columnName === dateColumn) setDateColumn("");
    if (columnName && columnName === ratingColumn) setRatingColumn("");
  };

  const handleDateChange = (columnName) => {
    setDateColumn(columnName);
    if (columnName && columnName === reviewColumn) setReviewColumn("");
    if (columnName && columnName === ratingColumn) setRatingColumn("");
  };

  const handleRatingChange = (columnName) => {
    setRatingColumn(columnName);
    if (columnName && columnName === reviewColumn) setReviewColumn("");
    if (columnName && columnName === dateColumn) setDateColumn("");
  };

  const handleConfirm = () => {
    // 리뷰와 날짜는 필수 - 엄격한 검증
    const reviewSelected = reviewColumn && reviewColumn.trim() !== "";
    const dateSelected = dateColumn && dateColumn.trim() !== "";
    
    if (!reviewSelected || !dateSelected) {
      alert("리뷰와 날짜 컬럼을 반드시 선택해주세요.");
      return;
    }

    // 추가 검증: 같은 컬럼이 중복 선택되지 않았는지 확인
    if (reviewColumn === dateColumn) {
      alert("리뷰와 날짜는 서로 다른 컬럼을 선택해야 합니다.");
      return;
    }

    const mapping = {
      reviewColumn: reviewColumn.trim(),
      dateColumn: dateColumn.trim(),
      ratingColumn: ratingColumn && ratingColumn.trim() !== "" ? ratingColumn.trim() : null, // 별점은 선택사항
    };

    onConfirm(mapping);
  };

  if (!previewData || !previewData.headers || previewData.rows.length === 0) {
    return (
      <div className="preview-modal-overlay" onClick={onClose}>
        <div className="preview-modal-container" onClick={(e) => e.stopPropagation()}>
          <h3>파일 미리보기</h3>
          <p>파일을 읽을 수 없습니다.</p>
          <div className="preview-modal-buttons">
            <button className="cancel" onClick={onClose}>닫기</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-container" onClick={(e) => e.stopPropagation()}>
        <h3>파일 미리보기</h3>
        <div className="preview-file-info-box">
          <div className="preview-file-name">{file.name}</div>
          <p className="preview-instruction">리뷰와 날짜는 필수, 별점은 선택입니다.</p>
        </div>
        <div className="preview-table-wrapper">
          <table className="preview-table">
            <thead>
              <tr>
                {previewData.headers.map((header, idx) => (
                  <th key={idx}>
                    <div className="column-header">{header}</div>
                  </th>
                ))}
              </tr>
              {/* 역할 선택 드롭다운 행 */}
              <tr className="mapping-row">
                {previewData.headers.map((header, idx) => (
                  <td key={idx} className="mapping-cell">
                    <select
                      value={
                        reviewColumn === header
                          ? "review"
                          : dateColumn === header
                          ? "date"
                          : ratingColumn === header
                          ? "rating"
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "review") handleReviewChange(header);
                        else if (value === "date") handleDateChange(header);
                        else if (value === "rating") handleRatingChange(header);
                        else {
                          if (reviewColumn === header) setReviewColumn("");
                          if (dateColumn === header) setDateColumn("");
                          if (ratingColumn === header) setRatingColumn("");
                        }
                      }}
                      className="mapping-select"
                    >
                      <option value="">역할 선택</option>
                      <option value="review">리뷰</option>
                      <option value="date">날짜</option>
                      <option value="rating">별점</option>
                    </select>
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.rows.slice(0, 5).map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {previewData.headers.map((header, colIdx) => (
                    <td key={colIdx}>{row[header] || ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="preview-footer-info">
          상위 5개 행만 표시됩니다.
        </div>
        <div className="preview-modal-buttons">
          <button className="cancel" onClick={onClose}>취소</button>
          <button 
            className="next" 
            onClick={handleConfirm}
            disabled={!reviewColumn || !dateColumn || reviewColumn.trim() === "" || dateColumn.trim() === ""}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

