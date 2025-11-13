/**
 * 대시보드 API 응답 처리 유틸리티
 * API 응답 데이터를 컴포넌트에서 사용할 수 있는 형식으로 변환합니다.
 */

/**
 * JSON 문자열을 파싱하는 헬퍼 함수
 * @param {string|any} data - 파싱할 데이터
 * @param {any} defaultValue - 파싱 실패 시 기본값
 * @returns {any} 파싱된 데이터 또는 기본값
 */
const parseJSON = (data, defaultValue) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn("JSON 파싱 실패:", e);
      return defaultValue;
    }
  }
  return data || defaultValue;
};

/**
 * 배열 타입 검증 및 변환
 * @param {any} data - 검증할 데이터
 * @param {Array} defaultValue - 기본값
 * @returns {Array} 배열 데이터
 */
const ensureArray = (data, defaultValue = []) => {
  if (Array.isArray(data)) {
    return data;
  }
  if (typeof data === "string") {
    return parseJSON(data, defaultValue);
  }
  console.warn("배열이 아닙니다:", typeof data, data);
  return defaultValue;
};

/**
 * 객체 타입 검증 및 변환
 * @param {any} data - 검증할 데이터
 * @param {Object} defaultValue - 기본값
 * @returns {Object} 객체 데이터
 */
const ensureObject = (data, defaultValue = {}) => {
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    return data;
  }
  if (typeof data === "string") {
    return parseJSON(data, defaultValue);
  }
  console.warn("객체가 아닙니다:", typeof data, data);
  return defaultValue;
};

/**
 * 대시보드 API 응답 데이터 처리
 * @param {Object} params - 파라미터
 * @param {Object} params.responseData - API 응답 데이터
 * @param {Object} params.productInfo - 제품 정보 (선택사항)
 * @returns {Object} 처리된 대시보드 데이터
 */
