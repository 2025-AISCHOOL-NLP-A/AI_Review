import React from "react";

/**
 * 인사이트 섹션 컴포넌트
 * - 핵심 인사이트
 * - 개선 제안
 * - 리뷰 샘플 (키워드)
 */
const InsightsSection = ({ loading, dashboardData }) => {
  // Parse pos_top_keywords from tb_productInsight (VARCHAR(255), comma-separated)
  const posKeywords = dashboardData?.insight?.pos_top_keywords
    ? dashboardData.insight.pos_top_keywords
        .split(/[|,]/)
        .map((k) => k.trim())
        .filter(Boolean)
    : dashboardData?.analysis?.positiveKeywords || [];

  // Parse neg_top_keywords from tb_productInsight (VARCHAR(255), comma-separated)
  const negKeywords = dashboardData?.insight?.neg_top_keywords
    ? dashboardData.insight.neg_top_keywords
        .split(/[|,]/)
        .map((k) => k.trim())
        .filter(Boolean)
    : dashboardData?.analysis?.negativeKeywords || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="insights-section">
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">A. 핵심 인사이트</h2>
        <p className="whitespace-pre-wrap text-sm text-gray-700">
          {loading
            ? "데이터 로딩 중..."
            : dashboardData?.insight?.insight_summary
            ? dashboardData.insight.insight_summary
            : dashboardData?.analysis
            ? `👍 전체 긍정률 ${Math.round(dashboardData.analysis.positiveRatio || 0)}%${
                dashboardData.analysis.positiveKeywords?.length > 0
                  ? `, 주요 긍정 키워드: ${dashboardData.analysis.positiveKeywords
                      .slice(0, 3)
                      .map((k) =>
                        typeof k === "string"
                          ? k
                          : k.keyword_text || k.keyword || k
                      )
                      .join(", ") || "없음"}`
                  : ""
              }`
            : "인사이트 데이터가 없습니다."}
        </p>
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">B. 개선 제안</h2>
        <p className="whitespace-pre-wrap text-sm text-gray-700">
          {loading
            ? "데이터 로딩 중..."
            : dashboardData?.insight?.improvement_suggestion
            ? dashboardData.insight.improvement_suggestion
            : dashboardData?.analysis && dashboardData.analysis.negativeRatio > 0
            ? `⚙️ 부정 비율 ${Math.round(dashboardData.analysis.negativeRatio || 0)}%${
                dashboardData.analysis.negativeKeywords?.length > 0
                  ? `, 주요 부정 키워드: ${dashboardData.analysis.negativeKeywords
                      .slice(0, 2)
                      .map((k) =>
                        typeof k === "string"
                          ? k
                          : k.keyword_text || k.keyword || k
                      )
                      .join(", ") || "없음"}. 개선 필요`
                  : ""
              }`
            : dashboardData?.analysis
            ? "개선이 필요한 영역이 없습니다."
            : "인사이트 데이터가 없습니다."}
        </p>
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">C. 리뷰 샘플</h2>
        <div className="text-sm text-gray-700">
          {loading ? (
            <p>데이터 로딩 중...</p>
          ) : (
            <div>
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">긍정 키워드:</h4>
                <div className="flex flex-wrap gap-2">
                  {posKeywords.length > 0 ? (
                    posKeywords.slice(0, 6).map((keyword, idx) => {
                      const keywordText =
                        typeof keyword === "string"
                          ? keyword
                          : keyword.keyword_text || keyword.keyword || keyword;
                      return (
                        <span
                          key={idx}
                          className={`wordcloud-positive wordcloud-size-${idx} ${
                            idx === 0 ? "font-bold" : ""
                          }`}
                        >
                          {keywordText}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-500">긍정 키워드 데이터가 없습니다.</span>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-100 my-4"></div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">부정 키워드:</h4>
                <div className="flex flex-wrap gap-2">
                  {negKeywords.length > 0 ? (
                    negKeywords.slice(0, 5).map((keyword, idx) => {
                      const keywordText =
                        typeof keyword === "string"
                          ? keyword
                          : keyword.keyword_text || keyword.keyword || keyword;
                      return (
                        <span
                          key={idx}
                          className={`wordcloud-negative wordcloud-size-${idx} ${
                            idx === 0 ? "font-bold" : ""
                          }`}
                        >
                          {keywordText}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-500">부정 키워드 데이터가 없습니다.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsSection;

