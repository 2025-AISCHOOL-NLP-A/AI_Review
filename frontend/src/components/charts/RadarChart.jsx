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
  const containerRef = useRef(null);

  // Get colors from CSS variables
  const getColors = () => {
    const root = containerRef.current || document.documentElement;
    return {
      primaryColor: getComputedStyle(root).getPropertyValue('--chart-primary-color').trim() || '#6F98FF',
      primaryBg: getComputedStyle(root).getPropertyValue('--chart-primary-bg').trim() || 'rgba(111, 152, 255, 0.25)',
      primaryHover: getComputedStyle(root).getPropertyValue('--chart-primary-hover').trim() || '#587FE6',
      neutralColor: getComputedStyle(root).getPropertyValue('--chart-neutral-color').trim() || '#FFC577',
      neutralBg: getComputedStyle(root).getPropertyValue('--chart-neutral-bg').trim() || 'rgba(255, 197, 119, 0.25)',
      neutralHover: getComputedStyle(root).getPropertyValue('--chart-neutral-hover').trim() || '#F3B96B',
      textColor: getComputedStyle(root).getPropertyValue('--chart-text-color').trim() || '#6B7280',
      gridColor: getComputedStyle(root).getPropertyValue('--chart-grid-color').trim() || 'rgba(0, 0, 0, 0.1)',
    };
  };

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
            const colors = getColors();

            chartInstance.current = new Chart(ctx, {
              type: "radar",
              data: {
                labels: data.labels,
                datasets: [
                  {
                    label: "긍정 비율",
                    data: data.positive,
                    backgroundColor: colors.primaryBg,
                    borderColor: colors.primaryColor,
                    pointBackgroundColor: colors.primaryColor,
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: colors.primaryHover,
                    borderWidth: 2,
                    pointRadius: 5, // 포인트 크기
                    pointHoverRadius: 7, // 호버 시 포인트 크기
                  },
                  {
                    label: "부정 비율",
                    data: data.negative,
                    backgroundColor: colors.neutralBg,
                    borderColor: colors.neutralColor,
                    pointBackgroundColor: colors.neutralColor,
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: colors.neutralHover,
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
                      color: colors.textColor,
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
                    callbacks: {
                      label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                          label += ': ';
                        }
                        if (context.parsed.r !== null) {
                          label += context.parsed.r.toFixed(1) + '%';
                        }
                        return label;
                      }
                    },
                  },
                },
                scales: {
                  r: {
                    beginAtZero: true,
                    angleLines: {
                      color: colors.gridColor,
                      lineWidth: 1.5,
                    },
                    grid: {
                      color: colors.gridColor,
                      lineWidth: 1,
                    },
                    pointLabels: {
                      color: colors.textColor,
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
                      backdropColor: "transparent",
                      color: colors.textColor,
                      font: {
                        size: 11,
                        family: "'Pretendard', 'Noto Sans KR', sans-serif",
                      },
                      showLabelBackdrop: false,
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
    <div ref={containerRef} className="radar-chart-container">
      <div className="radar-chart-wrapper">
        <canvas
          ref={chartRef}
          className="radar-chart-canvas"
        ></canvas>
      </div>
    </div>
  );
};

export default RadarChart;
