import React from "react";
import ReactMarkdown from "react-markdown";

/**
 * AI 인사이트 리포트 컴포넌트
 */
const AIInsightReport = ({ loading, dashboardData }) => {
  // 파싱된 content를 마크다운 형식으로 변환하는 헬퍼 함수
  const formatContent = (content) => {
    if (!content) return null;
    
    // 문자열이면 그대로 반환
    if (typeof content === 'string') {
      return content;
    }
    
    // 객체인 경우 구조화된 마크다운 형식으로 변환
    if (typeof content === 'object' && content !== null) {
      let result = "# 📊 리뷰 분석 보고서\n\n";
      
      // 감정 비율
      let positiveRatio = null;
      let negativeRatio = null;
      
      // sentiment_ratio가 문자열인 경우 파싱 (예: "긍정: 70%, 부정: 30%")
      if (typeof content.sentiment_ratio === 'string') {
        const match = content.sentiment_ratio.match(/긍정:\s*(\d+)%[,\s]*부정:\s*(\d+)%/);
        if (match) {
          positiveRatio = parseInt(match[1], 10);
          negativeRatio = parseInt(match[2], 10);
        }
      } 
      // sentiment_ratio가 객체인 경우
      else if (content.sentiment_ratio && typeof content.sentiment_ratio === 'object') {
        positiveRatio = content.sentiment_ratio.positive ?? content.sentiment_ratio.positive_ratio ?? 0;
        negativeRatio = content.sentiment_ratio.negative ?? content.sentiment_ratio.negative_ratio ?? 0;
      }
      // 개별 필드가 있는 경우
      else {
        positiveRatio = content.positive_ratio ?? content.positive_ratio_percent ?? null;
        negativeRatio = content.negative_ratio ?? content.negative_ratio_percent ?? null;
      }
      
      // 값이 유효한 경우에만 표시
      if (positiveRatio !== null || negativeRatio !== null) {
        result += "## ✔ 감정 비율\n\n";
        result += `- **긍정:** ${Math.round(Number(positiveRatio) || 0)}%\n`;
        result += `- **부정:** ${Math.round(Number(negativeRatio) || 0)}%\n\n`;
        result += "---\n\n";
      }
      
      // 긍정 요소
      if (content.positive_elements || content.positive_factors) {
        const positiveElements = content.positive_elements || content.positive_factors || [];
        if (Array.isArray(positiveElements) && positiveElements.length > 0) {
          result += "## ✔ 긍정 요소\n\n";
          positiveElements.forEach(item => {
            const text = typeof item === 'string' ? item : (item.text || item.content || item);
            result += `- ${text}  \n`;
          });
          result += "\n---\n\n";
        }
      }
      
      // 부정 요소
      if (content.negative_elements || content.negative_factors) {
        const negativeElements = content.negative_elements || content.negative_factors || [];
        if (Array.isArray(negativeElements) && negativeElements.length > 0) {
          result += "## ✔ 부정 요소\n\n";
          negativeElements.forEach(item => {
            const text = typeof item === 'string' ? item : (item.text || item.content || item);
            result += `- ${text}  \n`;
          });
          result += "\n---\n\n";
        }
      }
      
      // 개선 제안
      if (content.improvement_suggestions || content.suggestions || content.improvements) {
        const suggestions = content.improvement_suggestions || content.suggestions || content.improvements || [];
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          result += "## ✔ 개선 제안\n\n";
          suggestions.forEach(item => {
            const text = typeof item === 'string' ? item : (item.text || item.content || item);
            result += `- ${text}  \n`;
          });
          result += "\n---\n\n";
        }
      }
      
      // 종합 요약
      if (content.summary || content.conclusion || content.overall_summary) {
        const summary = content.summary || content.conclusion || content.overall_summary || "";
        if (summary) {
          result += "## ✔ 종합 요약\n\n";
          result += `${summary}\n\n`;
        }
      }
      
      return result.trim();
    }
    
    return String(content);
  };

  const getReportContent = () => {
    if (loading) {
      return "데이터 로딩 중...";
    }

    // tb_productInsight의 content 필드가 있으면 우선 표시
    // (dashboardResponseProcessor에서 이미 JSON 파싱됨)
    if (dashboardData?.insight?.content) {
      const formattedContent = formatContent(dashboardData.insight.content);
      return formattedContent || String(dashboardData.insight.content);
    }

    // content가 없으면 기존 로직 사용 (하위 호환성)
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

  const reportContent = getReportContent();

  return (
    <div className="grid grid-cols-1 gap-6" id="ai-insight-report-section">
      <div className="card w-full">
        <h2 className="text-xl font-semibold mb-4">🤖 AI 인사이트 리포트</h2>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-800 min-h-[100px] prose prose-sm max-w-none">
          {reportContent ? (
            <ReactMarkdown>{reportContent}</ReactMarkdown>
          ) : (
            "인사이트 데이터가 없습니다."
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsightReport;

