/**
 * 대시보드 API 응답 처리 유틸리티
 * API 응답 데이터를 컴포넌트에서 사용할 수 있는 형식으로 변환합니다.
 */
import { parseJSON, ensureArray, ensureObject } from "../utils/dataParsing";
import {
  transformDailyTrend,
  transformKeywords,
  transformReviews,
  transformProduct,
  extractKeywords,
} from "./dashboardDataTransformers";

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
    let sentimentDist = ensureObject(
      dashboard.sentiment_distribution,
      { positive: 0, negative: 0 }
    );

    // 제품 정보 변환
    const product = transformProduct(dashboard, productInfo);

    // 통계 데이터 변환
    const positiveRatio = sentimentDist.positive ? sentimentDist.positive * 100 : 0;
    const negativeRatio = sentimentDist.negative ? sentimentDist.negative * 100 : 0;
    const totalReviews = dashboard.total_reviews || 0;
    const positiveCount = Math.round(totalReviews * (sentimentDist.positive || 0));
    const negativeCount = Math.round(totalReviews * (sentimentDist.negative || 0));

    // 데이터 변환 함수 사용
    const dailyTrend = transformDailyTrend(dateSentimental);
    const keywords = transformKeywords(keywordSummary);
    const reviews = transformReviews(recentReviews, dashboard.product_score);
    
    // 키워드 추출
    const { positiveKeywords, negativeKeywords } = extractKeywords(insight, wordcloud);

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

