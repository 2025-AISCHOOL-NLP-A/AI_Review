import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import dashboardService from "../services/dashboardService";
import { getTodayDate } from "../utils/data/dashboardDateFilter";
import { findFirstReviewDate } from "../services/dashboardResponseProcessor";

/**
 * ???? ??? ?? ??? ?
 * AbortController? ??? ?? ?? ?? ? ??? ??
 */
export const useDashboardData = (productId) => {
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const [dashboardData, setDashboardData] = useState(null);
  const [originalDashboardData, setOriginalDashboardData] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");

  const fetchDashboardData = useCallback(
    async ({ startDate: rangeStart = null, endDate: rangeEnd = null } = {}) => {
      // ?? ??? ?? ??? ?? ?? ??
      if (isFetchingRef.current) {
        return;
      }

      // ?? ??? ??? ??
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      if (!productId || isNaN(productId)) {
        alert("???? ?? ?? ID???.");
        setLoading(false);
        abortControllerRef.current = null;
        isFetchingRef.current = false;
        return;
      }

      isFetchingRef.current = true;
      setLoading(true);

      try {
        const result = await dashboardService.getDashboardData(
          productId,
          abortController.signal,
          null,
          rangeStart,
          rangeEnd
        );

        if (!isMountedRef.current || abortController.signal.aborted) {
            abortControllerRef.current = null;
            isFetchingRef.current = false;
            return;
        }

        if (!result || !result.success) {
          const errorMsg = result?.message || "???? ???? ???? ? ??????.";

          console.error("???? ??? ?? ??:", {
            success: result?.success,
            message: result?.message,
            status: result?.status,
            result: result,
          });

          if (result?.status === 404) {
            alert(`?? ??? ???? ???? ?? ???? ?????.\n\n??? ???? ??? ??? ? ?? ??????.`);
            navigate("/wp");
          } else {
            alert(`??: ${errorMsg}\n\n?? ??: ${result?.status || 'N/A'}`);
          }

          setLoading(false);
          abortControllerRef.current = null;
          isFetchingRef.current = false;
          return;
        }

        const combinedData = result.data;

        if (!combinedData) {
          console.error("?? ??? ???? ????:", result);
          alert("???? ???? ???? ? ??????.");
          setLoading(false);
          abortControllerRef.current = null;
          isFetchingRef.current = false;
          return;
        }

        if (combinedData.product) {
          setProductInfo(combinedData.product);
        }

        const totalReviews = combinedData.stats?.totalReviews || 0;
        const hasReviews = (combinedData.reviews && combinedData.reviews.length > 0) || totalReviews > 0;

        if (!hasReviews) {
          alert("?? ??? ???? ???? ?? ???? ?????.\n\n??? ???? ??? ??? ? ?? ??????.");
          navigate("/wp");
        }

        if (!rangeStart && !rangeEnd) {
          setOriginalDashboardData(combinedData);
        }
        setDashboardData(combinedData);

        if (!rangeStart && !rangeEnd) {
          const firstReviewDate = findFirstReviewDate({
            dateSentimental: combinedData.dateSentimental || [],
            dailyTrend: combinedData.dailyTrend || [],
            reviews: combinedData.reviews || [],
          });

          if (firstReviewDate) {
            const firstDateStr = `${firstReviewDate.getFullYear()}-${String(firstReviewDate.getMonth() + 1).padStart(2, '0')}-${String(firstReviewDate.getDate()).padStart(2, '0')}`;
            const todayStr = getTodayDate();
            setStartDate(firstDateStr);
            setEndDate(todayStr);
            setAppliedStartDate(firstDateStr);
            setAppliedEndDate(todayStr);
          }
        } else {
          setAppliedStartDate(rangeStart || "");
          setAppliedEndDate(rangeEnd || "");
          if (rangeStart) setStartDate(rangeStart);
          if (rangeEnd) setEndDate(rangeEnd);
        }

        setLoading(false);
        abortControllerRef.current = null;
        isFetchingRef.current = false;
      } catch (error) {
        if (error.name === 'AbortError' || error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || abortController.signal.aborted) {
          abortControllerRef.current = null;
          isFetchingRef.current = false;
          return;
        }

        console.error("???? ??? ?? ??:", {
          error,
          message: error.message,
          response: error.response,
          status: error.response?.status,
          data: error.response?.data,
        });

        const errorMessage = error.response?.data?.message
          || error.message
          || "???? ???? ???? ? ??????.";

        alert(`??: ${errorMessage}\n\n?? ??: ${error.response?.status || 'N/A'}`);
        setLoading(false);
        abortControllerRef.current = null;
        isFetchingRef.current = false;
      }
    },
    [productId, navigate]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchDashboardData();

    return () => {
      isMountedRef.current = false;
      isFetchingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchDashboardData]);

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
    fetchDashboardData,
  };
};
