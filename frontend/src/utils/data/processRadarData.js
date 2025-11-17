/**
 * 레이더 차트 데이터 처리 함수
 * 키워드 데이터를 레이더 차트 형식으로 변환
 */

/**
 * 레이더 차트 데이터 처리
 * @param {Array} keywords - 키워드 데이터 배열
 * @returns {Object} { labels, positive, negative }
 */
export const processRadarData = (keywords = []) => {
  if (!keywords || keywords.length === 0) {
    return {
      labels: [],
      positive: [],
      negative: [],
    };
  }

  const keywordData = keywords.slice(0, 6);
  const labels = keywordData.map((kw) => kw.keyword_text || kw.keyword || kw.keyword_id || "").filter(Boolean);
  const positive = keywordData.map((kw) => parseFloat(kw.positive_ratio || kw.positiveRatio || 0));
  const negative = keywordData.map((kw) => parseFloat(kw.negative_ratio || kw.negativeRatio || 0));

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
};

