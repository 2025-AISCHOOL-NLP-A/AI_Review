import React, { useEffect, useRef } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  BarController,
  LineController,
} from 'chart.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  BarController,
  LineController
);

const DailyTrendChart = ({ data, loading }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Color constants
  const primaryColor = "#5B8EFF";
  const neutralColor = "#CBD5E1";
  const newReviewColor = "#111827";
  const fontColor = "#333333";

  useEffect(() => {
    if (loading || !data || data.dates.length === 0) {
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
              type: "bar",
              data: {
                labels: data.dates,
                datasets: [
                  {
                    label: "긍정 비율 (%)",
                    data: data.positive,
                    backgroundColor: primaryColor,
                    yAxisID: "y",
                    stack: "Stack 0",
                  },
                  {
                    label: "부정 비율 및 기타 (%)",
                    data: data.negative,
                    backgroundColor: neutralColor,
                    yAxisID: "y",
                    stack: "Stack 0",
                  },
                  {
                    type: "line",
                    label: "해당일 신규 리뷰 수 (건수)",
                    data: data.newReviews,
                    borderColor: newReviewColor,
                    borderWidth: 2,
                    pointBackgroundColor: newReviewColor,
                    yAxisID: "y1",
                    fill: false,
                    tension: 0.3,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.5,
                layout: {
                  padding: {
                    top: 20,
                  },
                },
                plugins: {
                  legend: {
                    position: "top",
                    labels: { color: fontColor },
                  },
                  tooltip: {
                    mode: "index",
                    intersect: false,
                  },
                },
                scales: {
                  x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: {
                      padding: 10,
                    },
                  },
                  y: {
                    stacked: true,
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
          }
        }
      } catch (error) {
        console.error("Daily Trend Chart initialization error:", error);
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
          console.error("Error destroying daily trend chart:", error);
        }
        chartInstance.current = null;
      }
    };
  }, [data, loading]);

  if (loading || !data || data.dates.length === 0) {
    return (
      <div className="relative flex-1 flex items-center justify-center" style={{ minHeight: '350px', width: '100%' }}>
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">데이터가 없습니다</p>
          <p className="text-sm">일자별 트렌드 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96 flex-1">
      <canvas
        ref={chartRef}
        className="chart-canvas"
      ></canvas>
    </div>
  );
};

export default DailyTrendChart;

