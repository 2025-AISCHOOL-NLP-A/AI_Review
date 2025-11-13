import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/layout/sidebar/Sidebar";
import Footer from "../../components/layout/Footer/Footer";
import dashboardService from "../../services/dashboardService";
import DashboardHeader from "../../components/render/DashboardHeader";
import KPICards from "../../components/render/KPICards";
import DashboardCharts from "../../components/render/DashboardCharts";
import WordCloudSection from "../../components/render/WordCloudSection";
import ReviewTable from "../../components/render/ReviewTable";
import InsightsSection from "../../components/render/InsightsSection";
import AIInsightReport from "../../components/render/AIInsightReport";
import { usePDFDownload } from "../../hooks/usePDFDownload";
import {
  processDailyTrendData,
  processRadarData,
  processSplitBarData,
  processHeatmapData,
} from "../../graphs";
import {
  getTodayDate,
  applyDateFilter,
} from "../../utils/dashboardDateFilter";
import { findFirstReviewDate } from "../../services/dashboardResponseProcessor";
import "../../styles/common.css";
import "./dashboard.css";
import "../../components/layout/sidebar/sidebar.css";

function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dashboardContentRef = useRef(null);
  const downloadBtnRef = useRef(null);
  const abortControllerRef = useRef(null); // AbortController를 ref로 관리
  const isFetchingRef = useRef(false); // 중복 요청 방지 플래그

  // 사이드바 상태 확인 (localStorage에서 읽어오기)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? saved === "true" : true;
  });

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [originalDashboardData, setOriginalDashboardData] = useState(null); // 원본 데이터 저장
  const [productInfo, setProductInfo] = useState(null); // 제품 정보 (이름, 브랜드 등)
  const [loading, setLoading] = useState(true);
  
  // Date filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState(""); // 적용된 시작 날짜
  const [appliedEndDate, setAppliedEndDate] = useState(""); // 적용된 종료 날짜
  
  // Chart period state (daily, weekly, monthly)
  const [chartPeriod, setChartPeriod] = useState("monthly"); // "monthly" only

  // 리뷰 확장/축소 상태
  const [expandedReviews, setExpandedReviews] = useState(() => new Set());

  // Get productId from URL query parameter or use default
  const productId = useMemo(() => {
    const idFromUrl = searchParams.get("productId");
    return idFromUrl ? parseInt(idFromUrl, 10) : 1007; // 기본값 1007
  }, [searchParams]);

  // 사이드바 상태 변경 감지 (커스텀 이벤트 리스너)
  useEffect(() => {
    const handleSidebarStateChange = (event) => {
      if (event.detail && typeof event.detail.sidebarOpen === 'boolean') {
        setSidebarOpen(event.detail.sidebarOpen);
      } else {
        // 이벤트에 detail이 없는 경우 localStorage에서 직접 확인
        const saved = localStorage.getItem("sidebarOpen");
        setSidebarOpen(saved !== null ? saved === "true" : true);
      }
    };

    // storage 이벤트 리스너 등록 (다른 탭에서 변경된 경우)
    const handleStorageChange = () => {
      const saved = localStorage.getItem("sidebarOpen");
      setSidebarOpen(saved !== null ? saved === "true" : true);
    };

    // 초기 상태 확인
    const saved = localStorage.getItem("sidebarOpen");
    setSidebarOpen(saved !== null ? saved === "true" : true);

    // 커스텀 이벤트 리스너 등록 (같은 탭에서 변경된 경우)
    window.addEventListener("sidebarStateChanged", handleSidebarStateChange);
    // storage 이벤트 리스너 등록 (다른 탭에서 변경된 경우)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("sidebarStateChanged", handleSidebarStateChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);


  // Fetch dashboard data
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      // 이미 요청이 진행 중이면 중복 요청 방지
      if (isFetchingRef.current) {
        return;
      }

      // 이전 요청이 있으면 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 새로운 AbortController 생성
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // productId 유효성 검사
      if (!productId || isNaN(productId)) {
        if (isMounted && !abortController.signal.aborted) {
          alert("유효하지 않은 제품 ID입니다.");
          setLoading(false);
        }
        abortControllerRef.current = null;
        isFetchingRef.current = false;
        return;
      }

      isFetchingRef.current = true;
      setLoading(true);

      try {
        // 제품 정보와 대시보드 데이터를 병렬로 요청 (AbortSignal 전달)
        const [productResult, dashboardResult] = await Promise.all([
          dashboardService.getProduct(productId, abortController.signal).catch(err => {
            // AbortError는 무시하고 null 반환
            if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
              return null;
            }
            throw err;
          }),
          dashboardService.getDashboardData(
            productId, 
            abortController.signal, 
            null // 제품 정보는 나중에 설정
          )
        ]);

        // 요청이 취소되었거나 컴포넌트가 언마운트된 경우 상태 업데이트 방지
        if (!isMounted || abortController.signal.aborted) {
          abortControllerRef.current = null;
          isFetchingRef.current = false;
          return;
        }

        // 제품 정보 추출 및 설정
        const fetchedProductInfo = productResult?.success && productResult.data?.data 
          ? productResult.data.data 
          : null;

        if (fetchedProductInfo) {
          setProductInfo(fetchedProductInfo);
        }

        // 대시보드 데이터 처리
        const result = dashboardResult;

        // 요청이 취소되었거나 컴포넌트가 언마운트된 경우 상태 업데이트 방지
        if (!isMounted || abortController.signal.aborted) {
          abortControllerRef.current = null;
          return;
        }

        if (!result || !result.success) {
          const errorMsg = result?.message || "데이터를 불러오는데 실패했습니다.";
          
          // 에러 로깅 (디버깅용)
          console.error("대시보드 데이터 조회 실패:", {
            success: result?.success,
            message: result?.message,
            status: result?.status,
            result: result,
          });
          
          // 404 에러인 경우 워크플레이스로 이동 제안
          if (result?.status === 404) {
            if (window.confirm(`${errorMsg}\n\n워크플레이스로 이동하시겠습니까?`)) {
              navigate("/wp");
            }
          } else {
            alert(`오류: ${errorMsg}\n\n상태 코드: ${result?.status || 'N/A'}`);
          }
          
          if (isMounted && !abortController.signal.aborted) {
            setLoading(false);
          }
          abortControllerRef.current = null;
          isFetchingRef.current = false;
          return;
        }

        // API 응답이 이미 처리된 데이터 (processDashboardResponse를 통해 처리됨)
        const combinedData = result.data;

        if (!combinedData) {
          console.error("❌ 처리된 데이터가 없습니다:", result);
          if (isMounted && !abortController.signal.aborted) {
            alert("대시보드 데이터를 불러오는데 실패했습니다.");
            setLoading(false);
          }
          abortControllerRef.current = null;
          isFetchingRef.current = false;
          return;
        }

        if (isMounted && !abortController.signal.aborted) {
          setOriginalDashboardData(combinedData); // 원본 데이터 저장
          setDashboardData(combinedData);
          
          // 첫 번째 리뷰 날짜 찾기 (서비스 함수 사용)
          const firstReviewDate = findFirstReviewDate({
            dateSentimental: combinedData.dateSentimental || [],
            dailyTrend: combinedData.dailyTrend || [],
            reviews: combinedData.reviews || [],
          });
          
          // 날짜 범위 자동 설정
          if (firstReviewDate) {
            const firstDateStr = `${firstReviewDate.getFullYear()}-${String(firstReviewDate.getMonth() + 1).padStart(2, '0')}-${String(firstReviewDate.getDate()).padStart(2, '0')}`;
            const todayStr = getTodayDate();
            setStartDate(firstDateStr);
            setEndDate(todayStr);
            // 자동 설정된 날짜도 적용된 날짜로 저장
            setAppliedStartDate(firstDateStr);
            setAppliedEndDate(todayStr);
          }
          
          setLoading(false);
        }
        abortControllerRef.current = null;
        isFetchingRef.current = false;
      } catch (error) {
        // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
        if (error.name === 'AbortError' || error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || abortController.signal.aborted) {
          abortControllerRef.current = null;
          isFetchingRef.current = false;
          return;
        }
        
        // 에러 로깅 (디버깅용)
        console.error("대시보드 데이터 로딩 오류:", {
          error,
          message: error.message,
          response: error.response,
          status: error.response?.status,
          data: error.response?.data,
        });
        
        if (isMounted && !abortController.signal.aborted) {
          // 서버에서 반환한 메시지가 있으면 사용, 없으면 기본 메시지
          const errorMessage = error.response?.data?.message 
            || error.message 
            || "대시보드 데이터를 불러오는데 실패했습니다.";
          
          alert(`오류: ${errorMessage}\n\n상태 코드: ${error.response?.status || 'N/A'}`);
          setLoading(false);
        }
        abortControllerRef.current = null;
        isFetchingRef.current = false;
      }
    };

    fetchData();

    // cleanup 함수: 컴포넌트 언마운트 시 또는 productId 변경 시 진행 중인 요청 취소
    return () => {
      isMounted = false;
      isFetchingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [productId, navigate]);

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

