import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './DailyTrendChart.css';

const DailyTrendChart = ({ data, loading }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const containerRef = useRef(null);
  const actualDataLengthRef = useRef(0); // 실제 사용되는 데이터 길이 저장

  // CSS 변수에서 색상 가져오기 (더 안전한 방법)
  const getColor = (varName, fallback) => {
    try {
      // containerRef가 있으면 그것을 사용, 없으면 document.documentElement 사용
      const element = containerRef.current || document.documentElement;
      const value = getComputedStyle(element).getPropertyValue(varName).trim();
      return value || fallback;
    } catch (error) {
      return fallback;
    }
  };

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
      const primaryColor = getColor('--chart-primary-color', "#5B8EFF");
      const neutralColor = getColor('--chart-neutral-color', "#CBD5E1");
      const newReviewColor = getColor('--chart-new-review-color', "#111827");
      const fontColor = getColor('--chart-font-color', "#333333");

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
              borderColor: newReviewColor,
              borderWidth: 3, // 선 두께 증가로 더 잘 보이게
              pointBackgroundColor: newReviewColor,
              pointRadius: 4, // 포인트 크기 증가
              pointHoverRadius: 6, // 호버 시 포인트 크기 증가
              pointBorderWidth: 2, // 포인트 테두리 두께
              pointBorderColor: '#FFFFFF', // 포인트 테두리 색상 (흰색으로 더 눈에 띄게)
              yAxisID: "y1",
              fill: false,
              tension: 0.3,
              order: 1, // 선은 위쪽 (작은 order 값) - order가 작을수록 위에 표시됨
              pointStyle: 'line', // 범례 아이콘을 선으로 표시
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
              labels: { 
                color: fontColor,
                generateLabels: (chart) => {
                  // Chart.js의 기본 범례 라벨 생성 함수 사용
                  const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                  
                  // 각 라벨에 대해 데이터셋 타입에 맞게 스타일 조정
                  labels.forEach((label) => {
                    const datasetIndex = label.datasetIndex;
                    if (datasetIndex !== undefined) {
                      const dataset = chart.data.datasets[datasetIndex];
                      // 선 차트(type: 'line')인 경우 범례 아이콘을 선으로 표시
                      if (dataset && dataset.type === 'line') {
                        // 선 차트의 범례 아이콘을 선으로 표시
                        label.fillStyle = 'transparent'; // 배경 투명 (선만 표시)
                        label.strokeStyle = dataset.borderColor || newReviewColor; // 선 색상
                        label.lineWidth = dataset.borderWidth || 3; // 선 두께
                        label.pointStyle = 'line'; // 선 스타일 사용
                        label.usePointStyle = true; // 포인트 스타일 사용 활성화
                        // 범례 아이콘을 선으로 그리기 위해 textAlign과 padding 조정
                        label.textAlign = 'left';
                      } else {
                        // 바 차트의 경우 기본 사각형 유지
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
            },
          },
          scales: {
            x: {
              stacked: false,
              grid: { display: false },
              ticks: {
                padding: 10,
                maxTicksLimit: undefined, // 제한 제거 - 전체 데이터 표시
                color: fontColor,
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
                color: newReviewColor,
              },
              grid: { drawOnChartArea: false },
              ticks: { color: newReviewColor },
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

