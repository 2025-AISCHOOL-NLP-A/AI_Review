import React from "react";

/**
 * 리뷰 필터 및 검색 바 컴포넌트
 */
export default function ReviewFilterBar({
  searchQuery,
  onSearchChange,
  onSearchKeyDown,
  selectedProductFilter,
  onProductFilterChange,
  products,
  selectedSentimentFilter,
  onSentimentFilterChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearDateFilter,
  getTodayDate,
}) {
  return (
    <div className="review-filters">
      <div className="filters-left">
        {/* 제품 필터 */}
        <div className="filter-dropdown">
          <select
            id="review_product_filter"
            name="product_filter"
            className="review-filter"
            value={selectedProductFilter}
            onChange={(e) => {
              onProductFilterChange(e.target.value);
            }}
          >
            <option value="">전체 제품</option>
            {products.map((product) => (
              <option key={product.product_id} value={product.product_id}>
                {product.product_name || `제품 ${product.product_id}`}
              </option>
            ))}
          </select>
        </div>

        {/* 감정 분석 필터 */}
        <div className="filter-dropdown">
          <select
            id="review_sentiment_filter"
            name="sentiment_filter"
            className="review-filter"
            value={selectedSentimentFilter}
            onChange={(e) => {
              onSentimentFilterChange(e.target.value);
            }}
          >
            <option value="">전체 감정</option>
            <option value="positive">긍정</option>
            <option value="negative">부정</option>
          </select>
        </div>

        {/* 검색 */}
        <div className="search-container">
          <svg
            className="search-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            id="review_search"
            name="review_search"
            className="search-input"
            placeholder="리뷰 내용 검색"
            value={searchQuery}
            onChange={onSearchChange}
            onKeyDown={onSearchKeyDown}
          />
        </div>
      </div>

      {/* 날짜 필터 */}
      <div className="date-filter-container">
        <input
          type="date"
          id="review_start_date"
          name="start_date"
          className="date-input"
          placeholder="시작일"
          value={startDate}
          onChange={onStartDateChange}
          max={endDate || getTodayDate()}
        />
        <span className="date-separator">~</span>
        <input
          type="date"
          id="review_end_date"
          name="end_date"
          className="date-input"
          placeholder="종료일"
          value={endDate}
          onChange={onEndDateChange}
          min={startDate || undefined}
          max={getTodayDate()}
        />
        {(startDate || endDate) && (
          <button
            className="date-clear-btn"
            onClick={onClearDateFilter}
            title="날짜 필터 초기화"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="clear-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

