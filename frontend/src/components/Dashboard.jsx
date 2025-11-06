import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
  RadarController,
} from "chart.js";
import html2pdf from "html2pdf.js";
import Sidebar from "./Sidebar";
import dashboardService from "../services/dashboardService";
import "../styles/dashboard.css";
import "../styles/sidebar.css";

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
  RadarController
);

function Dashboard() {
  const navigate = useNavigate();
  const dailyTrendChartRef = useRef(null);
  const radarChartRef = useRef(null);
  const splitBarChartRef = useRef(null);
  const dashboardContentRef = useRef(null);
  const downloadBtnRef = useRef(null);

  const dailyTrendChartInstance = useRef(null);
  const radarChartInstance = useRef(null);
  const splitBarChartInstance = useRef(null);

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedReviews, setExpandedReviews] = useState(new Set());

  // Color constants
  const primaryColor = "#5B8EFF";
  const neutralColor = "#CBD5E1";
  const newReviewColor = "#111827";
  const positiveHighlight = "#10B981";
  const negativeHighlight = "#EF4444";
  const fontColor = "#333333";

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await dashboardService.getDashboardData();
      if (result.success) {
        setDashboardData(result.data);
      } else {
        alert(result.message || "데이터를 불러오는데 실패했습니다.");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // 랜덤 리뷰 10개를 메모이제이션 (dashboardData.reviews가 변경될 때만 재생성)
  const randomReviews = useMemo(() => {
    if (!dashboardData?.reviews || dashboardData.reviews.length === 0) {
      return [];
    }
    // 리뷰 배열을 복사하여 랜덤으로 섞고 10개만 선택
    const shuffled = [...dashboardData.reviews].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  }, [dashboardData?.reviews]);

  // Process data for charts
  const dailyTrendData = dashboardData?.dailyTrend ? {
    dates: dashboardData.dailyTrend.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }).reverse(),
    positive: dashboardData.dailyTrend.map(item => 
      item.positive_ratio || item.positiveRatio || 0
    ).reverse(),
    negative: dashboardData.dailyTrend.map(item => 
      item.negative_ratio || item.negativeRatio || 0
    ).reverse(),
    newReviews: dashboardData.dailyTrend.map(item => item.reviewCount || 0).reverse(),
  } : {
    dates: ["1/15", "1/18", "1/21", "1/24", "1/27", "1/30", "2/02", "2/07"],
    positive: [62, 65, 68, 70, 72, 75, 77, 78],
    negative: [38, 35, 32, 30, 28, 25, 23, 22],
    newReviews: [120, 150, 200, 250, 280, 300, 305, 310],
  };

  // Process keyword data for charts using positive_ratio and negative_ratio from DB
  // Data comes from tb_productKeyword (product_id, keyword_id, positive_ratio DECIMAL(5,2), negative_ratio DECIMAL(5,2))
  // Joined with tb_keyword to get keyword_text for display (VARCHAR(50))
  const radarData = dashboardData?.keywords ? (() => {
    const keywordData = dashboardData.keywords.slice(0, 6);
    return {
      labels: keywordData.map(kw => kw.keyword_text || kw.keyword || kw.keyword_id || ''),
      positive: keywordData.map(kw => parseFloat(kw.positive_ratio || kw.positiveRatio || 0)),
      negative: keywordData.map(kw => parseFloat(kw.negative_ratio || kw.negativeRatio || 0)),
    };
  })() : {
    labels: [],
    positive: [],
    negative: [],
  };

  // Split bar chart data from tb_productKeyword
  // positive_ratio and negative_ratio are DECIMAL(5,2) - percentage values
  // Uses tb_keyword.keyword_text for label
  const splitBarRawData = dashboardData?.keywords ? dashboardData.keywords.slice(0, 5).map(kw => ({
    label: kw.keyword_text || kw.keyword || kw.keyword_id || '',
    negRatio: parseFloat(kw.negative_ratio || kw.negativeRatio || 0),
    negCount: kw.negative_count || kw.negativeCount || 0,
    posRatio: parseFloat(kw.positive_ratio || kw.positiveRatio || 0),
    posCount: kw.positive_count || kw.positiveCount || 0,
  })) : [];

  // Correlation labels from tb_keyword (linked via tb_productKeyword)
  // Uses tb_keyword.keyword_text (VARCHAR(50))
  const correlationLabels = dashboardData?.keywords ? 
    [...new Set(dashboardData.keywords.map(kw => kw.keyword_text || kw.keyword || kw.keyword_id || '').filter(Boolean))].slice(0, 5) : 
    [];
  
  const correlationMatrix = {}; // 키워드 데이터로부터 계산하거나 빈 객체로 유지


  // Initialize and update charts when data changes
  useEffect(() => {
    if (loading || !dashboardData) return;

    // Destroy existing charts
    if (dailyTrendChartInstance.current) {
      dailyTrendChartInstance.current.destroy();
      dailyTrendChartInstance.current = null;
    }
    if (radarChartInstance.current) {
      radarChartInstance.current.destroy();
      radarChartInstance.current = null;
    }
    if (splitBarChartInstance.current) {
      splitBarChartInstance.current.destroy();
      splitBarChartInstance.current = null;
    }

    let isMounted = true;

    const initializeCharts = () => {
      try {
        if (
          dailyTrendChartRef.current &&
          !dailyTrendChartInstance.current &&
          isMounted
        ) {
          const ctx = dailyTrendChartRef.current.getContext("2d");
          if (ctx) {
            dailyTrendChartInstance.current = new Chart(ctx, {
              type: "bar",
              data: {
                labels: dailyTrendData.dates,
                datasets: [
                  {
                    label: "긍정 비율 (%)",
                    data: dailyTrendData.positive,
                    backgroundColor: primaryColor,
                    yAxisID: "y",
                    stack: "Stack 0",
                  },
                  {
                    label: "부정 비율 및 기타 (%)",
                    data: dailyTrendData.negative,
                    backgroundColor: neutralColor,
                    yAxisID: "y",
                    stack: "Stack 0",
                  },
                  {
                    type: "line",
                    label: "해당일 신규 리뷰 수 (건수)",
                    data: dailyTrendData.newReviews,
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

        if (radarChartRef.current && !radarChartInstance.current && isMounted) {
          const ctx = radarChartRef.current.getContext("2d");
          if (ctx) {
            radarChartInstance.current = new Chart(ctx, {
              type: "radar",
              data: {
                labels: radarData.labels,
                datasets: [
                  {
                    label: "긍정 비율",
                    data: radarData.positive,
                    backgroundColor: "rgba(91, 142, 255, 0.4)",
                    borderColor: primaryColor,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: primaryColor,
                  },
                  {
                    label: "부정 비율",
                    data: radarData.negative,
                    backgroundColor: "rgba(203, 213, 225, 0.4)",
                    borderColor: neutralColor,
                    pointBackgroundColor: neutralColor,
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: neutralColor,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                    labels: { color: fontColor },
                  },
                },
                scales: {
                  r: {
                    angleLines: { color: "#E5E7EB" },
                    grid: { color: "#E5E7EB" },
                    pointLabels: { color: fontColor, font: { size: 14 } },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                      stepSize: 20,
                      backdropColor: "rgba(255, 255, 255, 0.7)",
                      color: fontColor,
                    },
                  },
                },
              },
            });
          }
        }

        if (
          splitBarChartRef.current &&
          !splitBarChartInstance.current &&
          isMounted
        ) {
          const ctx = splitBarChartRef.current.getContext("2d");
          if (ctx) {
            const labels = splitBarRawData.map((d) => d.label);
            const negData = splitBarRawData.map((d) => -d.negRatio);
            const posData = splitBarRawData.map((d) => d.posRatio);

            splitBarChartInstance.current = new Chart(ctx, {
              type: "bar",
              data: {
                labels: labels,
                datasets: [
                  {
                    label: "부정 비율 (왼쪽)",
                    data: negData,
                    backgroundColor: neutralColor,
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
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const rawValue = Math.abs(context.raw);
                        const count =
                          context.datasetIndex === 0
                            ? splitBarRawData[context.dataIndex].negCount
                            : splitBarRawData[context.dataIndex].posCount;
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
        console.error("Chart initialization error:", error);
      }
    };

    // Delay initialization slightly to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        initializeCharts();
      }
    }, 500);

    // Cleanup
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (dailyTrendChartInstance.current) {
        try {
          dailyTrendChartInstance.current.destroy();
        } catch (error) {
          console.error("Error destroying daily trend chart:", error);
        }
        dailyTrendChartInstance.current = null;
      }
      if (radarChartInstance.current) {
        try {
          radarChartInstance.current.destroy();
        } catch (error) {
          console.error("Error destroying radar chart:", error);
        }
        radarChartInstance.current = null;
      }
      if (splitBarChartInstance.current) {
        try {
          splitBarChartInstance.current.destroy();
        } catch (error) {
          console.error("Error destroying split bar chart:", error);
        }
        splitBarChartInstance.current = null;
      }
    };
  }, [dashboardData, loading, dailyTrendData]);

  const handlePDFDownload = () => {
    if (!dashboardContentRef.current) return;

    const downloadButton = downloadBtnRef.current;
    const contentElement = dashboardContentRef.current;
    
    if (downloadButton) {
      downloadButton.style.display = "none";
    }

    // PDF 변환 전 원본 스타일 저장
    const originalWidth = contentElement.style.width;
    const originalMaxWidth = contentElement.style.maxWidth;
    const originalPadding = contentElement.style.padding;
    
    // PDF 변환을 위한 고정 너비 설정
    contentElement.style.width = "210mm"; // A4 너비
    contentElement.style.maxWidth = "210mm";
    contentElement.style.padding = "20px";
    contentElement.style.boxSizing = "border-box";

    // 모든 카드에 고정 너비 적용
    const cards = contentElement.querySelectorAll('.card');
    const originalCardStyles = [];
    cards.forEach((card, index) => {
      originalCardStyles[index] = {
        width: card.style.width,
        minWidth: card.style.minWidth,
        maxWidth: card.style.maxWidth,
        flex: card.style.flex,
      };
      card.style.width = "auto";
      card.style.minWidth = "0";
      card.style.maxWidth = "100%";
      card.style.flex = "1 1 auto";
    });

    const opt = {
      margin: [10, 10, 10, 10],
      filename: "에어팟프로_리뷰_분석_리포트.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        logging: false, 
        dpi: 192, 
        letterRendering: true,
        useCORS: true,
        width: contentElement.scrollWidth,
        height: contentElement.scrollHeight,
        windowWidth: 210 * 3.779527559, // mm to px (210mm = ~794px)
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf()
      .set(opt)
      .from(contentElement)
      .save()
      .then(() => {
        // 원본 스타일 복원
        contentElement.style.width = originalWidth;
        contentElement.style.maxWidth = originalMaxWidth;
        contentElement.style.padding = originalPadding;
        
        cards.forEach((card, index) => {
          if (originalCardStyles[index]) {
            card.style.width = originalCardStyles[index].width;
            card.style.minWidth = originalCardStyles[index].minWidth;
            card.style.maxWidth = originalCardStyles[index].maxWidth;
            card.style.flex = originalCardStyles[index].flex;
          }
        });

        if (downloadButton) {
          downloadButton.style.display = "flex";
        }
      })
      .catch((error) => {
        console.error("PDF 다운로드 오류:", error);
        // 오류 발생 시에도 원본 스타일 복원
        contentElement.style.width = originalWidth;
        contentElement.style.maxWidth = originalMaxWidth;
        contentElement.style.padding = originalPadding;
        
        cards.forEach((card, index) => {
          if (originalCardStyles[index]) {
            card.style.width = originalCardStyles[index].width;
            card.style.minWidth = originalCardStyles[index].minWidth;
            card.style.maxWidth = originalCardStyles[index].maxWidth;
            card.style.flex = originalCardStyles[index].flex;
          }
        });

        if (downloadButton) {
          downloadButton.style.display = "flex";
        }
      });
  };

  const renderHeatmap = () => {
    let html = [];
    correlationLabels.forEach((rowLabel, rowIndex) => {
      let rowCells = [];
      rowCells.push(
        <div
          key={`label-${rowIndex}`}
          className="text-xs font-semibold text-gray-600"
        >
          {rowLabel}
        </div>
      );

      correlationLabels.forEach((colLabel, colIndex) => {
        let cellContent = "-";
        let bgColor = "bg-gray-100";
        let value = null;

        if (rowIndex === colIndex) {
          cellContent = "-";
          bgColor = "bg-gray-100";
        } else {
          // 키워드 상관관계는 나중에 DB에서 계산하거나 구현
          value = null;
        }

        if (value !== null) {
          const normalized = (value - 0.18) / (0.82 - 0.18);
          const intensity = Math.min(
            5,
            Math.max(0, Math.round(normalized * 5))
          );
          const bgClasses = [
            "bg-blue-100",
            "bg-blue-200",
            "bg-blue-300",
            "bg-blue-400",
            "bg-blue-500",
            "bg-blue-600",
          ];
          bgColor = bgClasses[intensity] || "bg-blue-200";

          let icon = "🔵";
          if (value >= 0.7) icon = "🔵";
          else if (value >= 0.4) icon = "🔵";
          else if (value >= 0.2) icon = "🔵";

          cellContent = (
            <span>
              <span className="text-lg">{icon}</span>{" "}
              <span className="font-medium">{value.toFixed(2)}</span>
            </span>
          );
        }

        rowCells.push(
          <div
            key={`cell-${rowIndex}-${colIndex}`}
            className={`p-1 h-full flex flex-col justify-center items-center ${bgColor} rounded-sm`}
          >
            {cellContent}
          </div>
        );
      });

      html.push(
        <div
          key={`row-${rowIndex}`}
          className="grid grid-cols-6 items-center border-b border-gray-100 py-2"
        >
          {rowCells}
        </div>
      );
    });
    return html;
  };

  return (
    <div className={`dashboard-page sidebar-open`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="dashboard-wrapper">
        <div
          id="dashboard-content"
          ref={dashboardContentRef}
          className="dashboard-content"
        >
          {/* Header & Filter Section */}
          <header className="pt-6 pb-4">
            <h1 className="text-3xl font-extrabold text-gray-800">
              리뷰 분석 대시보드
            </h1>
            <div className="mt-4 p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between bg-white rounded-xl shadow-sm">
              <div className="mb-3 md:mb-0">
                <span className="text-xs font-semibold uppercase text-gray-500 mr-2">
                  분석 대상
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  {loading ? "로딩 중..." : 
                   dashboardData?.product?.product_name || 
                   dashboardData?.product_name || 
                   "상품 정보 없음"}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-gray-600">
                  필터 기간: 2025.01.15 ~ 2025.02.07
                </span>
                <button className="bg-main text-white px-4 py-2 rounded-lg font-medium hover-opacity-90 transition shadow-md flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  🔍 적용하기
                </button>
                <button className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg font-medium hover-bg-gray-300 transition flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* 1. KPI Summary Cards */}
          <div className="kpi-cards-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card kpi-card">
              <h3 className="text-sm font-medium text-gray-500">
                💬 총 리뷰 수
              </h3>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-3xl font-extrabold text-gray-900">
                  {loading ? "로딩 중..." : `${dashboardData?.stats?.totalReviews || 0}건`}
                </p>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                분석 대상 전체 리뷰 수
              </p>
            </div>
            <div className="card kpi-card">
              <h3 className="text-sm font-medium text-gray-500">
                😀 긍정 비율
              </h3>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-3xl font-extrabold text-gray-900">
                  {loading ? "로딩 중..." : `${Math.round(dashboardData?.stats?.positiveRatio || 0)}%`}
                </p>
              </div>
              <p className="mt-2 text-xs text-gray-400">긍정 평가 비중</p>
            </div>
            <div className="card kpi-card">
              <h3 className="text-sm font-medium text-gray-500">
                😟 부정 비율
              </h3>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-3xl font-extrabold text-gray-900">
                  {loading ? "로딩 중..." : `${Math.round(dashboardData?.stats?.negativeRatio || 0)}%`}
                </p>
              </div>
              <p className="mt-2 text-xs text-gray-400">부정 평가 비중</p>
            </div>
            <div className="card kpi-card">
              <h3 className="text-sm font-medium text-gray-500">
                ⭐ 종합 스코어
              </h3>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-3xl font-extrabold text-gray-900">
                  {loading ? "로딩 중..." : `${parseFloat(dashboardData?.insight?.avg_rating || dashboardData?.stats?.avgRating || 0).toFixed(1)} / 5.0`}
                </p>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                전체 감정 점수 기반 산출
              </p>
            </div>
          </div>

          {/* Main Chart Section */}
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
            id="main-chart-section"
          >
            <div
              className="card lg:col-span-2 flex flex-col"
              id="daily-trend-card"
            >
              <h2 className="text-xl font-semibold mb-4">
                📊 일자별 긍·부정 포함 리뷰 비율
              </h2>
              <div className="relative h-96 flex-1">
                <canvas
                  ref={dailyTrendChartRef}
                  className="chart-canvas"
                ></canvas>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                <h4 className="font-bold text-gray-700 mb-1">📈 결과 요약:</h4>
                <p>
                  {loading ? "데이터 로딩 중..." : 
                   dashboardData?.analysis ? 
                   `긍정 비율: ${Math.round(dashboardData.analysis.positiveRatio || 0)}%, 부정 비율: ${Math.round(dashboardData.analysis.negativeRatio || 0)}%. 총 리뷰 수: ${dashboardData?.stats?.totalReviews || 0}건.` :
                   "분석 데이터가 없습니다."}
                </p>
              </div>
            </div>

            <div className="card lg:col-span-1 flex flex-col">
              <h2 className="text-xl font-semibold mb-4">
                🕸️ 속성별 감정 밸런스
              </h2>
              <div className="relative h-96 flex-1">
                <canvas
                  ref={radarChartRef}
                  className="chart-canvas"
                ></canvas>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                <h4 className="font-bold text-gray-700 mb-1">📈 해석:</h4>
                <p>
                  {loading ? "데이터 로딩 중..." : 
                   dashboardData?.analysis ?
                   `긍정 비율: ${Math.round(dashboardData.analysis.positiveRatio || 0)}%, 부정 비율: ${Math.round(dashboardData.analysis.negativeRatio || 0)}%. 평균 평점: ${parseFloat(dashboardData?.insight?.avg_rating || dashboardData.analysis.avgRating || 0).toFixed(1)}/5.0` :
                   "분석 데이터가 없습니다."}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="detailed-analysis-section">
            <div className="card lg:col-span-2" id="split-bar-chart-card">
              <h2 className="text-xl font-semibold mb-4">
                📊 속성별 긍·부정 분기형 막대 그래프
              </h2>
              <div className="relative h-96">
                <canvas ref={splitBarChartRef}></canvas>
              </div>
            </div>

            <div className="card lg:col-span-1" id="heatmap-card">
              <h2 className="text-xl font-semibold mb-4">
                🔥 속성 상관관계 히트맵
              </h2>
              {loading || !dashboardData?.keywords || correlationLabels.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {loading ? "로딩 중..." : "키워드 데이터가 없습니다."}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-6 text-center text-sm font-semibold border-b border-gray-200 pb-2">
                    <div className="text-gray-500"></div>
                    {correlationLabels.map((label, idx) => (
                      <div key={idx} className="text-gray-600">{label}</div>
                    ))}
                    {correlationLabels.length < 5 && Array(5 - correlationLabels.length).fill(0).map((_, idx) => (
                      <div key={`empty-${idx}`} className="text-gray-500">-</div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs">{renderHeatmap()}</div>
                  <p className="mt-4 text-xs text-gray-500">
                    <span className="text-main font-bold">🔵</span> 진할수록 함께
                    언급되는 빈도가 높음.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Word Cloud & Review Sample */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="wordcloud-review-section">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">
                🌈 감정 워드클라우드
              </h2>
              <div className="flex flex-wrap gap-3">
                {loading ? (
                  <span className="text-gray-500">로딩 중...</span>
                ) : (() => {
                  // Parse pos_top_keywords from tb_productInsight (VARCHAR(255), comma-separated)
                  const posKeywords = dashboardData?.insight?.pos_top_keywords 
                    ? dashboardData.insight.pos_top_keywords.split(/[|,]/).map(k => k.trim()).filter(Boolean)
                    : dashboardData?.analysis?.positiveKeywords || [];
                  
                  return posKeywords.length > 0 ? (
                    posKeywords.slice(0, 6).map((keyword, idx) => {
                      const keywordText = typeof keyword === 'string' ? keyword : keyword.keyword_text || keyword.keyword || keyword;
                      return (
                        <span
                          key={idx}
                          className={`wordcloud-positive wordcloud-size-${idx} ${idx === 0 ? "font-bold" : ""}`}
                        >
                          {keywordText}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-500">긍정 키워드 데이터가 없습니다.</span>
                  );
                })()}
              </div>
              <div className="border-t border-gray-100 my-4"></div>
              <div className="flex flex-wrap gap-3">
                {loading ? (
                  <span className="text-gray-500">로딩 중...</span>
                ) : (() => {
                  // Parse neg_top_keywords from tb_productInsight (VARCHAR(255), comma-separated)
                  const negKeywords = dashboardData?.insight?.neg_top_keywords 
                    ? dashboardData.insight.neg_top_keywords.split(/[|,]/).map(k => k.trim()).filter(Boolean)
                    : dashboardData?.analysis?.negativeKeywords || [];
                  
                  return negKeywords.length > 0 ? (
                    negKeywords.slice(0, 5).map((keyword, idx) => {
                      const keywordText = typeof keyword === 'string' ? keyword : keyword.keyword_text || keyword.keyword || keyword;
                      return (
                        <span
                          key={idx}
                          className={`wordcloud-negative wordcloud-size-${idx} ${idx === 0 ? "font-bold" : ""}`}
                        >
                          {keywordText}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-500">부정 키워드 데이터가 없습니다.</span>
                  );
                })()}
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">💬 리뷰 원문 샘플</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      <th className="px-3 py-3 text-left">날짜</th>
                      <th className="px-3 py-3 text-left">리뷰 내용</th>
                      <th className="px-3 py-3 text-left">감정 요약</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan="3" className="px-3 py-2 text-center text-gray-500">
                          로딩 중...
                        </td>
                      </tr>
                    ) : randomReviews.length > 0 ? (
                      randomReviews.map((review, idx) => {
                          const reviewDate = new Date(review.review_date);
                          const formattedDate = `${reviewDate.getMonth() + 1}/${reviewDate.getDate()}`;
                          const rating = parseFloat(review.rating) || 0;
                          const reviewId = review.review_id || idx;
                          const reviewText = review.review_text || "";
                          const isExpanded = expandedReviews.has(reviewId);
                          const isLongText = reviewText.length > 150;
                          const displayText = isLongText && !isExpanded 
                            ? reviewText.substring(0, 150) + "..."
                            : reviewText;
                          
                          const toggleExpand = () => {
                            setExpandedReviews(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(reviewId)) {
                                newSet.delete(reviewId);
                              } else {
                                newSet.add(reviewId);
                              }
                              return newSet;
                            });
                          };
                          
                          return (
                            <tr key={reviewId} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                                {formattedDate}
                              </td>
                              <td className="px-3 py-2 text-gray-900">
                                <div>
                                  {displayText}
                                  {isLongText && (
                                    <button
                                      onClick={toggleExpand}
                                      className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                                    >
                                      {isExpanded ? "접기" : "더보기"}
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  rating >= 4 ? "bg-pos-light text-pos" : 
                                  rating <= 2 ? "bg-neg-light text-neg" : 
                                  "bg-gray-200 text-gray-600"
                                } mr-1`}>
                                  {rating >= 4 ? "🟩" : rating <= 2 ? "🟥" : "⚪"} 평점 {rating.toFixed(1)}
                                </span>
                                {review.source && (
                                  <span className="ml-1 text-xs text-gray-400">({review.source})</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-3 py-2 text-center text-gray-500">
                          리뷰 데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Insights and AI Report Section */}
          {/* Data from tb_productInsight: insight_summary (TEXT), improvement_suggestion (TEXT) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="insights-section">
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">A. 핵심 인사이트</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {loading ? "데이터 로딩 중..." : 
                 dashboardData?.insight?.insight_summary ?
                 dashboardData.insight.insight_summary :
                 dashboardData?.analysis ?
                 `👍 전체 긍정률 ${Math.round(dashboardData.analysis.positiveRatio || 0)}%${dashboardData.analysis.positiveKeywords?.length > 0 ? `, 주요 긍정 키워드: ${dashboardData.analysis.positiveKeywords.slice(0, 3).map(k => typeof k === 'string' ? k : k.keyword_text || k.keyword || k).join(", ") || "없음"}` : ""}` :
                 "인사이트 데이터가 없습니다."}
              </p>
            </div>
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">B. 개선 제안</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {loading ? "데이터 로딩 중..." : 
                 dashboardData?.insight?.improvement_suggestion ?
                 dashboardData.insight.improvement_suggestion :
                 dashboardData?.analysis && dashboardData.analysis.negativeRatio > 0 ?
                 `⚙️ 부정 비율 ${Math.round(dashboardData.analysis.negativeRatio || 0)}%${dashboardData.analysis.negativeKeywords?.length > 0 ? `, 주요 부정 키워드: ${dashboardData.analysis.negativeKeywords.slice(0, 2).map(k => typeof k === 'string' ? k : k.keyword_text || k.keyword || k).join(", ") || "없음"}. 개선 필요` : ""}` :
                 dashboardData?.analysis ? "개선이 필요한 영역이 없습니다." : "인사이트 데이터가 없습니다."}
              </p>
            </div>
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">C. 리뷰 샘플</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {loading ? "데이터 로딩 중..." : 
                 dashboardData?.reviews?.length > 0 ?
                 dashboardData.reviews.slice(0, 3).map((review, idx) => 
                   `💬 "${review.review_text}"`
                 ).join(" ") :
                 "리뷰 데이터가 없습니다."}
              </p>
            </div>
          </div>

          {/* AI 인사이트 리포트 - 전체 너비 차지 */}
          <div className="grid grid-cols-1 gap-6" id="ai-insight-report-section">
            <div className="card w-full">
              <h2 className="text-xl font-semibold mb-4">
                🤖 AI 인사이트 리포트
              </h2>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm whitespace-pre-wrap text-gray-800">
                {loading ? "데이터 로딩 중..." : 
                 dashboardData?.insight ? (() => {
                   // Data from tb_productInsight
                  const posKeywords = dashboardData.insight.pos_top_keywords 
                    ? dashboardData.insight.pos_top_keywords.split(/[|,]/).map(k => k.trim()).slice(0, 3).join(", ")
                     : "없음";
                   const negKeywords = dashboardData.insight.neg_top_keywords 
                    ? dashboardData.insight.neg_top_keywords.split(/[|,]/).map(k => k.trim()).slice(0, 2).join(", ")
                     : "없음";
                   const avgRating = parseFloat(dashboardData.insight.avg_rating || dashboardData.insight.avgRating || 0);
                   
                   return `🔍 AI 자동 분석 요약
- 긍정 요인: ${posKeywords}
- 부정 요인: ${negKeywords}
- 평균 평점: ${avgRating.toFixed(1)}/5.0`;
                 })() :
                 dashboardData?.analysis ?
                 `🔍 AI 자동 분석 요약
- 긍정 요인: ${dashboardData.analysis.positiveKeywords?.slice(0, 3).map(k => typeof k === 'string' ? k : k.keyword_text || k.keyword || k).join(", ") || "없음"}
- 부정 요인: ${dashboardData.analysis.negativeKeywords?.slice(0, 2).map(k => typeof k === 'string' ? k : k.keyword_text || k.keyword || k).join(", ") || "없음"}
- 긍정 비율: ${Math.round(dashboardData.analysis.positiveRatio || 0)}%, 부정 비율: ${Math.round(dashboardData.analysis.negativeRatio || 0)}%
- 평균 평점: ${(dashboardData.analysis.avgRating || 0).toFixed(1)}/5.0` :
                 "인사이트 데이터가 없습니다."}
              </div>
            </div>
          </div>

          {/* PDF Download Button */}
          <div className="pt-4 pb-12 flex justify-center">
            <button
              ref={downloadBtnRef}
              onClick={handlePDFDownload}
              className="bg-main text-white px-8 py-3 rounded-xl font-bold text-lg hover-opacity-90 transition shadow-lg flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              📥 [ 리포트 PDF 다운로드 ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
