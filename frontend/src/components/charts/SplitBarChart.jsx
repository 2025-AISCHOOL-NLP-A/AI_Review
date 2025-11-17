import React, { useEffect, useRef } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  BarController,
} from 'chart.js';
import './SplitBarChart.css';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  BarController
);

const SplitBarChart = ({ data, loading }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Color constants
  const primaryColor = "#5B8EFF";
  const negativeColor = "#D8B4FE"; // 부정 비율 (매우 연한 보라색) - 모든 차트와 일관성 유지
  const fontColor = "#333333";

  useEffect(() => {
    if (loading || !data || data.length === 0) {
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
            const labels = data.map((d) => d.label);
            const negData = data.map((d) => -d.negRatio);
            const posData = data.map((d) => d.posRatio);

            chartInstance.current = new Chart(ctx, {
              type: "bar",
              data: {
                labels: labels,
                datasets: [
                  {
                    label: "부정 비율 (왼쪽)",
                    data: negData,
                    backgroundColor: negativeColor,
                    barPercentage: 0.7,
                  },
                  {
                    label: "긍정 비율 (오른쪽)",
                    data: posData,
                    backgroundColor: primaryColor,
                    barPercentage: 0.7,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: "y",
                plugins: {
                  legend: {
                    position: "top",
                    labels: { color: fontColor },
                    onClick: () => {}, // 범례 클릭 시 데이터셋 숨김 기능 비활성화
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const rawValue = Math.abs(context.raw);
                        const count =
                          context.datasetIndex === 0
                            ? data[context.dataIndex].negCount
                            : data[context.dataIndex].posCount;
                        return `${context.dataset.label}: ${rawValue}% (${count}개)`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    stacked: true,
                    min: -100,
                    max: 100,
                    ticks: {
                      callback: function (value) {
                        return Math.abs(value) + "%";
                      },
                      color: fontColor,
                    },
                    title: {
                      display: true,
                      text: "감정 비율",
                    },
                    grid: {
                      color: (context) =>
                        context.tick.value === 0 ? "#000" : "#E5E7EB",
                    },
                  },
                  y: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { color: fontColor },
                  },
                },
              },
            });
          }
        }
      } catch (error) {
        console.error("Split Bar Chart initialization error:", error);
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
          console.error("Error destroying split bar chart:", error);
        }
        chartInstance.current = null;
      }
    };
  }, [data, loading]);

  if (loading || !data || data.length === 0) {
    return (
      <div className="splitbar-chart-loading">
        <div className="splitbar-chart-content">
          <p className="splitbar-chart-title">데이터가 없습니다</p>
          <p className="splitbar-chart-subtitle">키워드 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="splitbar-chart-container">
      <canvas ref={chartRef} className="splitbar-chart-canvas"></canvas>
    </div>
  );
};

export default SplitBarChart;

