/**
 * 대시보드 데이터 변환 함수들
 * dashboardResponseProcessor.js의 변환 로직을 분리
 */

/**
 * date_sentimental을 dailyTrend로 변환
 * @param {Array} dateSentimental - date_sentimental 데이터
 * @returns {Array} 변환된 dailyTrend 데이터
 */
export const transformDailyTrend = (dateSentimental = []) => {
  if (!Array.isArray(dateSentimental)) {
    return [];
  }

  return dateSentimental.map((item) => ({
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
  }));
};

/**
 * keyword_summary를 keywords로 변환
 * @param {Array} keywordSummary - keyword_summary 데이터
 * @returns {Array} 변환된 keywords 데이터
 */
export const transformKeywords = (keywordSummary = []) => {
  if (!Array.isArray(keywordSummary)) {
    return [];
  }

  return keywordSummary.map((kw) => {
    // positive_count와 negative_count가 직접 제공되면 사용
    const directPosCount = kw.positive_count || kw.positiveCount;
    const directNegCount = kw.negative_count || kw.negativeCount;
    
    // 비율 데이터
    const posRatio = kw.positive_ratio || kw.positive || 0;
    const negRatio = kw.negative_ratio || kw.negative || 0;
    const total = kw.total_count || kw.count || 0;
    
    // 카운트 계산: 직접 제공된 값이 있으면 사용, 없으면 total과 비율로 계산
    let posCount = 0;
    let negCount = 0;
    
    if (directPosCount !== undefined && directPosCount !== null) {
      posCount = Number(directPosCount);
    } else if (total > 0) {
      // 비율이 0-1 사이인지 0-100 사이인지 확인하여 정규화
      const normalizedPosRatio = typeof posRatio === "number" && posRatio <= 1 ? posRatio * 100 : posRatio;
      posCount = Math.round(total * (normalizedPosRatio / 100));
    }
    
    if (directNegCount !== undefined && directNegCount !== null) {
      negCount = Number(directNegCount);
    } else if (total > 0) {
      // 비율이 0-1 사이인지 0-100 사이인지 확인하여 정규화
      const normalizedNegRatio = typeof negRatio === "number" && negRatio <= 1 ? negRatio * 100 : negRatio;
      negCount = Math.round(total * (normalizedNegRatio / 100));
    }
    
    // 비율 정규화 (0-100 사이로)
    const normalizedPosRatio = typeof posRatio === "number" && posRatio <= 1 ? posRatio * 100 : (posRatio || 0);
    const normalizedNegRatio = typeof negRatio === "number" && negRatio <= 1 ? negRatio * 100 : (negRatio || 0);
    
    // total_mentions 계산
    const totalMentions = posCount + negCount || total;

    return {
      keyword_id: kw.keyword_id || null,
      keyword_text: kw.keyword_text || kw.keyword || kw.text || "",
      positive_count: posCount,
      negative_count: negCount,
      positiveCount: posCount,
      negativeCount: negCount,
      positive_ratio: normalizedPosRatio,
      negative_ratio: normalizedNegRatio,
      positiveRatio: normalizedPosRatio,
      negativeRatio: normalizedNegRatio,
      total_count: totalMentions,
      count: totalMentions,
    };
  });
};

/**
 * 리뷰 데이터 변환
 * @param {Array} recentReviews - recent_reviews 데이터
 * @param {number|string} productScore - 제품 점수
 * @returns {Array} 변환된 reviews 데이터
 */
export const transformReviews = (recentReviews = [], productScore = 0) => {
  if (!Array.isArray(recentReviews)) {
    return [];
  }

  return recentReviews.map((review) => ({
    ...review,
    rating: review.rating || parseFloat(productScore) || 0,
    source: review.source || "Unknown",
    review_date: review.review_date || review.date || "",
  }));
};

/**
 * 제품 정보 변환
 * @param {Object} dashboard - dashboard 데이터
 * @param {Object} productInfo - 제품 정보 (선택사항)
 * @returns {Object} 변환된 제품 정보
 */
export const transformProduct = (dashboard, productInfo = null) => {
  return {
    product_id: dashboard.product_id,
    product_name: productInfo?.product_name || dashboard.product_name || "",
    brand: productInfo?.brand || dashboard.brand || "",
    category_name: productInfo?.category_name || dashboard.category_name || "",
    product_score: dashboard.product_score || "0",
    total_reviews: dashboard.total_reviews || 0,
    updated_at: dashboard.updated_at,
  };
};

/**
 * 키워드 추출 (insight 또는 wordcloud에서)
 * @param {Object} insight - insight 데이터
 * @param {Object} wordcloud - wordcloud 데이터
 * @returns {Object} { positiveKeywords, negativeKeywords }
 */
export const extractKeywords = (insight = null, wordcloud = null) => {
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

  return { positiveKeywords, negativeKeywords };
};

