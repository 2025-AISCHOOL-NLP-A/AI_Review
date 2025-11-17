/**
 * 분기형 막대 그래프 데이터 처리 함수
 * 키워드 데이터를 분기형 막대 그래프 형식으로 변환
 */

/**
 * 분기형 막대 그래프 데이터 처리
 * @param {Array} keywords - 키워드 데이터 배열
 * @returns {Array} 분기형 막대 그래프 데이터 배열
 */
export const processSplitBarData = (keywords = []) => {
  if (!keywords || keywords.length === 0) {
    return [];
  }

  return keywords.slice(0, 5).map((kw) => ({
    label: kw.keyword_text || kw.keyword || kw.keyword_id || "",
    negRatio: parseFloat(kw.negative_ratio || kw.negativeRatio || 0),
    negCount: kw.negative_count || kw.negativeCount || 0,
    posRatio: parseFloat(kw.positive_ratio || kw.positiveRatio || 0),
    posCount: kw.positive_count || kw.positiveCount || 0,
  }));
};

