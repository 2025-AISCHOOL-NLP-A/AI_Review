import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import html2pdf from "html2pdf.js";
import Sidebar from "../../components/layout/sidebar/Sidebar";
import Footer from "../../components/layout/Footer/Footer";
import dashboardService from "../../services/dashboardService";
import api from "../../services/api";
import DailyTrendChart from "../../components/charts/DailyTrendChart";
import RadarChart from "../../components/charts/RadarChart";
import SplitBarChart from "../../components/charts/SplitBarChart";
import Heatmap from "../../components/charts/Heatmap";
import "../../styles/common.css";
import "./dashboard.css";
import "../../components/layout/sidebar/sidebar.css";

function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dashboardContentRef = useRef(null);
  const downloadBtnRef = useRef(null);
  const abortControllerRef = useRef(null); // AbortController를 ref로 관리

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [originalDashboardData, setOriginalDashboardData] = useState(null); // 원본 데이터 저장
  const [productInfo, setProductInfo] = useState(null); // 제품 정보 (이름, 브랜드 등)
  const [loading, setLoading] = useState(true);
  const [expandedReviews, setExpandedReviews] = useState(new Set());
  
  // Date filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState(""); // 적용된 시작 날짜
  const [appliedEndDate, setAppliedEndDate] = useState(""); // 적용된 종료 날짜
  
  // Chart period state (daily, weekly, monthly)
  const [chartPeriod, setChartPeriod] = useState("monthly"); // "monthly" only

  // Get productId from URL query parameter or use default
  const productId = useMemo(() => {
    const idFromUrl = searchParams.get("productId");
    return idFromUrl ? parseInt(idFromUrl, 10) : 1007; // 기본값 1007
  }, [searchParams]);


  // Fetch dashboard data
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
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
        return;
      }

      setLoading(true);

      try {
        // 제품 정보와 대시보드 데이터를 병렬로 가져오기
        const [productResult, result] = await Promise.all([
          dashboardService.getProduct(productId),
          dashboardService.getDashboardData(productId, abortController.signal)
        ]);

        // 제품 정보 추출
        const fetchedProductInfo = productResult.success && productResult.data?.data 
          ? productResult.data.data 
          : null;

        // 제품 정보 설정
        if (fetchedProductInfo && isMounted && !abortController.signal.aborted) {
          setProductInfo(fetchedProductInfo);
        }

        // 요청이 취소되었거나 컴포넌트가 언마운트된 경우 상태 업데이트 방지
        if (!isMounted || abortController.signal.aborted) {
          abortControllerRef.current = null;
          return;
        }

        if (!result.success) {
          const errorMsg = result.message || "데이터를 불러오는데 실패했습니다.";
          
          // 에러 로깅 (디버깅용)
          console.error("대시보드 데이터 조회 실패:", {
            success: result.success,
            message: result.message,
            status: result.status,
            result: result,
          });
          
          // 404 에러인 경우 워크플레이스로 이동 제안
          if (result.status === 404) {
            if (window.confirm(`${errorMsg}\n\n워크플레이스로 이동하시겠습니까?`)) {
              navigate("/wp");
            }
          } else {
            alert(`오류: ${errorMsg}\n\n상태 코드: ${result.status || 'N/A'}`);
          }
          
          if (isMounted && !abortController.signal.aborted) {
            setLoading(false);
          }
          abortControllerRef.current = null;
          return;
        }

        // 새로운 API 응답 구조 처리
        // result.data는 { message, dashboard, date_sentimental, heatmap, keyword_summary, recent_reviews, insight, wordcloud } 형태
        const responseData = result.data;
        
        // 응답 데이터 검증
        if (!responseData) {
          console.error("❌ responseData가 없습니다:", result);
          if (isMounted && !abortController.signal.aborted) {
            alert("대시보드 데이터를 불러오는데 실패했습니다.");
            setLoading(false);
          }
          abortControllerRef.current = null;
          return;
        }
        
        console.log("📊 응답 데이터 구조:", {
          hasDashboard: !!responseData.dashboard,
          hasDateSentimental: !!responseData.date_sentimental,
          hasKeywordSummary: !!responseData.keyword_summary,
          hasRecentReviews: !!responseData.recent_reviews,
          hasInsight: !!responseData.insight,
          responseDataKeys: Object.keys(responseData),
        });
        
        // 데이터 처리 중 에러 발생 시 정확한 위치 파악을 위한 try-catch
        try {
        
        // 새로운 응답 구조: { message, dashboard, date_sentimental, heatmap, keyword_summary, recent_reviews, insight, wordcloud }
        const dashboard = responseData?.dashboard || {};
        
        // JSON 컬럼이 문자열로 올 수 있으므로 파싱 시도
        let dateSentimental = responseData?.date_sentimental || dashboard?.date_sentimental || [];
        let heatmap = responseData?.heatmap || dashboard?.heatmap || {};
        let keywordSummary = responseData?.keyword_summary || dashboard?.keyword_summary || [];
        let recentReviews = responseData?.recent_reviews || [];
        const insight = responseData?.insight || null;
        // wordcloud는 API 응답의 최상위 레벨에서 직접 받아옴
        const wordcloud = responseData?.wordcloud || dashboard?.wordcloud || null;
        
        // 배열 타입 검증
        if (!Array.isArray(dateSentimental)) {
          console.warn("⚠️ dateSentimental가 배열이 아닙니다:", typeof dateSentimental, dateSentimental);
          dateSentimental = [];
        }
        if (!Array.isArray(keywordSummary)) {
          console.warn("⚠️ keywordSummary가 배열이 아닙니다:", typeof keywordSummary, keywordSummary);
          keywordSummary = [];
        }
        if (!Array.isArray(recentReviews)) {
          console.warn("⚠️ recentReviews가 배열이 아닙니다:", typeof recentReviews, recentReviews);
          recentReviews = [];
        }
        
        // JSON 문자열인 경우 파싱
        if (typeof dateSentimental === 'string') {
          try {
            dateSentimental = JSON.parse(dateSentimental);
          } catch (e) {
            dateSentimental = [];
          }
        }
        
        if (typeof heatmap === 'string') {
          try {
            heatmap = JSON.parse(heatmap);
          } catch (e) {
            heatmap = {};
          }
        }
        
        if (typeof keywordSummary === 'string') {
          try {
            keywordSummary = JSON.parse(keywordSummary);
          } catch (e) {
            keywordSummary = [];
          }
        }
        
        // sentiment_distribution도 JSON일 수 있음
        if (dashboard.sentiment_distribution && typeof dashboard.sentiment_distribution === 'string') {
          try {
            dashboard.sentiment_distribution = JSON.parse(dashboard.sentiment_distribution);
          } catch (e) {
            // 파싱 실패 시 기본값 유지
          }
        }

        // 데이터가 없으면 에러 처리
        if (!dashboard || !dashboard.product_id) {
          if (isMounted && !abortController.signal.aborted) {
            alert("대시보드 데이터를 불러오는데 실패했습니다.");
            setLoading(false);
          }
          abortControllerRef.current = null;
          return;
        }

        // 제품 정보 변환 (제품 정보는 별도로 가져온 것을 사용)
        const product = {
          product_id: dashboard.product_id,
          product_name: fetchedProductInfo?.product_name || dashboard.product_name || '',
          brand: fetchedProductInfo?.brand || dashboard.brand || '',
          category_name: fetchedProductInfo?.category_name || dashboard.category_name || '',
          product_score: dashboard.product_score || '0',
          total_reviews: dashboard.total_reviews || 0,
          updated_at: dashboard.updated_at,
        };

        // 통계 데이터 변환
        let sentimentDist = dashboard.sentiment_distribution || { positive: 0, negative: 0 };
        
        // sentiment_distribution이 문자열이거나 객체가 아닌 경우 처리
        if (typeof sentimentDist === 'string') {
          try {
            sentimentDist = JSON.parse(sentimentDist);
          } catch (e) {
            console.warn("⚠️ sentiment_distribution 파싱 실패:", e);
            sentimentDist = { positive: 0, negative: 0 };
          }
        }
        if (typeof sentimentDist !== 'object' || sentimentDist === null) {
          console.warn("⚠️ sentiment_distribution이 객체가 아닙니다:", typeof sentimentDist, sentimentDist);
          sentimentDist = { positive: 0, negative: 0 };
        }
        
        const positiveRatio = (sentimentDist.positive || 0) ? ((sentimentDist.positive || 0) * 100) : 0;
        const negativeRatio = (sentimentDist.negative || 0) ? ((sentimentDist.negative || 0) * 100) : 0;
        const totalReviews = dashboard.total_reviews || 0;
        const positiveCount = Math.round(totalReviews * (sentimentDist.positive || 0));
        const negativeCount = Math.round(totalReviews * (sentimentDist.negative || 0));

        // date_sentimental을 dailyTrend로 변환
        const dailyTrend = Array.isArray(dateSentimental) ? dateSentimental.map(item => ({
          date: item.week_start || item.date || '',
          week_start: item.week_start,
          week_end: item.week_end,
          reviewCount: item.review_count || 0,
          positive_ratio: item.positive ? (item.positive * 100) : 0,
          negative_ratio: item.negative ? (item.negative * 100) : 0,
          positiveRatio: item.positive ? (item.positive * 100) : 0,
          negativeRatio: item.negative ? (item.negative * 100) : 0,
          positiveCount: Math.round((item.review_count || 0) * (item.positive || 0)),
          negativeCount: Math.round((item.review_count || 0) * (item.negative || 0)),
        })) : [];

        // keyword_summary를 keywords로 변환
        const keywords = Array.isArray(keywordSummary) ? keywordSummary.map(kw => {
          const posRatio = kw.positive_ratio || kw.positive || 0;
          const negRatio = kw.negative_ratio || kw.negative || 0;
          const total = kw.total_count || kw.count || 0;
          const posCount = Math.round(total * (typeof posRatio === 'number' && posRatio <= 1 ? posRatio : posRatio / 100));
          const negCount = Math.round(total * (typeof negRatio === 'number' && negRatio <= 1 ? negRatio : negRatio / 100));
          
          return {
            keyword_id: kw.keyword_id || null,
            keyword_text: kw.keyword_text || kw.keyword || kw.text || '',
            positive_count: posCount,
            negative_count: negCount,
            positiveCount: posCount,
            negativeCount: negCount,
            positive_ratio: typeof posRatio === 'number' && posRatio <= 1 ? (posRatio * 100) : posRatio,
            negative_ratio: typeof negRatio === 'number' && negRatio <= 1 ? (negRatio * 100) : negRatio,
            positiveRatio: typeof posRatio === 'number' && posRatio <= 1 ? (posRatio * 100) : posRatio,
            negativeRatio: typeof negRatio === 'number' && negRatio <= 1 ? (negRatio * 100) : negRatio,
          };
        }) : [];

        // 리뷰 데이터 변환
        const reviews = Array.isArray(recentReviews) ? recentReviews.map(review => ({
          ...review,
          rating: review.rating || parseFloat(dashboard.product_score) || 0,
          source: review.source || 'Unknown',
          review_date: review.review_date || review.date || '',
        })) : [];

        // insight에서 키워드 추출 (기존 형식 유지)
        let positiveKeywords = [];
        let negativeKeywords = [];
        
        try {
          if (insight?.pos_top_keywords && typeof insight.pos_top_keywords === 'string') {
            positiveKeywords = insight.pos_top_keywords.split(/[|,]/).map(k => k.trim()).filter(Boolean);
          } else if (wordcloud?.positive_keywords && Array.isArray(wordcloud.positive_keywords)) {
            positiveKeywords = wordcloud.positive_keywords;
          }
          
          if (insight?.neg_top_keywords && typeof insight.neg_top_keywords === 'string') {
            negativeKeywords = insight.neg_top_keywords.split(/[|,]/).map(k => k.trim()).filter(Boolean);
          } else if (wordcloud?.negative_keywords && Array.isArray(wordcloud.negative_keywords)) {
            negativeKeywords = wordcloud.negative_keywords;
          }
        } catch (e) {
          console.warn("⚠️ 키워드 추출 중 오류:", e);
        }

        // 기존 데이터 구조에 맞게 변환
        const combinedData = {
          product: product,
          reviews: reviews,
          insights: [],
          dateSentimental: dateSentimental, // date_sentimental 데이터 저장
          dailyTrend: dailyTrend, // 변환된 dailyTrend도 저장
          analysis: {
            positiveRatio: Number(positiveRatio.toFixed(2)),
            negativeRatio: Number(negativeRatio.toFixed(2)),
            avgRating: parseFloat(dashboard.product_score) || 0,
            positiveKeywords: positiveKeywords,
            negativeKeywords: negativeKeywords,
          },
          stats: {
            totalReviews: totalReviews,
            positiveRatio: Number(positiveRatio.toFixed(2)),
            negativeRatio: Number(negativeRatio.toFixed(2)),
            positiveCount: positiveCount,
            negativeCount: negativeCount,
            avgRating: parseFloat(dashboard.product_score) || 0,
          },
          keywords: keywords,
          insight: insight,
          heatmap: heatmap,
          wordcloud: wordcloud,
        };

        if (isMounted && !abortController.signal.aborted) {
          setOriginalDashboardData(combinedData); // 원본 데이터 저장
          setDashboardData(combinedData);
          
          // 첫 번째 리뷰 날짜 찾기
          // 우선순위: date_sentimental > dailyTrend > reviews
          let firstReviewDate = null;
          
          // 1. date_sentimental에서 첫 번째 날짜 찾기 (가장 정확한 데이터)
          if (dateSentimental && Array.isArray(dateSentimental) && dateSentimental.length > 0) {
            const validDates = dateSentimental
              .map(item => item.week_start || item.date || item.month_start)
              .filter(date => date)
              .map(date => {
                const d = new Date(date);
                return isNaN(d.getTime()) ? null : d;
              })
              .filter(d => d !== null);
            
            if (validDates.length > 0) {
              firstReviewDate = new Date(Math.min(...validDates.map(d => d.getTime())));
            }
          }
          
          // 2. dailyTrend에서 첫 번째 날짜 찾기 (date_sentimental이 없는 경우)
          if (!firstReviewDate && dailyTrend && dailyTrend.length > 0) {
            const validDates = dailyTrend
              .map(item => item.date || item.week_start)
              .filter(date => date)
              .map(date => {
                const d = new Date(date);
                return isNaN(d.getTime()) ? null : d;
              })
              .filter(d => d !== null);
            
            if (validDates.length > 0) {
              firstReviewDate = new Date(Math.min(...validDates.map(d => d.getTime())));
            }
          }
          
          // 3. reviews에서 첫 번째 날짜 찾기 (위 두 가지가 모두 없는 경우)
          if (!firstReviewDate && reviews && reviews.length > 0) {
            const validDates = reviews
              .map(review => review.review_date)
              .filter(date => date)
              .map(date => {
                const d = new Date(date);
                return isNaN(d.getTime()) ? null : d;
              })
              .filter(d => d !== null);
            
            if (validDates.length > 0) {
              firstReviewDate = new Date(Math.min(...validDates.map(d => d.getTime())));
            }
          }
          
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
        } catch (dataProcessingError) {
          // 데이터 처리 중 발생한 에러
          console.error("❌ 데이터 처리 중 오류 발생:", {
            error: dataProcessingError,
            message: dataProcessingError.message,
            stack: dataProcessingError.stack,
            responseData: responseData,
          });
          
          if (isMounted && !abortController.signal.aborted) {
            alert(`데이터 처리 중 오류가 발생했습니다: ${dataProcessingError.message}`);
            setLoading(false);
          }
          abortControllerRef.current = null;
        }
      } catch (error) {
        // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
        if (error.name === 'AbortError' || error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || abortController.signal.aborted) {
          abortControllerRef.current = null;
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
      }
    };

    fetchData();

    // cleanup 함수: 컴포넌트 언마운트 시 또는 productId 변경 시 진행 중인 요청 취소
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [productId]);

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // 날짜 필터링 함수
  const applyDateFilter = () => {
    if (!originalDashboardData) return;

    let filteredData = { ...originalDashboardData };

    // 날짜 필터가 없으면 원본 데이터 반환
    if (!startDate && !endDate) {
      setDashboardData(originalDashboardData);
      return;
    }

    // 리뷰 필터링
    if (filteredData.reviews && filteredData.reviews.length > 0) {
      filteredData.reviews = filteredData.reviews.filter((review) => {
        if (!review.review_date) return false;
        
        const reviewDate = new Date(review.review_date);
        if (isNaN(reviewDate.getTime())) return false;
        
        const reviewDateStr = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, '0')}-${String(reviewDate.getDate()).padStart(2, '0')}`;
        
        if (startDate && endDate) {
          return reviewDateStr >= startDate && reviewDateStr <= endDate;
        } else if (startDate) {
          return reviewDateStr >= startDate;
        } else if (endDate) {
          return reviewDateStr <= endDate;
        }
        return true;
      });
    }

    // dailyTrend 재계산 (필터링된 리뷰 기반)
    const dailyTrendMap = new Map();
    filteredData.reviews.forEach(review => {
      if (review.review_date) {
        const date = new Date(review.review_date).toISOString().split('T')[0];
        if (!dailyTrendMap.has(date)) {
          dailyTrendMap.set(date, {
            date,
            reviewCount: 0,
            positiveCount: 0,
            negativeCount: 0,
          });
        }
        const dayData = dailyTrendMap.get(date);
        dayData.reviewCount += 1;
        if (review.rating >= 3.0) {
          dayData.positiveCount += 1;
        } else {
          dayData.negativeCount += 1;
        }
      }
    });

    filteredData.dailyTrend = Array.from(dailyTrendMap.values())
      .map(item => {
        const total = item.reviewCount || 1;
        const positiveRatio = (item.positiveCount / total) * 100;
        const negativeRatio = (item.negativeCount / total) * 100;
        return {
          date: item.date,
          reviewCount: item.reviewCount,
          positiveCount: item.positiveCount,
          negativeCount: item.negativeCount,
          positive_ratio: Number(positiveRatio.toFixed(2)),
          negative_ratio: Number(negativeRatio.toFixed(2)),
          positiveRatio: Number(positiveRatio.toFixed(2)),
          negativeRatio: Number(negativeRatio.toFixed(2)),
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // 통계 재계산
    const totalReviews = filteredData.reviews.length;
    const positiveCount = filteredData.reviews.filter(r => r.rating >= 3.0).length;
    const negativeCount = filteredData.reviews.filter(r => r.rating < 3.0).length;
    const positiveRatio = totalReviews > 0 ? (positiveCount / totalReviews) * 100 : 0;
    const negativeRatio = totalReviews > 0 ? (negativeCount / totalReviews) * 100 : 0;

    filteredData.stats = {
      ...filteredData.stats,
      totalReviews,
      positiveRatio: Number(positiveRatio.toFixed(2)),
      negativeRatio: Number(negativeRatio.toFixed(2)),
      positiveCount,
      negativeCount,
    };

    filteredData.analysis = {
      ...filteredData.analysis,
      positiveRatio: Number(positiveRatio.toFixed(2)),
      negativeRatio: Number(negativeRatio.toFixed(2)),
    };

    // 키워드 데이터 재계산 (필터링된 리뷰 기반)
    // 필터링된 리뷰의 review_id 추출
    const filteredReviewIds = new Set(filteredData.reviews.map(r => r.review_id).filter(Boolean));
    
    // 원본 데이터에서 키워드와 리뷰의 연결 정보가 있다면 재계산
    // 하지만 현재 구조에서는 키워드가 리뷰와 직접 연결되어 있지 않으므로,
    // 키워드 비율을 필터링된 리뷰 수에 맞춰 조정
    if (filteredData.keywords && originalDashboardData?.reviews) {
      const originalReviewCount = originalDashboardData.reviews.length;
      const filteredReviewCount = filteredData.reviews.length;
      
      // 키워드 비율을 필터링된 리뷰 수에 비례하여 조정
      // 실제로는 백엔드에서 날짜 필터를 받아서 재계산하는 것이 정확하지만,
      // 프론트엔드에서 근사치로 조정
      if (originalReviewCount > 0 && filteredReviewCount > 0) {
        const ratio = filteredReviewCount / originalReviewCount;
        filteredData.keywords = filteredData.keywords.map(kw => {
          const originalPosCount = kw.positive_count || kw.positiveCount || 0;
          const originalNegCount = kw.negative_count || kw.negativeCount || 0;
          const adjustedPosCount = Math.round(originalPosCount * ratio);
          const adjustedNegCount = Math.round(originalNegCount * ratio);
          const total = adjustedPosCount + adjustedNegCount;
          const positiveRatio = total > 0 ? (adjustedPosCount / total) * 100 : 0;
          const negativeRatio = total > 0 ? (adjustedNegCount / total) * 100 : 0;
          
          return {
            ...kw,
            positive_count: adjustedPosCount,
            negative_count: adjustedNegCount,
            positiveCount: adjustedPosCount,
            negativeCount: adjustedNegCount,
            positive_ratio: Number(positiveRatio.toFixed(2)),
            negative_ratio: Number(negativeRatio.toFixed(2)),
            positiveRatio: Number(positiveRatio.toFixed(2)),
            negativeRatio: Number(negativeRatio.toFixed(2)),
          };
        });
      } else {
        // 필터링된 리뷰가 없으면 키워드도 0으로 설정
        filteredData.keywords = filteredData.keywords.map(kw => ({
          ...kw,
          positive_count: 0,
          negative_count: 0,
          positiveCount: 0,
          negativeCount: 0,
          positive_ratio: 0,
          negative_ratio: 0,
          positiveRatio: 0,
          negativeRatio: 0,
        }));
      }
    }

    setDashboardData(filteredData);
  };

  // 날짜 변경 핸들러
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    if (endDate && newStartDate > endDate) {
      return;
    }
    setStartDate(newStartDate);
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    if (startDate && newEndDate < startDate) {
      return;
    }
    setEndDate(newEndDate);
  };

  // 필터 적용 핸들러
  const handleApplyFilter = () => {
    // 클라이언트 사이드 필터링
    applyDateFilter();
    // 적용된 날짜 저장
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  // 필터 초기화 핸들러
  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    if (originalDashboardData) {
      setDashboardData(originalDashboardData);
    }
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
  // date_sentimental 데이터를 직접 사용
  const dailyTrendData = useMemo(() => {
    // date_sentimental 데이터가 있으면 직접 사용
    if (dashboardData?.dateSentimental && Array.isArray(dashboardData.dateSentimental) && dashboardData.dateSentimental.length > 0) {
      const dateSentimental = dashboardData.dateSentimental;
      
      try {
        // date_sentimental 데이터를 차트 형식으로 변환 (월별만)
        // 각 항목: { week_start, week_end, date, review_count, positive, negative }
        
        // 월별: date 또는 week_start에서 월 추출
        // review_count가 0인 항목은 스킵
        const monthlyMap = new Map();
        
        const filteredData = dateSentimental.filter(item => (item.review_count || 0) > 0);
        
        filteredData.forEach(item => {
          // date, week_start, month_start 중 하나를 사용
          const dateStr = item.date || item.week_start || item.month_start || '';
          if (!dateStr) {
            return;
          }
          
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            return;
          }
          
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, {
              month: monthKey,
              reviewCount: 0,
              positiveSum: 0,
              negativeSum: 0,
              count: 0,
            });
          }
          
          const monthData = monthlyMap.get(monthKey);
          monthData.reviewCount += item.review_count || 0;
          monthData.positiveSum += (item.positive || 0) * (item.review_count || 0);
          monthData.negativeSum += (item.negative || 0) * (item.review_count || 0);
          monthData.count += 1;
        });
        
        // 오래된 데이터부터 표시하도록 오름차순 정렬
        const monthlyData = Array.from(monthlyMap.values())
          .filter(item => item.reviewCount > 0) // reviewCount가 0인 월 제외
          .sort((a, b) => a.month.localeCompare(b.month)) // 오름차순 정렬 (오래된 데이터 먼저)
          .map(item => {
            const total = item.reviewCount || 1;
            return {
              month: item.month,
              reviewCount: item.reviewCount,
              positive: (item.positiveSum / total) * 100,
              negative: (item.negativeSum / total) * 100,
            };
          });
        
        // 모든 항목에 년도 표시
        const result = {
          dates: monthlyData.map((item) => {
            const [year, month] = item.month.split('-');
            const monthNum = parseInt(month);
            const yearNum = parseInt(year);
            return `${yearNum}년 ${monthNum}월`;
          }),
          positive: monthlyData.map(item => Number(item.positive.toFixed(2))),
          negative: monthlyData.map(item => Number(item.negative.toFixed(2))),
          newReviews: monthlyData.map(item => item.reviewCount),
        };
        
        return result;
      } catch (error) {
        // 에러 발생 시 빈 데이터 반환
        return {
          dates: [],
          positive: [],
          negative: [],
          newReviews: [],
        };
      }
    }
    
    // date_sentimental이 없으면 기존 로직 사용 (reviews 기반)
    const startDate = appliedStartDate;
    const endDate = appliedEndDate;
    
    // 리뷰 데이터가 없으면 빈 데이터 반환
    if (!dashboardData?.reviews || dashboardData.reviews.length === 0) {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const allDates = [];
          const current = new Date(start);
          while (current <= end) {
            const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
            allDates.push(dateKey);
            current.setDate(current.getDate() + 1);
          }
          
          return {
            dates: allDates.map(dateKey => {
              const date = new Date(dateKey);
              if (isNaN(date.getTime())) return "-";
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }),
            positive: new Array(allDates.length).fill(0),
            negative: new Array(allDates.length).fill(0),
            newReviews: new Array(allDates.length).fill(0),
          };
        }
      }
      
      return {
        dates: [],
        positive: [],
        negative: [],
        newReviews: [],
      };
    }
    
    // 리뷰 데이터를 기반으로 날짜별 그룹화 (기존 로직)
    const dateMap = new Map();
    
    dashboardData.reviews.forEach(review => {
      if (!review.review_date) return;
      
      const reviewDate = new Date(review.review_date);
      if (isNaN(reviewDate.getTime())) return;
      
      const dateKey = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, '0')}-${String(reviewDate.getDate()).padStart(2, '0')}`;
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          reviewCount: 0,
          positiveCount: 0,
          negativeCount: 0,
        });
      }
      
      const dayData = dateMap.get(dateKey);
      dayData.reviewCount += 1;
      
      const rating = parseFloat(review.rating) || 0;
      if (rating >= 3.0) {
        dayData.positiveCount += 1;
      } else {
        dayData.negativeCount += 1;
      }
    });

    // 요청한 기간 전체 날짜 생성 (날짜가 항상 지정되어 있음)
    let allDates = [];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const current = new Date(start);
        while (current <= end) {
          const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
          allDates.push(dateKey);
          current.setDate(current.getDate() + 1);
        }
      }
    } else {
      // 기간이 없으면 리뷰 데이터가 있는 날짜만 사용
      allDates = Array.from(dateMap.keys()).sort();
    }
    
    // 날짜가 없으면 빈 데이터 반환
    if (allDates.length === 0) {
      // 날짜가 없어도 startDate와 endDate가 있으면 생성 시도
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const current = new Date(start);
          while (current <= end) {
            const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
            allDates.push(dateKey);
            current.setDate(current.getDate() + 1);
          }
        }
      }
      
      if (allDates.length === 0) {
        return {
          dates: [],
          positive: [],
          negative: [],
          newReviews: [],
        };
      }
    }

    // 모든 날짜에 대해 데이터 생성 (데이터가 없으면 0)
    const trendData = allDates.map(dateKey => {
      const dayData = dateMap.get(dateKey) || {
        date: dateKey,
        reviewCount: 0,
        positiveCount: 0,
        negativeCount: 0,
      };
      const total = dayData.reviewCount || 1;
      return {
        date: dateKey,
        reviewCount: dayData.reviewCount,
        positiveCount: dayData.positiveCount,
        negativeCount: dayData.negativeCount,
        positive_ratio: dayData.reviewCount > 0 ? (dayData.positiveCount / total) * 100 : 0,
        negative_ratio: dayData.reviewCount > 0 ? (dayData.negativeCount / total) * 100 : 0,
      };
    });

    // 월별만 처리
    // 월별: 월 기준으로 그룹화
    const monthlyMap = new Map();
    
    // 요청한 기간의 모든 월 생성
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const current = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        
        while (current <= endMonth) {
          const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
          monthlyMap.set(monthKey, {
            month: monthKey,
            reviewCount: 0,
            positiveCount: 0,
            negativeCount: 0,
          });
          
          current.setMonth(current.getMonth() + 1);
        }
      }
    }
    
    // trendData를 월 단위로 그룹화
    trendData.forEach(item => {
      if (!item.date) return;
      
      const date = new Date(item.date);
      if (isNaN(date.getTime())) return;
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          reviewCount: 0,
          positiveCount: 0,
          negativeCount: 0,
        });
      }
      
      const monthData = monthlyMap.get(monthKey);
      monthData.reviewCount += item.reviewCount || 0;
      monthData.positiveCount += item.positiveCount || 0;
      monthData.negativeCount += item.negativeCount || 0;
    });
    
    // 오래된 데이터부터 표시하도록 오름차순 정렬
    const monthlyData = Array.from(monthlyMap.values()).sort((a, b) => 
      a.month.localeCompare(b.month)
    );
    
    // 모든 항목에 년도 표시
    return {
      dates: monthlyData.map((item) => {
        if (!item.month) return "-";
        const [year, month] = item.month.split('-');
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        if (isNaN(monthNum)) return "-";
        return `${yearNum}년 ${monthNum}월`;
      }),
      positive: monthlyData.map(item => {
        const total = item.reviewCount || 1;
        return parseFloat(((item.positiveCount / total) * 100).toFixed(2));
      }),
      negative: monthlyData.map(item => {
        const total = item.reviewCount || 1;
        return parseFloat(((item.negativeCount / total) * 100).toFixed(2));
      }),
      newReviews: monthlyData.map(item => item.reviewCount || 0),
    };
  }, [dashboardData?.reviews, dashboardData?.dateSentimental, appliedStartDate, appliedEndDate]);

  // Process keyword data for charts using positive_ratio and negative_ratio from DB
  // Data comes from tb_productKeyword (product_id, keyword_id, positive_ratio DECIMAL(5,2), negative_ratio DECIMAL(5,2))
  // Joined with tb_keyword to get keyword_text for display (VARCHAR(50))
  // 날짜 필터와 무관하게 원본 데이터 사용 (RadarChart는 전체 기간 데이터 표시)
  const keywordsForRadar = originalDashboardData?.keywords || dashboardData?.keywords || [];
  const radarData = keywordsForRadar.length > 0 ? (() => {
    const keywordData = keywordsForRadar.slice(0, 6);
    const labels = keywordData.map(kw => kw.keyword_text || kw.keyword || kw.keyword_id || '').filter(Boolean);
    const positive = keywordData.map(kw => parseFloat(kw.positive_ratio || kw.positiveRatio || 0));
    const negative = keywordData.map(kw => parseFloat(kw.negative_ratio || kw.negativeRatio || 0));
    
    // 데이터가 유효할 때만 반환
    if (labels.length > 0) {
      return {
        labels,
        positive: positive.slice(0, labels.length),
        negative: negative.slice(0, labels.length),
      };
    }
    // 데이터가 없으면 빈 배열 반환
    return {
      labels: [],
      positive: [],
      negative: [],
    };
  })() : {
    // 데이터가 없을 때 빈 배열
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

  // 히트맵 데이터 처리
  // API 응답 구조: heatmap: { matrix: [[...]], keywords: [...] }
  const heatmapData = dashboardData?.heatmap || {};
  const heatmapMatrix = heatmapData.matrix || [];
  const heatmapKeywords = heatmapData.keywords || [];
  
  // keywords가 배열 형태로 오는 경우 (API에서 직접 제공)
  // 또는 keyword_summary에서 추출
  const correlationLabels = heatmapKeywords.length > 0 
    ? heatmapKeywords.slice(0, 6) // 최대 6개 키워드
    : (dashboardData?.keywords 
        ? [...new Set(dashboardData.keywords.map(kw => kw.keyword_text || kw.keyword || kw.keyword_id || '').filter(Boolean))].slice(0, 6)
        : []);
  
  // 2D 배열 형태의 matrix를 그대로 사용
  const correlationMatrix = Array.isArray(heatmapMatrix) ? heatmapMatrix : [];

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
                   (productInfo?.product_name || 
                    dashboardData?.product?.product_name || 
                    dashboardData?.product_name || 
                    (dashboardData === null ? "로딩 중..." : "상품 정보 없음"))}
                </span>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-3 text-sm">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="dashboard_start_date" className="text-gray-600 font-medium whitespace-nowrap">기간 필터:</label>
                    <input
                      id="dashboard_start_date"
                      name="start_date"
                      type="date"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
                      value={startDate}
                      onChange={handleStartDateChange}
                      max={endDate || getTodayDate()}
                    />
                    <span className="text-gray-500">~</span>
                    <input
                      id="dashboard_end_date"
                      name="end_date"
                      type="date"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
                      value={endDate}
                      onChange={handleEndDateChange}
                      min={startDate || undefined}
                      max={getTodayDate()}
                    />
                    {(startDate || endDate) && (
                      <button
                        onClick={handleResetFilter}
                        className="p-2 text-gray-500 hover:text-gray-700 transition"
                        title="필터 초기화"
                      >
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  {(appliedStartDate || appliedEndDate) && (
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <span className="font-medium">현재 적용:</span>
                      <span className="text-main font-semibold">
                        {appliedStartDate 
                          ? `${appliedStartDate.split('-')[0]}.${appliedStartDate.split('-')[1]}.${appliedStartDate.split('-')[2]}` 
                          : '전체'} ~ {appliedEndDate 
                          ? `${appliedEndDate.split('-')[0]}.${appliedEndDate.split('-')[1]}.${appliedEndDate.split('-')[2]}` 
                          : '전체'}
                      </span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleApplyFilter}
                  className="bg-main text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition shadow-md flex items-center"
                >
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
                  적용하기
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  📊 월별 긍·부정 포함 리뷰 비율
                </h2>
              </div>
              <DailyTrendChart data={dailyTrendData} loading={loading} />
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
              <RadarChart data={radarData} loading={loading} />
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
              <SplitBarChart data={splitBarRawData} loading={loading} />
            </div>

            <div className="card lg:col-span-1" id="heatmap-card">
              <h2 className="text-xl font-semibold mb-4">
                🔥 속성 상관관계 히트맵
              </h2>
              <Heatmap 
                labels={correlationLabels} 
                matrix={correlationMatrix} 
                loading={loading || !dashboardData?.heatmap || correlationLabels.length === 0 || correlationMatrix.length === 0}
              />
            </div>
          </div>

          {/* Word Cloud & Review Sample */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="wordcloud-review-section">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">
                🌈 감정 워드클라우드
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-gray-500">로딩 중...</span>
                </div>
              ) : dashboardData?.wordcloud ? (
                <div className="wordcloud-image-container">
                  <img 
                    src={(() => {
                      // URL 경로 정규화: 슬래시 중복 제거
                      const baseURL = api.defaults.baseURL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
                      const wordcloudPath = dashboardData.wordcloud;
                      // baseURL 끝의 슬래시와 wordcloudPath 시작의 슬래시 정리
                      const cleanBaseURL = baseURL.replace(/\/$/, '');
                      const cleanPath = wordcloudPath.startsWith('/') ? wordcloudPath : `/${wordcloudPath}`;
                      return `${cleanBaseURL}${cleanPath}`;
                    })()}
                    alt="워드클라우드"
                    className="wordcloud-image"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('워드클라우드 이미지 로드 실패:', {
                        src: e.target.src,
                        wordcloud: dashboardData.wordcloud,
                        baseURL: api.defaults.baseURL
                      });
                      const errorDiv = e.target.nextElementSibling;
                      if (errorDiv) {
                        e.target.style.display = 'none';
                        errorDiv.style.display = 'block';
                      }
                    }}
                    onLoad={(e) => {
                      console.log('워드클라우드 이미지 로드 성공:', {
                        src: e.target.src,
                        wordcloud: dashboardData.wordcloud
                      });
                    }}
                  />
                  <div style={{ display: 'none' }} className="text-center text-gray-500 py-8">
                    <p>워드클라우드 이미지를 불러올 수 없습니다.</p>
                    <p className="text-sm mt-2">경로: {dashboardData.wordcloud}</p>
                    <p className="text-xs mt-1">전체 URL: {(() => {
                      const baseURL = api.defaults.baseURL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
                      const cleanBaseURL = baseURL.replace(/\/$/, '');
                      const cleanPath = dashboardData.wordcloud.startsWith('/') ? dashboardData.wordcloud : `/${dashboardData.wordcloud}`;
                      return `${cleanBaseURL}${cleanPath}`;
                    })()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <span className="text-gray-500">워드클라우드 데이터가 없습니다.</span>
                </div>
              )}
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
                          const isLongText = reviewText.length > 100;
                          const displayText = isLongText && !isExpanded 
                            ? reviewText.substring(0, 100) + "..."
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
              <div className="text-sm text-gray-700">
                {loading ? (
                  <p>데이터 로딩 중...</p>
                ) : (() => {
                  // Parse pos_top_keywords from tb_productInsight (VARCHAR(255), comma-separated)
                  const posKeywords = dashboardData?.insight?.pos_top_keywords 
                    ? dashboardData.insight.pos_top_keywords.split(/[|,]/).map(k => k.trim()).filter(Boolean)
                    : dashboardData?.analysis?.positiveKeywords || [];
                  
                  // Parse neg_top_keywords from tb_productInsight (VARCHAR(255), comma-separated)
                  const negKeywords = dashboardData?.insight?.neg_top_keywords 
                    ? dashboardData.insight.neg_top_keywords.split(/[|,]/).map(k => k.trim()).filter(Boolean)
                    : dashboardData?.analysis?.negativeKeywords || [];
                  
                  return (
                    <div>
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-800 mb-2">긍정 키워드:</h4>
                        <div className="flex flex-wrap gap-2">
                          {posKeywords.length > 0 ? (
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
                          )}
                        </div>
                      </div>
                      <div className="border-t border-gray-100 my-4"></div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">부정 키워드:</h4>
                        <div className="flex flex-wrap gap-2">
                          {negKeywords.length > 0 ? (
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
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
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

          {/* ===================== FOOTER ===================== */}
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

