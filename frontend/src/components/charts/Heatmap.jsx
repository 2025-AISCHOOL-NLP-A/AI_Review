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

  // 상관관계 값 계산 함수 (현재는 더미 데이터, 나중에 실제 계산 로직으로 대체)
  const getCorrelationValue = (rowIndex, colIndex) => {
    if (rowIndex === colIndex) {
      return null; // 자기 자신과의 상관관계는 표시하지 않음
    }
    
    // matrix에서 값 가져오기 (matrix[rowLabel][colLabel] 형식)
    const rowLabel = labels[rowIndex];
    const colLabel = labels[colIndex];
    
    if (matrix && matrix[rowLabel] && matrix[rowLabel][colLabel] !== undefined) {
      return matrix[rowLabel][colLabel];
    }
    
    // 더미 데이터: 랜덤한 상관관계 값 생성 (실제로는 DB에서 계산된 값 사용)
    // 실제 구현 시 이 부분을 제거하고 matrix에서 값을 가져와야 함
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
        } else if (value !== null && value !== undefined) {
          // 상관관계 값이 있는 경우
          // 값 범위: 0 ~ 1 (또는 -1 ~ 1)
          // 정규화: 0.18 ~ 0.82 범위를 0 ~ 5로 매핑
          const normalized = (value - 0.18) / (0.82 - 0.18);
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
          bgColor = bgClasses[intensity] || "heatmap-cell-blue-200";

          let icon = "🔵";
          if (value >= 0.7) icon = "🔵";
          else if (value >= 0.4) icon = "🔵";
          else if (value >= 0.2) icon = "🔵";

          cellContent = (
            <span className="heatmap-cell-content">
              <span className="heatmap-cell-icon">{icon}</span>
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
      <div className="heatmap-header">
        <div className="heatmap-header-empty"></div>
        {labels.map((label, idx) => (
          <div key={idx} className="heatmap-header-label">{label}</div>
        ))}
        {labels.length < 5 && Array(5 - labels.length).fill(0).map((_, idx) => (
          <div key={`empty-${idx}`} className="heatmap-header-empty">-</div>
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

