/**
 * 일별 트렌드 데이터 처리 함수
 * date_sentimental 데이터를 차트 형식으로 변환
 */

/**
 * 일별 트렌드 데이터 처리
 * @param {Object} params - 파라미터
 * @param {Array} params.dateSentimental - date_sentimental 데이터
 * @param {Array} params.reviews - 리뷰 데이터
 * @param {string} params.appliedStartDate - 적용된 시작 날짜
 * @param {string} params.appliedEndDate - 적용된 종료 날짜
 * @returns {Object} { dates, positive, negative, newReviews }
 */
export const processDailyTrendData = ({
  dateSentimental = [],
  reviews = [],
  appliedStartDate = "",
  appliedEndDate = "",
}) => {
  // date_sentimental 데이터가 있으면 직접 사용
  if (dateSentimental && Array.isArray(dateSentimental) && dateSentimental.length > 0) {
    try {
      // date_sentimental 데이터를 차트 형식으로 변환 (월별만)
      // 각 항목: { week_start, week_end, date, review_count, positive, negative }

      // 월별: date 또는 week_start에서 월 추출
      // review_count가 0인 항목은 스킵
      const monthlyMap = new Map();

      const filteredData = dateSentimental.filter((item) => (item.review_count || 0) > 0);

      filteredData.forEach((item) => {
        // date, week_start, month_start 중 하나를 사용
        const dateStr = item.date || item.week_start || item.month_start || "";
        if (!dateStr) {
          return;
        }

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          return;
        }

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

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
        .filter((item) => item.reviewCount > 0) // reviewCount가 0인 월 제외
        .sort((a, b) => a.month.localeCompare(b.month)) // 오름차순 정렬 (오래된 데이터 먼저)
        .map((item) => {
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
          const [year, month] = item.month.split("-");
          const monthNum = parseInt(month);
          const yearNum = parseInt(year);
          return `${yearNum}년 ${monthNum}월`;
        }),
        positive: monthlyData.map((item) => Number(item.positive.toFixed(2))),
        negative: monthlyData.map((item) => Number(item.negative.toFixed(2))),
        newReviews: monthlyData.map((item) => item.reviewCount),
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
  if (!reviews || reviews.length === 0) {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const allDates = [];
        const current = new Date(start);
        while (current <= end) {
          const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
          allDates.push(dateKey);
          current.setDate(current.getDate() + 1);
        }

        return {
          dates: allDates.map((dateKey) => {
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

  reviews.forEach((review) => {
    if (!review.review_date) return;

    const reviewDate = new Date(review.review_date);
    if (isNaN(reviewDate.getTime())) return;

    const dateKey = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, "0")}-${String(reviewDate.getDate()).padStart(2, "0")}`;

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
        const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
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
          const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
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
  const trendData = allDates.map((dateKey) => {
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
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
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
  trendData.forEach((item) => {
    if (!item.date) return;

    const date = new Date(item.date);
    if (isNaN(date.getTime())) return;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

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
  const monthlyData = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  // 모든 항목에 년도 표시
  return {
    dates: monthlyData.map((item) => {
      if (!item.month) return "-";
      const [year, month] = item.month.split("-");
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      if (isNaN(monthNum)) return "-";
      return `${yearNum}년 ${monthNum}월`;
    }),
    positive: monthlyData.map((item) => {
      const total = item.reviewCount || 1;
      return parseFloat(((item.positiveCount / total) * 100).toFixed(2));
    }),
    negative: monthlyData.map((item) => {
      const total = item.reviewCount || 1;
      return parseFloat(((item.negativeCount / total) * 100).toFixed(2));
    }),
    newReviews: monthlyData.map((item) => item.reviewCount || 0),
  };
};

