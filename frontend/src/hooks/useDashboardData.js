import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import dashboardService from "../services/dashboardService";
import { getTodayDate } from "../utils/dashboardDateFilter";
import { findFirstReviewDate } from "../services/dashboardResponseProcessor";

/**
 * 대시보드 데이터 페칭 커스텀 훅
 * AbortController를 사용한 중복 요청 방지 및 안전한 데이터 로딩
 */
export const useDashboardData = (productId) => {
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  const isFetchingRef = useRef(false);

  const [dashboardData, setDashboardData] = useState(null);
  const [originalDashboardData, setOriginalDashboardData] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");

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
        // 대시보드 데이터 가져오기
        const result = await dashboardService.getDashboardData(
          productId,
          abortController.signal,
          null
        );

        // 요청이 취소되었거나 컴포넌트가 언마운트된 경우 상태 업데이트 방지
        if (!isMounted || abortController.signal.aborted) {
          abortControllerRef.current = null;
          return;
        }

        if (!result || !result.success) {
          const errorMsg = result?.message || "데이터를 불러오는데 실패했습니다.";

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

        // API 응답이 이미 처리된 데이터
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
          // 대시보드 응답에서 제품 정보 추출
          if (combinedData.product) {
            setProductInfo(combinedData.product);
          }
          
          setOriginalDashboardData(combinedData);
          setDashboardData(combinedData);

          // 첫 번째 리뷰 날짜 찾기
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

        console.error("대시보드 데이터 로딩 오류:", {
          error,
          message: error.message,
          response: error.response,
          status: error.response?.status,
          data: error.response?.data,
        });

        if (isMounted && !abortController.signal.aborted) {
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

  return {
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
  };
};

