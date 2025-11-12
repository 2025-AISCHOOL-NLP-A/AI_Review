import React from 'react';
import './Heatmap.css';

const Heatmap = ({ labels, matrix, loading }) => {
  // Color constants
  const fontColor = "#333333";

  if (loading || !labels || labels.length === 0) {
    return (
      <div className="heatmap-loading">
        <div className="heatmap-content">
          <p className="heatmap-title">데이터가 없습니다</p>
          <p className="heatmap-subtitle">키워드 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // 상관관계 값 가져오기 함수
  // matrix는 2D 배열 형태: [[0.26, 0.01, 0.18, ...], [0.01, 0.02, ...], ...]
  const getCorrelationValue = (rowIndex, colIndex) => {
    if (rowIndex === colIndex) {
      return null; // 자기 자신과의 상관관계는 표시하지 않음
    }
    
    // matrix가 2D 배열인 경우
    if (Array.isArray(matrix) && matrix.length > rowIndex) {
      const row = matrix[rowIndex];
      if (Array.isArray(row) && row.length > colIndex) {
        const value = row[colIndex];
        // 값이 유효한 숫자인지 확인
        if (typeof value === 'number' && !isNaN(value)) {
          return value;
        }
      }
    }
    
    return null;
  };

  const renderHeatmap = () => {
    let html = [];
    labels.forEach((rowLabel, rowIndex) => {
      let rowCells = [];
      
      // 행 레이블 추가
      rowCells.push(
        <div
          key={`label-${rowIndex}`}
          className="heatmap-row-label"
          title={rowLabel}
        >
          {rowLabel}
        </div>
      );

      // 각 열에 대한 셀 생성
      labels.forEach((colLabel, colIndex) => {
        let cellContent = "-";
        let bgColor = "heatmap-cell-empty";
        let value = getCorrelationValue(rowIndex, colIndex);

        if (rowIndex === colIndex) {
          // 대각선 (자기 자신과의 상관관계)
          cellContent = "-";
          bgColor = "heatmap-cell-empty";
        } else if (value !== null && value !== undefined && value > 0) {
          // 상관관계 값이 있는 경우
          // 값 범위: 0 ~ 1
          // 정규화: 0 ~ 1 범위를 0 ~ 5로 매핑
          const normalized = Math.min(1, Math.max(0, value));
          const intensity = Math.min(
            5,
            Math.max(0, Math.round(normalized * 5))
          );
          
          const bgClasses = [
            "heatmap-cell-blue-100",
            "heatmap-cell-blue-200",
            "heatmap-cell-blue-300",
            "heatmap-cell-blue-400",
            "heatmap-cell-blue-500",
            "heatmap-cell-blue-600",
          ];
          bgColor = bgClasses[intensity] || "heatmap-cell-blue-100";

          // 숫자만 표시 (이모지 제거)
          cellContent = (
            <span className="heatmap-cell-content">
              <span className="heatmap-cell-value">{value.toFixed(2)}</span>
            </span>
          );
        } else {
          // 데이터가 없는 경우
          cellContent = "-";
          bgColor = "heatmap-cell-empty";
        }

        rowCells.push(
          <div
            key={`cell-${rowIndex}-${colIndex}`}
            className={`heatmap-cell ${bgColor}`}
            title={value !== null && value !== undefined ? `${rowLabel} - ${colLabel}: ${value.toFixed(2)}` : ''}
          >
            {cellContent}
          </div>
        );
      });

      html.push(
        <div
          key={`row-${rowIndex}`}
          className="heatmap-row"
          style={{ gridTemplateColumns: `minmax(50px, auto) repeat(${labels.length}, 1fr)` }}
        >
          {rowCells}
        </div>
      );
    });
    return html;
  };

  return (
    <div className="heatmap-container">
      {/* 헤더: 열 레이블 */}
      <div className="heatmap-header" style={{ gridTemplateColumns: `minmax(50px, auto) repeat(${labels.length}, 1fr)` }}>
        <div className="heatmap-header-empty"></div>
        {labels.map((label, idx) => (
          <div key={idx} className="heatmap-header-label" title={label}>{label}</div>
        ))}
      </div>
      
      {/* 히트맵 본문 */}
      <div className="heatmap-body">
        {renderHeatmap()}
      </div>
      
      {/* 범례 설명 */}
      <p className="heatmap-legend">
        <span className="heatmap-legend-icon">🔵</span> 진할수록 함께
        언급되는 빈도가 높음.
      </p>
    </div>
  );
};

export default Heatmap;

