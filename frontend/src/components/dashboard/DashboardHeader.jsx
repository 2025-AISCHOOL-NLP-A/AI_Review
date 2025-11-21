import React from "react";

/**
 * 대시보드 헤더 컴포넌트
 * - 제품 이름 표시
 * - 날짜 필터
 */
const DashboardHeader = ({
  loading,
  productInfo,
  dashboardData,
  startDate,
  endDate,
  appliedStartDate,
  appliedEndDate,
  onStartDateChange,
  onEndDateChange,
  onApplyFilter,
  onResetFilter,
  getTodayDate,
}) => {
  return (
    <header className="pt-6 pb-4">
      <h1 className="text-3xl font-extrabold text-gray-800">
        리뷰 분석 대시보드
      </h1>
      <div className="mt-4 p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between bg-white rounded-xl shadow-sm">
        <div className="mb-3 md:mb-0">
          <span className="text-xs font-semibold uppercase text-gray-500 mr-2">
            제품명
          </span>
          <span className="text-2xl font-bold text-gray-900">
            {loading
              ? "로딩 중..."
              : productInfo?.product_name ||
              dashboardData?.product?.product_name ||
              dashboardData?.product_name ||
              (dashboardData === null ? "로딩 중..." : "상품 정보 없음")}
          </span>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-3 text-sm">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <label
                htmlFor="dashboard_start_date"
                className="text-gray-600 font-medium whitespace-nowrap"
              >
                기간 필터:
              </label>
              <input
                id="dashboard_start_date"
                name="start_date"
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
                value={startDate}
                onChange={onStartDateChange}
                max={endDate || getTodayDate()}
              />
              <span className="text-gray-500">~</span>
              <input
                id="dashboard_end_date"
                name="end_date"
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
                value={endDate}
                onChange={onEndDateChange}
                min={startDate || undefined}
                max={getTodayDate()}
              />
              {(startDate || endDate) && (
                <button
                  onClick={onResetFilter}
                  className="p-2 text-gray-500 hover:text-gray-700 transition"
                  title="필터 초기화"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            {(appliedStartDate || appliedEndDate) && (
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <span className="font-medium">현재 적용:</span>
                <span className="text-main font-semibold">
                  {appliedStartDate
                    ? `${appliedStartDate.split("-")[0]}.${appliedStartDate.split("-")[1]}.${appliedStartDate.split("-")[2]}`
                    : "전체"}{" "}
                  ~{" "}
                  {appliedEndDate
                    ? `${appliedEndDate.split("-")[0]}.${appliedEndDate.split("-")[1]}.${appliedEndDate.split("-")[2]}`
                    : "전체"}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onApplyFilter}
            className="bg-main text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition shadow-md flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            적용하기
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

