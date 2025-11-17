import React, { useEffect, useRef } from 'react';
import {
  Chart,
  RadialLinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  RadarController,
} from 'chart.js';
import './RadarChart.css';

// Register Chart.js components
Chart.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  RadarController
);

const RadarChart = ({ data, loading }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Color constants
  const primaryColor = "#5B8EFF"; // 긍정 비율 (파란색)
  const negativeColor = "#D8B4FE"; // 부정 비율 (매우 연한 보라색) - 파란색과 조화롭고 부드러운 느낌
  const fontColor = "#333333";

  useEffect(() => {
    if (loading || !data || data.labels.length === 0) {
      // 데이터가 없으면 차트 destroy
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
      return;
    }

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    let isMounted = true;

    const initializeChart = () => {
      try {
        if (
          chartRef.current &&
          !chartInstance.current &&
          isMounted
        ) {
          const ctx = chartRef.current.getContext("2d");
          if (ctx) {
            chartInstance.current = new Chart(ctx, {
              type: "radar",
              data: {
                labels: data.labels,
                datasets: [
                  {
                    label: "긍정 비율",
                    data: data.positive,
                    backgroundColor: "rgba(91, 142, 255, 0.4)",
                    borderColor: primaryColor,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: primaryColor,
                    borderWidth: 2,
                    pointRadius: 5, // 포인트 크기
                    pointHoverRadius: 7, // 호버 시 포인트 크기
                  },
                  {
                    label: "부정 비율",
                    data: data.negative,
                    backgroundColor: "rgba(216, 180, 254, 0.3)", // 매우 연한 보라색 배경 (투명도 조정)
                    borderColor: negativeColor, // 매우 연한 보라색 테두리
                    pointBackgroundColor: negativeColor, // 매우 연한 보라색 포인트
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: negativeColor,
                    borderWidth: 2.5, // 테두리 두께 (가시성 개선)
                    pointRadius: 5, // 포인트 크기
                    pointHoverRadius: 7, // 호버 시 포인트 크기
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                  duration: 1000,
                },
                plugins: {
                  legend: {
                    position: "top",
                    labels: { 
                      color: fontColor,
                      font: {
                        size: 12,
                      },
                      usePointStyle: true,
                      padding: 15,
                    },
                  },
                  tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                      size: 14,
                      weight: 'bold',
                    },
                    bodyFont: {
                      size: 12,
                    },
                  },
                },
                scales: {
                  r: {
                    beginAtZero: true,
                    angleLines: { 
                      color: "#E5E7EB",
                      lineWidth: 1.5,
                    },
                    grid: { 
                      color: "#E5E7EB",
                      lineWidth: 1,
                    },
                    pointLabels: { 
                      color: fontColor, 
                      font: { 
                        size: 13,
                        weight: 'bold',
                        family: "'Pretendard', 'Noto Sans KR', sans-serif",
                      },
                      padding: 10,
                    },
                    min: 0,
                    max: 100,
                    ticks: {
                      stepSize: 20,
                      backdropColor: "rgba(255, 255, 255, 0.9)",
                      color: fontColor,
                      font: {
                        size: 11,
                        family: "'Pretendard', 'Noto Sans KR', sans-serif",
                      },
                      showLabelBackdrop: true,
                      z: 10,
                    },
                  },
                },
              },
            });
          }
        }
      } catch (error) {
        console.error("Radar Chart initialization error:", error);
      }
    };

    // Delay initialization slightly to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        initializeChart();
      }
    }, 100);

    // Cleanup
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (chartInstance.current) {
        try {
          chartInstance.current.destroy();
        } catch (error) {
          console.error("Error destroying radar chart:", error);
        }
        chartInstance.current = null;
      }
    };
  }, [data, loading]);

  if (loading || !data || data.labels.length === 0) {
    return (
      <div className="radar-chart-loading">
        <div className="radar-chart-content">
          <p className="radar-chart-title">데이터가 없습니다</p>
          <p className="radar-chart-subtitle">키워드 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="radar-chart-container">
      <canvas
        ref={chartRef}
        className="radar-chart-canvas"
      ></canvas>
    </div>
  );
};

export default RadarChart;

