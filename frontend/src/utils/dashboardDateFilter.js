/**
 * 대시보드 날짜 필터링 유틸리티 함수
 * 날짜 필터링 관련 로직을 담당합니다.
 */

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
 * @returns {string} YYYY-MM-DD 형식의 오늘 날짜
 */
export const getTodayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

/**
 * 날짜 필터링 함수
 * 원본 데이터를 기반으로 날짜 범위에 따라 필터링된 데이터를 반환합니다.
 * @param {Object} params - 파라미터
 * @param {Object} params.originalDashboardData - 원본 대시보드 데이터
 * @param {string} params.startDate - 시작 날짜 (YYYY-MM-DD)
 * @param {string} params.endDate - 종료 날짜 (YYYY-MM-DD)
 * @returns {Object|null} 필터링된 대시보드 데이터 또는 null
 */
export const applyDateFilter = ({ originalDashboardData, startDate, endDate }) => {
  if (!originalDashboardData) return null;

  let filteredData = { ...originalDashboardData };

  // 날짜 필터가 없으면 원본 데이터 반환
  if (!startDate && !endDate) {
    return filteredData;
  }

  // 리뷰 필터링
  if (filteredData.reviews && filteredData.reviews.length > 0) {
    filteredData.reviews = filteredData.reviews.filter((review) => {
      if (!review.review_date) return false;

      const reviewDate = new Date(review.review_date);
      if (isNaN(reviewDate.getTime())) return false;

      const reviewDateStr = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, "0")}-${String(reviewDate.getDate()).padStart(2, "0")}`;

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
  filteredData.reviews.forEach((review) => {
    if (review.review_date) {
      const date = new Date(review.review_date).toISOString().split("T")[0];
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
    .map((item) => {
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
  const positiveCount = filteredData.reviews.filter((r) => r.rating >= 3.0).length;
  const negativeCount = filteredData.reviews.filter((r) => r.rating < 3.0).length;
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
  const filteredReviewIds = new Set(filteredData.reviews.map((r) => r.review_id).filter(Boolean));

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
      filteredData.keywords = filteredData.keywords.map((kw) => {
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
      filteredData.keywords = filteredData.keywords.map((kw) => ({
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

  return filteredData;
};

/**
 * 시작 날짜 변경 핸들러 생성
 * @param {Function} setStartDate - 시작 날짜 설정 함수
 * @param {string} endDate - 종료 날짜
 * @returns {Function} 시작 날짜 변경 핸들러
 */
export const createHandleStartDateChange = (setStartDate, endDate) => {
  return (e) => {
    const newStartDate = e.target.value;
    if (endDate && newStartDate > endDate) {
      return;
    }
    setStartDate(newStartDate);
  };
};

/**
 * 종료 날짜 변경 핸들러 생성
 * @param {Function} setEndDate - 종료 날짜 설정 함수
 * @param {string} startDate - 시작 날짜
 * @returns {Function} 종료 날짜 변경 핸들러
 */
export const createHandleEndDateChange = (setEndDate, startDate) => {
  return (e) => {
    const newEndDate = e.target.value;
    if (startDate && newEndDate < startDate) {
      return;
    }
    setEndDate(newEndDate);
  };
};

/**
 * 필터 적용 핸들러 생성
 * @param {Object} params - 파라미터
 * @param {Function} params.applyDateFilter - 날짜 필터링 함수
 * @param {Function} params.setDashboardData - 대시보드 데이터 설정 함수
 * @param {Function} params.setAppliedStartDate - 적용된 시작 날짜 설정 함수
 * @param {Function} params.setAppliedEndDate - 적용된 종료 날짜 설정 함수
 * @param {Object} params.originalDashboardData - 원본 대시보드 데이터
 * @param {string} params.startDate - 시작 날짜
 * @param {string} params.endDate - 종료 날짜
 * @returns {Function} 필터 적용 핸들러
 */
export const createHandleApplyFilter = ({
  setDashboardData,
  setAppliedStartDate,
  setAppliedEndDate,
  originalDashboardData,
  startDate,
  endDate,
}) => {
  return () => {
    // 클라이언트 사이드 필터링
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
  };
};

/**
 * 필터 초기화 핸들러 생성
 * @param {Object} params - 파라미터
 * @param {Function} params.setStartDate - 시작 날짜 설정 함수
 * @param {Function} params.setEndDate - 종료 날짜 설정 함수
 * @param {Function} params.setAppliedStartDate - 적용된 시작 날짜 설정 함수
 * @param {Function} params.setAppliedEndDate - 적용된 종료 날짜 설정 함수
 * @param {Function} params.setDashboardData - 대시보드 데이터 설정 함수
 * @param {Object} params.originalDashboardData - 원본 대시보드 데이터
 * @returns {Function} 필터 초기화 핸들러
 */
export const createHandleResetFilter = ({
  setStartDate,
  setEndDate,
  setAppliedStartDate,
  setAppliedEndDate,
  setDashboardData,
  originalDashboardData,
}) => {
  return () => {
    setStartDate("");
    setEndDate("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    if (originalDashboardData) {
      setDashboardData(originalDashboardData);
    }
  };
};

