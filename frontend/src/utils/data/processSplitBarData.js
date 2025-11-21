/**
 * 분기형 막대 그래프 데이터 처리 함수
 * 키워드 데이터를 분기형 막대 그래프 형식으로 변환
 * SplitBarChart.jsx가 기대하는 형식에 맞춤
 */

/**
 * 분기형 막대 그래프 데이터 처리
 * @param {Array} keywords - 키워드 데이터 배열
 * @returns {Array} 분기형 막대 그래프 데이터 배열
 * 
 * 반환 형식:
 * {
 *   keyword: string,
 *   negative_count: number,
 *   positive_count: number,
 *   negative_ratio: number,
 *   positive_ratio: number,
 *   total_mentions: number
 * }
 */
export const processSplitBarData = (keywords = []) => {
  if (!keywords || keywords.length === 0) {
    return [];
  }

  return keywords.slice(0, 6).map((kw) => {
    const keyword = kw.keyword_text || kw.keyword || kw.keyword_id || "";
    const negativeCount = Number(kw.negative_count || kw.negativeCount || 0);
    const positiveCount = Number(kw.positive_count || kw.positiveCount || 0);
    const totalMentions = negativeCount + positiveCount;

    // 비율 계산 (SplitBarChart.jsx는 0~1 사이의 값을 기대함)
    // transformKeywords에서 0-100으로 정규화된 값을 받을 수 있으므로 0-1로 변환
    let negativeRatio = 0;
    let positiveRatio = 0;

    if (totalMentions > 0) {
      // 이미 비율이 있는 경우 사용, 없으면 계산
      const rawNegRatio = kw.negative_ratio || kw.negativeRatio;
      const rawPosRatio = kw.positive_ratio || kw.positiveRatio;

      if (rawNegRatio !== undefined && rawNegRatio !== null) {
        // 0-100 사이 값이면 0-1로 변환, 이미 0-1이면 그대로 사용
        negativeRatio = rawNegRatio > 1 ? rawNegRatio / 100 : parseFloat(rawNegRatio);
      } else {
        negativeRatio = negativeCount / totalMentions;
      }

      if (rawPosRatio !== undefined && rawPosRatio !== null) {
        // 0-100 사이 값이면 0-1로 변환, 이미 0-1이면 그대로 사용
        positiveRatio = rawPosRatio > 1 ? rawPosRatio / 100 : parseFloat(rawPosRatio);
      } else {
        positiveRatio = positiveCount / totalMentions;
      }
    }

    return {
      keyword: keyword,
      negative_count: negativeCount,
      positive_count: positiveCount,
      negative_ratio: negativeRatio,
      positive_ratio: positiveRatio,
      total_mentions: totalMentions,
    };
  });
};

