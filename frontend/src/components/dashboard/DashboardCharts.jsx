import React from "react";
import DailyTrendChart from "../charts/DailyTrendChart";
import RadarChart from "../charts/RadarChart";
import SplitBarChart from "../charts/SplitBarChart";
import Heatmap from "../charts/Heatmap";

/**
 * 대시보드 차트 섹션 컴포넌트
 * - 월별 긍·부정 포함 리뷰 비율
 * - 속성별 감정 밸런스
 * - 속성별 긍·부정 분기형 막대 그래프
 * - 속성 상관관계 히트맵
 */
const DashboardCharts = ({
  loading,
  dashboardData,
  dailyTrendData,
  radarData,
  splitBarRawData,
  correlationLabels,
  correlationMatrix,
}) => {
  return (
    <>
      {/* Main Chart Section */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
        id="main-chart-section"
      >
        <div
          className="card lg:col-span-2 flex flex-col"
          id="daily-trend-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              월별 리뷰 수와 긍/부정 평가 변화 추이
            </h2>
          </div>
          <DailyTrendChart data={dailyTrendData} loading={loading} />
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
            <h4 className="font-bold text-gray-700 mb-1">📈 결과 요약:</h4>
            <p>
              {loading
                ? "데이터 로딩 중..."
                : dashboardData?.analysis
                ? `긍정 비율: ${Math.round(dashboardData.analysis.positiveRatio || 0)}%, 부정 비율: ${Math.round(dashboardData.analysis.negativeRatio || 0)}%. 총 리뷰 수: ${dashboardData?.stats?.totalReviews || 0}건.`
                : "분석 데이터가 없습니다."}
            </p>
          </div>
        </div>

        <div className="card lg:col-span-1 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">핵심 속성별 장단점 시각화</h2>
          <RadarChart data={radarData} loading={loading} />
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
            <h4 className="font-bold text-gray-700 mb-1">📈 해석:</h4>
            <p>
              {loading
                ? "데이터 로딩 중..."
                : dashboardData?.analysis
                ? `긍정 비율: ${Math.round(dashboardData.analysis.positiveRatio || 0)}%, 부정 비율: ${Math.round(dashboardData.analysis.negativeRatio || 0)}%. 평균 평점: ${parseFloat(
                    dashboardData?.insight?.avg_rating ||
                      dashboardData.analysis.avgRating ||
                      0
                  ).toFixed(1)}/5.0`
                : "분석 데이터가 없습니다."}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Section */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        id="detailed-analysis-section"
      >
        <div className="card lg:col-span-2" id="split-bar-chart-card">
          <h2 className="text-xl font-semibold mb-4">
            속성별 언급 비중과 긍/부정 평가
          </h2>
          <SplitBarChart data={splitBarRawData} loading={loading} />
        </div>

        <div className="card lg:col-span-1" id="heatmap-card">
          <h2 className="text-xl font-semibold mb-4">
            동시 언급 속성 패턴 분석
          </h2>
          <Heatmap
            labels={correlationLabels}
            matrix={correlationMatrix}
            loading={
              loading ||
              !dashboardData?.heatmap ||
              correlationLabels.length === 0 ||
              correlationMatrix.length === 0
            }
          />
        </div>
      </div>
    </>
  );
};

export default DashboardCharts;

