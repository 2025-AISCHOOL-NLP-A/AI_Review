import React from "react";

/**
 * 제품 필터 및 검색 바 컴포넌트
 */
export default function ProductFilterBar({
  searchQuery,
  onSearchChange,
  onSearchKeyDown,
  selectedCategoryFilter,
  onCategoryFilterChange,
  categories,
  getCategoryName,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearDateFilter,
  getTodayDate,
}) {
  return (
    <div className="workplace-filters">
      <div className="filters-left">
        <div className="filter-dropdown">
          <select
            id="workplace_category_filter"
            name="category_filter"
            className="product-filter"
            value={selectedCategoryFilter}
            onChange={(e) => {
              onCategoryFilterChange(e.target.value);
            }}
          >
            <option value="">전체 카테고리</option>
            {categories.map((categoryId) => (
              <option key={categoryId} value={categoryId}>
                {getCategoryName(categoryId)}
              </option>
            ))}
          </select>
        </div>
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
            id="workplace_search"
            name="workplace_search"
            className="search-input"
            placeholder="제품명 또는 브랜드로 검색"
            value={searchQuery}
            onChange={onSearchChange}
            onKeyDown={onSearchKeyDown}
          />
        </div>
      </div>
      <div className="date-filter-container">
        <input
          type="date"
          id="workplace_start_date"
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
          id="workplace_end_date"
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

