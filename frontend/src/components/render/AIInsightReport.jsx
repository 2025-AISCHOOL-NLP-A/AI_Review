import React from "react";

/**
 * AI 인사이트 리포트 컴포넌트
 */
const AIInsightReport = ({ loading, dashboardData }) => {
  const getReportContent = () => {
    if (loading) {
      return "데이터 로딩 중...";
    }

    if (dashboardData?.insight) {
      // Data from tb_productInsight
      const posKeywords = dashboardData.insight.pos_top_keywords
        ? dashboardData.insight.pos_top_keywords
            .split(/[|,]/)
            .map((k) => k.trim())
            .slice(0, 3)
            .join(", ")
        : "없음";
      const negKeywords = dashboardData.insight.neg_top_keywords
        ? dashboardData.insight.neg_top_keywords
            .split(/[|,]/)
            .map((k) => k.trim())
            .slice(0, 2)
            .join(", ")
        : "없음";
      const avgRating = parseFloat(
        dashboardData.insight.avg_rating ||
          dashboardData.insight.avgRating ||
          0
      );

      return `🔍 AI 자동 분석 요약
- 긍정 요인: ${posKeywords}
- 부정 요인: ${negKeywords}
- 평균 평점: ${avgRating.toFixed(1)}/5.0`;
    }

    if (dashboardData?.analysis) {
      return `🔍 AI 자동 분석 요약
- 긍정 요인: ${dashboardData.analysis.positiveKeywords
        ?.slice(0, 3)
        .map((k) =>
          typeof k === "string" ? k : k.keyword_text || k.keyword || k
        )
        .join(", ") || "없음"}
- 부정 요인: ${dashboardData.analysis.negativeKeywords
        ?.slice(0, 2)
        .map((k) =>
          typeof k === "string" ? k : k.keyword_text || k.keyword || k
        )
        .join(", ") || "없음"}
- 긍정 비율: ${Math.round(dashboardData.analysis.positiveRatio || 0)}%, 부정 비율: ${Math.round(
        dashboardData.analysis.negativeRatio || 0
      )}%
- 평균 평점: ${(dashboardData.analysis.avgRating || 0).toFixed(1)}/5.0`;
    }

    return "인사이트 데이터가 없습니다.";
  };

  return (
    <div className="grid grid-cols-1 gap-6" id="ai-insight-report-section">
      <div className="card w-full">
        <h2 className="text-xl font-semibold mb-4">🤖 AI 인사이트 리포트</h2>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm whitespace-pre-wrap text-gray-800">
          {getReportContent()}
        </div>
      </div>
    </div>
  );
};

export default AIInsightReport;

