/**
 * 히트맵 데이터 처리 함수
 * 히트맵 데이터를 차트 형식으로 변환
 */

/**
 * 히트맵 데이터 처리
 * @param {Object} params - 파라미터
 * @param {Object} params.heatmapData - 히트맵 데이터 객체
 * @param {Array} params.keywords - 키워드 데이터 배열 (히트맵 keywords가 없을 때 사용)
 * @returns {Object} { labels, matrix }
 */
export const processHeatmapData = ({ heatmapData = {}, keywords = [] }) => {
  // API 응답 구조: heatmap: { matrix: [[...]], keywords: [...] }
  const heatmapMatrix = heatmapData.matrix || [];
  const heatmapKeywords = heatmapData.keywords || [];

  // keywords가 배열 형태로 오는 경우 (API에서 직접 제공)
  // 또는 keyword_summary에서 추출
  // "/" 구분자가 포함된 경우를 처리하기 위해 문자열로 변환하여 확인
  const correlationLabels =
    heatmapKeywords.length > 0
      ? heatmapKeywords.slice(0, 6).map((kw) => {
          // 문자열로 변환하여 "/"가 포함되어 있는지 확인
          const kwStr = String(kw || "").trim();
          // "/"가 포함되어 있으면 그대로 반환 (Heatmap 컴포넌트에서 처리)
          return kwStr;
        })
      : keywords && keywords.length > 0
      ? [
          ...new Set(
            keywords
              .map((kw) => {
                const kwText = String(kw.keyword_text || kw.keyword || kw.keyword_id || "").trim();
                return kwText;
              })
              .filter(Boolean)
          ),
        ].slice(0, 6)
      : [];

  // 2D 배열 형태의 matrix를 그대로 사용
  const correlationMatrix = Array.isArray(heatmapMatrix) ? heatmapMatrix : [];

  return {
    labels: correlationLabels,
    matrix: correlationMatrix,
  };
};

