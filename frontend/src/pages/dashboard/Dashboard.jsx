import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/layout/sidebar/Sidebar";
import Footer from "../../components/layout/Footer/Footer";
import dashboardService from "../../services/dashboardService";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import KPICards from "../../components/dashboard/KPICards";
import DashboardCharts from "../../components/dashboard/DashboardCharts";
import WordCloudSection from "../../components/dashboard/WordCloudSection";
import ReviewTable from "../../components/dashboard/ReviewTable";
import InsightsSection from "../../components/dashboard/InsightsSection";
import AIInsightReport from "../../components/dashboard/AIInsightReport";
import { usePDFDownload } from "../../hooks/usePDFDownload";
import { useSidebar } from "../../hooks/useSidebar";
import { useDashboardData } from "../../hooks/useDashboardData";
import {
  processDailyTrendData,
  processRadarData,
  processSplitBarData,
  processHeatmapData,
} from "../../utils/data";
import {
  getTodayDate,
  applyDateFilter,
} from "../../utils/dashboardDateFilter";
import "../../styles/common.css";
import "./dashboard.css";
import "../../components/layout/sidebar/sidebar.css";

function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dashboardContentRef = useRef(null);
  const downloadBtnRef = useRef(null);

  // 사이드바 상태 관리 (커스텀 훅 사용)
  const sidebarOpen = useSidebar();

  // Get productId from URL query parameter or use default
  const productId = useMemo(() => {
    const idFromUrl = searchParams.get("productId");
    return idFromUrl ? parseInt(idFromUrl, 10) : 1007; // 기본값 1007
  }, [searchParams]);

  // 대시보드 데이터 페칭 (커스텀 훅 사용)
  const {
    dashboardData,
    originalDashboardData,
    productInfo,
    loading,
    startDate,
    endDate,
    appliedStartDate,
    appliedEndDate,
    setDashboardData,
    setStartDate,
    setEndDate,
    setAppliedStartDate,
    setAppliedEndDate,
  } = useDashboardData(productId);

  // Chart period state (daily, weekly, monthly)
  const [chartPeriod, setChartPeriod] = useState("monthly"); // "monthly" only

  // 리뷰 확장/축소 상태
  const [expandedReviews, setExpandedReviews] = useState(() => new Set());

  // 날짜 필터링 핸들러 생성
  const handleStartDateChange = useCallback(
    (e) => {
      const newStartDate = e.target.value;
      if (endDate && newStartDate > endDate) {
        return;
      }
      setStartDate(newStartDate);
    },
    [endDate]
  );

  const handleEndDateChange = useCallback(
    (e) => {
      const newEndDate = e.target.value;
      if (startDate && newEndDate < startDate) {
        return;
      }
      setEndDate(newEndDate);
    },
    [startDate]
  );

  const handleApplyFilter = useCallback(
    () => {
      const filteredData = applyDateFilter({
        originalDashboardData,
        startDate,
        endDate,
      });

      if (filteredData) {
        setDashboardData(filteredData);
      }

      // 적용된 날짜 저장
      setAppliedStartDate(startDate);
      setAppliedEndDate(endDate);
    },
    [originalDashboardData, startDate, endDate]
  );

  const handleResetFilter = useCallback(
    () => {
      setStartDate("");
      setEndDate("");
      setAppliedStartDate("");
      setAppliedEndDate("");
      if (originalDashboardData) {
        setDashboardData(originalDashboardData);
      }
    },
    [originalDashboardData]
  );

  // 리뷰 확장/축소 핸들러
  const handleToggleExpand = (reviewId) => {
    setExpandedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  // 랜덤 리뷰 5개를 메모이제이션 (dashboardData.reviews가 변경될 때만 재생성)
  const randomReviews = useMemo(() => {
    if (!dashboardData?.reviews || dashboardData.reviews.length === 0) {
      return [];
    }
    // 리뷰 배열을 복사하여 랜덤으로 섞고 5개만 선택
    const shuffled = [...dashboardData.reviews].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, [dashboardData?.reviews]);

  // Process data for charts based on selected period
  // 그래프 데이터 처리 함수 사용
  const dailyTrendData = useMemo(() => {
    return processDailyTrendData({
      dateSentimental: dashboardData?.dateSentimental || [],
      reviews: dashboardData?.reviews || [],
      appliedStartDate,
      appliedEndDate,
    });
  }, [dashboardData?.reviews, dashboardData?.dateSentimental, appliedStartDate, appliedEndDate]);

  // Process keyword data for charts using positive_ratio and negative_ratio from DB
  // 날짜 필터와 무관하게 원본 데이터 사용 (RadarChart는 전체 기간 데이터 표시)
  const keywordsForRadar = originalDashboardData?.keywords || dashboardData?.keywords || [];
  const radarData = useMemo(() => {
    return processRadarData(keywordsForRadar);
  }, [keywordsForRadar]);

  // Split bar chart data from tb_productKeyword
  const splitBarRawData = useMemo(() => {
    return processSplitBarData(dashboardData?.keywords || []);
  }, [dashboardData?.keywords]);

  // 히트맵 데이터 처리
  const { labels: correlationLabels, matrix: correlationMatrix } = useMemo(() => {
    return processHeatmapData({
      heatmapData: dashboardData?.heatmap || {},
      keywords: dashboardData?.keywords || [],
    });
  }, [dashboardData?.heatmap, dashboardData?.keywords]);

  // PDF 다운로드 훅 사용
  const handlePDFDownload = usePDFDownload({
    contentRef: dashboardContentRef,
    downloadButtonRef: downloadBtnRef,
    productInfo,
    dashboardData,
  });


  return (
    <div className={`dashboard-page ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
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
          <DashboardHeader
            loading={loading}
            productInfo={productInfo}
            dashboardData={dashboardData}
            startDate={startDate}
            endDate={endDate}
            appliedStartDate={appliedStartDate}
            appliedEndDate={appliedEndDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onApplyFilter={handleApplyFilter}
            onResetFilter={handleResetFilter}
            getTodayDate={getTodayDate}
          />

          {/* 1. KPI Summary Cards */}
          <KPICards loading={loading} dashboardData={dashboardData} />

          {/* Main Chart Section & Detailed Analysis Section */}
          <DashboardCharts
            loading={loading}
            dashboardData={dashboardData}
            dailyTrendData={dailyTrendData}
            radarData={radarData}
            splitBarRawData={splitBarRawData}
            correlationLabels={correlationLabels}
            correlationMatrix={correlationMatrix}
          />

          {/* Word Cloud & Review Sample */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="wordcloud-review-section">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">
                🌈 감정 워드클라우드
              </h2>
              <WordCloudSection
                loading={loading}
                wordcloud={dashboardData?.wordcloud}
              />
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">💬 리뷰 원문 샘플</h2>
              <div className="review-table-container">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      <th className="px-3 py-3 text-left">날짜</th>
                      <th className="px-3 py-3 text-left">리뷰 내용</th>
                      <th className="px-3 py-3 text-left">감정 요약</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    <ReviewTable
                      loading={loading}
                      reviews={randomReviews}
                      expandedReviews={expandedReviews}
                      onToggleExpand={handleToggleExpand}
                    />
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Insights and AI Report Section */}
          <InsightsSection loading={loading} dashboardData={dashboardData} />

          {/* AI 인사이트 리포트 */}
          <AIInsightReport loading={loading} dashboardData={dashboardData} />

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

          {/* ===================== FOOTER ===================== */}
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

