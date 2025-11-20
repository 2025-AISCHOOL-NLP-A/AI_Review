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
  const containerRef = useRef(null);

  // Get colors from CSS variables
  const getColors = () => {
    const root = containerRef.current || document.documentElement;
    return {
      primaryColor: getComputedStyle(root).getPropertyValue('--chart-primary-color').trim() || '#6F98FF',
      primaryHover: getComputedStyle(root).getPropertyValue('--chart-primary-hover').trim() || '#587FE6',
      neutralColor: getComputedStyle(root).getPropertyValue('--chart-neutral-color').trim() || '#FFC577',
      neutralHover: getComputedStyle(root).getPropertyValue('--chart-neutral-hover').trim() || '#F3B96B',
      textColor: getComputedStyle(root).getPropertyValue('--chart-text-color').trim() || '#6B7280',
    };
  };

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
            const colors = getColors();
            const labels = data.map((d) => d.keyword);
            const negativeCounts = data.map((d) => d.negative_count);
            const positiveCounts = data.map((d) => d.positive_count);

            chartInstance.current = new Chart(ctx, {
              type: "bar",
              data: {
                labels: labels,
                datasets: [
                  {
                    label: "부정",
                    data: negativeCounts,
                    backgroundColor: colors.neutralColor,
                    hoverBackgroundColor: colors.neutralHover,
                    barPercentage: 0.7,
                    stack: "sentiment",
                  },
                  {
                    label: "긍정",
                    data: positiveCounts,
                    backgroundColor: colors.primaryColor,
                    hoverBackgroundColor: colors.primaryHover,
                    barPercentage: 0.7,
                    stack: "sentiment",
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
                    labels: { color: colors.textColor },
                    onClick: () => { }, // 범례 클릭 시 데이터셋 숨김 기능 비활성화
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const entry = data[context.dataIndex];
                        const isNegative = context.datasetIndex === 0;
                        const count = isNegative
                          ? entry.negative_count
                          : entry.positive_count;
                        const ratio = isNegative
                          ? entry.negative_ratio
                          : entry.positive_ratio;
                        const percentage = Math.round(ratio * 100);
                        return `${context.dataset.label}: ${count}개 (${percentage}%)`;
                      },
                      footer: function (tooltipItems) {
                        if (!tooltipItems.length) return "";
                        const entry = data[tooltipItems[0].dataIndex];
                        return `전체 언급량: ${entry.total_mentions}개`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                      precision: 0,
                      callback: function (value) {
                        return Number(value).toLocaleString();
                      },
                      color: colors.textColor,
                    },
                    title: {
                      display: true,
                      text: "언급량",
                    },
                  },
                  y: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { color: colors.textColor },
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
    <div ref={containerRef} className="splitbar-chart-container">
      <canvas ref={chartRef} className="splitbar-chart-canvas"></canvas>
    </div>
  );
};

export default SplitBarChart;

