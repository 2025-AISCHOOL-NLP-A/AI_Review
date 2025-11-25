import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { getChartColors } from '../../utils/format/chartColors';
import './DailyTrendChart.css';

// hex 색상을 rgba로 변환하는 헬퍼 함수
const hexToRgba = (hex, alpha = 1) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex; // 변환 실패 시 원본 반환
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Vanishing 애니메이션 함수
function animateOpacity(dataset, chart, start, end) {
  const duration = 400;
  const frameRate = 1000 / 60;
  const totalFrames = duration / frameRate;
  let frame = 0;

  const animate = () => {
    frame++;
    const progress = frame / totalFrames;

    // easeOutQuart 곡선
    const eased = 1 - Math.pow(1 - progress, 4);

    dataset._opacity = start + (end - start) * eased;

    chart.update('none');

    if (frame < totalFrames) {
      requestAnimationFrame(animate);
    } else {
      dataset._opacity = end;
      chart.update('none');
    }
  };

  animate();
}

const DailyTrendChart = ({ data, loading }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const containerRef = useRef(null);
  const actualDataLengthRef = useRef(0); // 실제 사용되는 데이터 길이 저장
  const originalLineColorRef = useRef(null); // 원본 선 색상 저장

  useEffect(() => {
    // 기존 차트 제거
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    // 로딩 중이거나 데이터가 없으면 차트 생성하지 않음
    if (loading) {
      return;
    }

    if (!data) {
      return;
    }

    if (!data.dates || !Array.isArray(data.dates) || data.dates.length === 0) {
      return;
    }

    // chartRef와 canvas가 준비되었는지 확인
    if (!chartRef.current) {
      return;
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) {
      return;
    }

    // containerRef가 준비될 때까지 대기
    const initChart = () => {
      // CSS 변수에서 색상 가져오기
      const colors = getChartColors(containerRef.current);
      const primaryColor = colors.primary;
      const neutralColor = colors.neutral;
      const lineColor = colors.lineColor;
      const textColor = colors.textColor;

      try {
        // 데이터 검증 및 준비
        const rawDates = Array.isArray(data.dates) ? data.dates : [];
        const rawPositive = Array.isArray(data.positive) ? data.positive : [];
        const rawNegative = Array.isArray(data.negative) ? data.negative : [];
        const rawNewReviews = Array.isArray(data.newReviews) ? data.newReviews : [];

        if (rawDates.length === 0) {
          return;
        }

        // 월별 데이터는 전체 표시 (성능 최적화 제한 제거)
        const chartData = {
          dates: rawDates,
          positive: rawPositive,
          negative: rawNegative,
          newReviews: rawNewReviews,
        };

        // 실제 사용되는 데이터 길이 저장 (minWidth 계산용)
        actualDataLengthRef.current = chartData.dates.length;

        // 배열 길이 맞추기 (모든 배열을 dates 길이에 맞춤)
        const targetLength = chartData.dates.length;
        const paddedPositive = chartData.positive.length < targetLength
          ? [...chartData.positive, ...new Array(targetLength - chartData.positive.length).fill(0)]
          : chartData.positive.slice(0, targetLength);
        const paddedNegative = chartData.negative.length < targetLength
          ? [...chartData.negative, ...new Array(targetLength - chartData.negative.length).fill(0)]
          : chartData.negative.slice(0, targetLength);
        const paddedNewReviews = chartData.newReviews.length < targetLength
          ? [...chartData.newReviews, ...new Array(targetLength - chartData.newReviews.length).fill(0)]
          : chartData.newReviews.slice(0, targetLength);

        // 차트 생성
        chartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: chartData.dates,
            datasets: [
              {
                label: "긍정 비율 (%)",
                data: paddedPositive,
                backgroundColor: primaryColor,
                yAxisID: "y",
                order: 2, // 막대는 아래쪽 (큰 order 값)
              },
              {
                label: "부정 비율 및 기타 (%)",
                data: paddedNegative,
                backgroundColor: neutralColor,
                yAxisID: "y",
                order: 2, // 막대는 아래쪽 (큰 order 값)
              },
              {
                type: "line",
                label: "해당일 신규 리뷰 수 (건수)",
                data: paddedNewReviews,
                borderColor: lineColor,
                borderWidth: 3, // 선 두께 증가로 더 잘 보이게
                pointBackgroundColor: lineColor,
                pointRadius: 2, // 포인트 크기 증가
                pointHoverRadius: 4, // 호버 시 포인트 크기 증가
                pointBorderWidth: 1, // 포인트 테두리 두께
                pointBorderColor: lineColor, // 포인트 테두리도 원본 색상 사용
                yAxisID: "y1",
                fill: false,
                tension: 0.3,
                order: 1, // 선은 위쪽 (작은 order 값) - order가 작을수록 위에 표시됨
                pointStyle: 'circle', // 범례 아이콘을 선으로 표시
                // 애니메이션용 원본 색상 저장
                _originalColor: lineColor,
                // 현재 선의 투명도 (0~1)
                _opacity: 1,
                // segment를 사용하여 렌더링 시점에 opacity 조절
                segment: {
                  borderColor: (ctx) => {
                    const ds = ctx.chart.data.datasets[2];
                    const color = ds._originalColor || lineColor;

                    return hexToRgba(color, ds._opacity || 1); // _opacity 사용
                  },
                  backgroundColor: (ctx) => {
                    const ds = ctx.chart.data.datasets[2];
                    const color = ds._originalColor || lineColor;

                    return hexToRgba(color, ds._opacity || 1); // _opacity 사용
                  },
                },
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: chartData.dates.length > 10 ? 2 : 1.5,
            layout: {
              padding: {
                top: 20,
              },
            },
            plugins: {
              legend: {
                position: "top",
                onClick: (e, legendItem, legend) => {
                  // 범례 클릭 시 애니메이션과 함께 업데이트 (페이드아웃 효과)
                  const index = legendItem.datasetIndex;

                  // 선 그래프(인덱스 2)만 페이드아웃 효과 적용
                  if (index === 2) {
                    const chart = legend.chart;
                    const meta = chart.getDatasetMeta(index);
                    const dataset = chart.data.datasets[index];

                    if (meta && dataset) {
                      // CSS 변수에서 원본 색상 가져오기
                      const colors = getChartColors(containerRef.current);
                      const originalHexColor = colors.lineColor;

                      // 원본 색상 저장 (항상 hex 형식)
                      dataset._originalColor = originalHexColor;

                      // 현재 숨김 상태 확인
                      const hidden = !meta.hidden;
                      meta.hidden = hidden;

                      // 애니메이션 위한 opacity 설정
                      if (hidden) {
                        // 사라질 때 → 1 → 0
                        dataset._opacity = 1;
                        animateOpacity(dataset, chart, 1, 0);
                      } else {
                        // 나타날 때 → 0 → 1
                        dataset._opacity = 0;
                        animateOpacity(dataset, chart, 0, 1);
                      }
                    }
                  } else {
                    // 다른 데이터셋은 기본 동작 사용
                    const chart = legend.chart;
                    const meta = chart.getDatasetMeta(index);
                    if (meta) {
                      meta.hidden = !meta.hidden;
                      chart.update('active');
                    }
                  }
                },
                labels: {
                  color: textColor,
                  generateLabels: (chart) => {
                    // Chart.js의 기본 범례 라벨 생성 함수 사용
                    const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);

                    // 각 라벨에 대해 데이터셋 타입에 맞게 스타일 조정
                    labels.forEach((label) => {
                      const datasetIndex = label.datasetIndex;
                      if (datasetIndex !== undefined) {
                        const dataset = chart.data.datasets[datasetIndex];

                        // 선 차트인 경우 legend 색상은 항상 _originalColor 사용
                        if (dataset && dataset.type === 'line') {
                          const originalColor = dataset._originalColor || dataset.borderColor;

                          label.fillStyle = 'transparent';
                          label.strokeStyle = originalColor;  // 항상 HEX 적용
                          label.lineWidth = dataset.borderWidth || 3;
                          label.pointStyle = 'line';
                          label.usePointStyle = true;
                        } else {
                          label.usePointStyle = false;
                        }
                      }
                    });

                    return labels;
                  },
                },
              },
              tooltip: {
                mode: "index",
                intersect: false,
              },
            },
            // 선 차트가 바 차트 위에 그려지도록 설정
            interaction: {
              mode: 'index',
              intersect: false,
            },
            // 애니메이션 설정 - 페이드아웃 효과 (위치 변경 없이 opacity만 조절)
            animations: {
              // 전체 애니메이션 비활성화 (위치 이동 방지)
              x: false,
              y: false,
              // opacity 애니메이션만 사용
              opacity: {
                duration: 400,
                easing: 'easeOutQuart',
              },
            },
            animation: {
              duration: 400, // 애니메이션 지속 시간 (ms)
              easing: 'easeOutQuart', // 페이드아웃에 적합한 이징 함수
              // 위치 애니메이션 비활성화
              x: false,
              y: false,
              onStart: (animation) => {
                // 애니메이션 시작 전 원본 색상 확실하게 저장
                const chart = animation.chart;
                const lineDataset = chart.data.datasets[2];

                if (lineDataset) {
                  // CSS 변수에서 항상 최신 원본 색상 가져오기
                  const colors = getChartColors(containerRef.current);
                  const originalHexColor = colors.lineColor;

                  // _originalColor가 없거나 rgba로 변환된 경우 원본 hex로 저장
                  if (!lineDataset._originalColor ||
                    (typeof lineDataset._originalColor === 'string' && lineDataset._originalColor.startsWith('rgba'))) {
                    lineDataset._originalColor = originalHexColor;
                  }
                }
              },
              // onProgress와 onComplete 제거 - segment.borderColor가 렌더링 시점에 처리
            },
            elements: {
              line: {
                borderWidth: 3,
                borderJoinStyle: 'round',
                borderCapStyle: 'round',
              },
              point: {
                radius: 4,
                hoverRadius: 6,
                borderWidth: 2,
                // 포인트도 segment와 동일한 방식으로 처리
                backgroundColor: (ctx) => {
                  const ds = ctx.chart.data.datasets[2];
                  const color = ds._originalColor || lineColor;

                  return hexToRgba(color, ds._opacity || 1); // _opacity 사용
                },
                borderColor: (ctx) => {
                  const ds = ctx.chart.data.datasets[2];
                  const color = ds._originalColor || lineColor;

                  return hexToRgba(color, ds._opacity || 1); // _opacity 사용
                },
              },
            },
            scales: {
              x: {
                stacked: false,
                grid: { display: false },
                ticks: {
                  padding: 10,
                  maxTicksLimit: undefined, // 제한 제거 - 전체 데이터 표시
                  color: textColor,
                },
              },
              y: {
                stacked: false,
                position: "left",
                title: {
                  display: true,
                  text: "비율 (%)",
                  color: primaryColor,
                },
                max: 100,
                ticks: { color: primaryColor },
              },
              y1: {
                position: "right",
                title: {
                  display: true,
                  text: "신규 리뷰 수 (건수)",
                  color: lineColor,
                },
                grid: { drawOnChartArea: false },
                ticks: { color: lineColor },
              },
            },
          },
        });

        // 차트 업데이트 및 리사이즈 강제 실행
        if (chartInstance.current) {
          // 짧은 지연 후 업데이트 (DOM이 완전히 렌더링된 후)
          setTimeout(() => {
            if (chartInstance.current) {
              chartInstance.current.update('none');
              chartInstance.current.resize();
            }
          }, 100);
        }
      } catch (error) {
        console.error("Chart initialization error:", error);
        if (chartInstance.current) {
          chartInstance.current = null;
        }
      }
    };

    // containerRef가 준비될 때까지 약간의 지연 후 차트 초기화
    let timeoutId = null;
    if (containerRef.current) {
      initChart();
    } else {
      // containerRef가 아직 없으면 짧은 지연 후 재시도
      timeoutId = setTimeout(() => {
        if (chartRef.current && !chartInstance.current) {
          initChart();
        }
      }, 50);
    }

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (chartInstance.current) {
        try {
          chartInstance.current.destroy();
        } catch (error) {
          // 에러 무시
        }
        chartInstance.current = null;
      }
    };
  }, [data, loading]);

  // 로딩 중이거나 데이터가 없을 때 표시
  if (loading) {
    return (
      <div className="daily-trend-chart-loading">
        <div className="daily-trend-chart-content">
          <p className="daily-trend-chart-title">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.dates || !Array.isArray(data.dates) || data.dates.length === 0) {
    return (
      <div className="daily-trend-chart-empty">
        <div className="daily-trend-chart-content">
          <p className="daily-trend-chart-title">데이터가 없습니다</p>
          <p className="daily-trend-chart-subtitle">일자별 트렌드 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // 실제 사용되는 데이터 길이를 기반으로 minWidth 계산 (최대 90개)
  const actualLength = actualDataLengthRef.current || (data.dates.length > 90 ? 90 : data.dates.length);
  const minWidth = actualLength > 10 ? Math.max(800, actualLength * 60) : '100%';
  const wrapperStyle = {
    minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
    width: typeof minWidth === 'number' ? `${minWidth}px` : minWidth, // width도 minWidth와 동일하게 설정하여 스크롤 활성화
    height: '400px',
  };

  return (
    <div ref={containerRef} className="daily-trend-chart-container">
      <div className="daily-trend-chart-wrapper" style={wrapperStyle}>
        <canvas
          ref={chartRef}
          className="daily-trend-chart-canvas"
          width={800}
          height={400}
          style={{ display: 'block', width: '100%', height: '400px' }}
        ></canvas>
      </div>
    </div>
  );
};

export default DailyTrendChart;

