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
  const primaryColor = "#5B8EFF";
  const neutralColor = "#CBD5E1";
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
                  },
                  {
                    label: "부정 비율",
                    data: data.negative,
                    backgroundColor: "rgba(203, 213, 225, 0.4)",
                    borderColor: neutralColor,
                    pointBackgroundColor: neutralColor,
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: neutralColor,
                    borderWidth: 2,
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
      <div className="relative flex-1 flex items-center justify-center" style={{ minHeight: '350px', width: '100%' }}>
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">데이터가 없습니다</p>
          <p className="text-sm">키워드 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1" style={{ minHeight: '350px', width: '100%' }}>
      <canvas
        ref={chartRef}
        className="chart-canvas"
        style={{ width: '100%', height: '100%' }}
      ></canvas>
    </div>
  );
};

export default RadarChart;

