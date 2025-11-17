import React from "react";

/**
 * KPI 카드 컴포넌트
 * - 총 리뷰 수
 * - 긍정 비율
 * - 부정 비율
 * - 종합 스코어
 */
const KPICards = ({ loading, dashboardData }) => {
  return (
    <div className="kpi-cards-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="card kpi-card">
        <h3 className="text-sm font-medium text-gray-500">💬 총 리뷰 수</h3>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-3xl font-extrabold text-gray-900">
            {loading
              ? "로딩 중..."
              : `${dashboardData?.stats?.totalReviews || 0}건`}
          </p>
        </div>
        <p className="mt-2 text-xs text-gray-400">제품 전체 리뷰 수</p>
      </div>
      <div className="card kpi-card">
        <h3 className="text-sm font-medium text-gray-500">😀 긍정 비율</h3>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-3xl font-extrabold text-gray-900">
            {loading
              ? "로딩 중..."
              : `${Math.round(dashboardData?.stats?.positiveRatio || 0)}%`}
          </p>
        </div>
        <p className="mt-2 text-xs text-gray-400">긍정 평가 비중</p>
      </div>
      <div className="card kpi-card">
        <h3 className="text-sm font-medium text-gray-500">😟 부정 비율</h3>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-3xl font-extrabold text-gray-900">
            {loading
              ? "로딩 중..."
              : `${Math.round(dashboardData?.stats?.negativeRatio || 0)}%`}
          </p>
        </div>
        <p className="mt-2 text-xs text-gray-400">부정 평가 비중</p>
      </div>
      <div className="card kpi-card">
        <h3 className="text-sm font-medium text-gray-500">⭐ 종합 스코어</h3>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-3xl font-extrabold text-gray-900">
            {loading
              ? "로딩 중..."
              : `${parseFloat(
                  dashboardData?.insight?.avg_rating ||
                    dashboardData?.stats?.avgRating ||
                    0
                ).toFixed(1)} / 5.0`}
          </p>
        </div>
        <p className="mt-2 text-xs text-gray-400">전체 감정 점수 기반 산출</p>
      </div>
    </div>
  );
};

export default KPICards;