export const processDashboardResponse = ({ responseData, productInfo = null }) => {
  if (!responseData) {
    console.error("❌ responseData가 없습니다:", responseData);
    return null;
  }

  try {
    // 새로운 응답 구조: { message, dashboard, date_sentimental, heatmap, keyword_summary, recent_reviews, insight, wordcloud }
    const dashboard = responseData?.dashboard || {};

    // 데이터가 없으면 에러 처리
    if (!dashboard || !dashboard.product_id) {
      console.error("❌ dashboard 데이터가 없거나 product_id가 없습니다:", dashboard);
      return null;
    }

    // JSON 컬럼이 문자열로 올 수 있으므로 파싱 시도
    let dateSentimental = ensureArray(
      responseData?.date_sentimental || dashboard?.date_sentimental,
      []
    );
    let heatmap = ensureObject(responseData?.heatmap || dashboard?.heatmap, {});
    let keywordSummary = ensureArray(
      responseData?.keyword_summary || dashboard?.keyword_summary,
      []
    );
    let recentReviews = ensureArray(responseData?.recent_reviews, []);

    // insight 객체 처리 (content 필드가 JSON 문자열일 수 있으므로 파싱)
    let insight = responseData?.insight || null;
    if (insight && insight.content) {
      // content가 JSON 문자열인 경우 파싱
      if (typeof insight.content === 'string') {
        try {
          insight = {
            ...insight,
            content: JSON.parse(insight.content)
          };
        } catch (e) {
          // JSON 파싱 실패 시 그대로 유지
          console.warn("⚠️ insight.content JSON 파싱 실패:", e);
        }
      }
    }
    // wordcloud는 API 응답의 최상위 레벨에서 직접 받아옴
    const wordcloud = responseData?.wordcloud || dashboard?.wordcloud || null;

    // sentiment_distribution도 JSON일 수 있음
    let sentimentDist = dashboard.sentiment_distribution || { positive: 0, negative: 0 };
    if (typeof sentimentDist === "string") {
      sentimentDist = parseJSON(sentimentDist, { positive: 0, negative: 0 });
    }
    if (typeof sentimentDist !== "object" || sentimentDist === null) {
      console.warn("⚠️ sentiment_distribution이 객체가 아닙니다:", typeof sentimentDist, sentimentDist);
      sentimentDist = { positive: 0, negative: 0 };
    }

    // 제품 정보 변환 (제품 정보는 별도로 가져온 것을 사용)
    const product = {
      product_id: dashboard.product_id,
      product_name: productInfo?.product_name || dashboard.product_name || "",
      brand: productInfo?.brand || dashboard.brand || "",
      category_name: productInfo?.category_name || dashboard.category_name || "",
      product_score: dashboard.product_score || "0",
      total_reviews: dashboard.total_reviews || 0,
      updated_at: dashboard.updated_at,
    };

    // 통계 데이터 변환
    const positiveRatio = sentimentDist.positive ? sentimentDist.positive * 100 : 0;
    const negativeRatio = sentimentDist.negative ? sentimentDist.negative * 100 : 0;
    const totalReviews = dashboard.total_reviews || 0;
    const positiveCount = Math.round(totalReviews * (sentimentDist.positive || 0));
    const negativeCount = Math.round(totalReviews * (sentimentDist.negative || 0));

    // date_sentimental을 dailyTrend로 변환
    const dailyTrend = Array.isArray(dateSentimental)
      ? dateSentimental.map((item) => ({
          date: item.week_start || item.date || "",
          week_start: item.week_start,
          week_end: item.week_end,
          reviewCount: item.review_count || 0,
          positive_ratio: item.positive ? item.positive * 100 : 0,
          negative_ratio: item.negative ? item.negative * 100 : 0,
          positiveRatio: item.positive ? item.positive * 100 : 0,
          negativeRatio: item.negative ? item.negative * 100 : 0,
          positiveCount: Math.round((item.review_count || 0) * (item.positive || 0)),
          negativeCount: Math.round((item.review_count || 0) * (item.negative || 0)),
        }))
      : [];

    // keyword_summary를 keywords로 변환
    const keywords = Array.isArray(keywordSummary)
      ? keywordSummary.map((kw) => {
          const posRatio = kw.positive_ratio || kw.positive || 0;
          const negRatio = kw.negative_ratio || kw.negative || 0;
          const total = kw.total_count || kw.count || 0;
          const posCount = Math.round(
            total * (typeof posRatio === "number" && posRatio <= 1 ? posRatio : posRatio / 100)
          );
          const negCount = Math.round(
            total * (typeof negRatio === "number" && negRatio <= 1 ? negRatio : negRatio / 100)
          );

          return {
            keyword_id: kw.keyword_id || null,
            keyword_text: kw.keyword_text || kw.keyword || kw.text || "",
            positive_count: posCount,
            negative_count: negCount,
            positiveCount: posCount,
            negativeCount: negCount,
            positive_ratio: typeof posRatio === "number" && posRatio <= 1 ? posRatio * 100 : posRatio,
            negative_ratio: typeof negRatio === "number" && negRatio <= 1 ? negRatio * 100 : negRatio,
            positiveRatio: typeof posRatio === "number" && posRatio <= 1 ? posRatio * 100 : posRatio,
            negativeRatio: typeof negRatio === "number" && negRatio <= 1 ? negRatio * 100 : negRatio,
          };
        })
      : [];

    // 리뷰 데이터 변환
    const reviews = Array.isArray(recentReviews)
      ? recentReviews.map((review) => ({
          ...review,
          rating: review.rating || parseFloat(dashboard.product_score) || 0,
          source: review.source || "Unknown",
          review_date: review.review_date || review.date || "",
        }))
      : [];

    // insight에서 키워드 추출 (기존 형식 유지)
    let positiveKeywords = [];
    let negativeKeywords = [];

    try {
      if (insight?.pos_top_keywords && typeof insight.pos_top_keywords === "string") {
        positiveKeywords = insight.pos_top_keywords.split(/[|,]/).map((k) => k.trim()).filter(Boolean);
      } else if (wordcloud?.positive_keywords && Array.isArray(wordcloud.positive_keywords)) {
        positiveKeywords = wordcloud.positive_keywords;
      }

      if (insight?.neg_top_keywords && typeof insight.neg_top_keywords === "string") {
        negativeKeywords = insight.neg_top_keywords.split(/[|,]/).map((k) => k.trim()).filter(Boolean);
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

    return combinedData;
  } catch (error) {
    console.error("❌ 대시보드 응답 처리 중 오류 발생:", {
      error,
      message: error.message,
      stack: error.stack,
      responseData,
    });
    return null;
  }
};

/**
 * 첫 번째 리뷰 날짜 찾기
 * @param {Object} params - 파라미터
 * @param {Array} params.dateSentimental - date_sentimental 데이터
 * @param {Array} params.dailyTrend - dailyTrend 데이터
 * @param {Array} params.reviews - reviews 데이터
 * @returns {Date|null} 첫 번째 리뷰 날짜 또는 null
 */
export const findFirstReviewDate = ({ dateSentimental = [], dailyTrend = [], reviews = [] }) => {
  let firstReviewDate = null;

  // 1. date_sentimental에서 첫 번째 날짜 찾기 (가장 정확한 데이터)
  if (dateSentimental && Array.isArray(dateSentimental) && dateSentimental.length > 0) {
    const validDates = dateSentimental
      .map((item) => item.week_start || item.date || item.month_start)
      .filter((date) => date)
      .map((date) => {
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : d;
      })
      .filter((d) => d !== null);

    if (validDates.length > 0) {
      firstReviewDate = new Date(Math.min(...validDates.map((d) => d.getTime())));
    }
  }

  // 2. dailyTrend에서 첫 번째 날짜 찾기 (date_sentimental이 없는 경우)
  if (!firstReviewDate && dailyTrend && dailyTrend.length > 0) {
    const validDates = dailyTrend
      .map((item) => item.date || item.week_start)
      .filter((date) => date)
      .map((date) => {
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : d;
      })
      .filter((d) => d !== null);

    if (validDates.length > 0) {
      firstReviewDate = new Date(Math.min(...validDates.map((d) => d.getTime())));
    }
  }

  // 3. reviews에서 첫 번째 날짜 찾기 (위 두 가지가 모두 없는 경우)
  if (!firstReviewDate && reviews && reviews.length > 0) {
    const validDates = reviews
      .map((review) => review.review_date)
      .filter((date) => date)
      .map((date) => {
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : d;
      })
      .filter((d) => d !== null);

    if (validDates.length > 0) {
      firstReviewDate = new Date(Math.min(...validDates.map((d) => d.getTime())));
    }
  }

  return firstReviewDate;
};

