/**
 * 제품 필터링 유틸리티 함수
 * useProductFilter.js의 필터링 로직을 분리하여 재사용 가능하게 만듦
 */
import { formatDateToYYYYMMDD, isDateInRange } from "../format/dateUtils";

/**
 * 제품 검색 필터 적용
 * @param {Array} products - 제품 목록
 * @param {string} searchQuery - 검색어
 * @returns {Array} 필터링된 제품 목록
 */
export const applySearchFilter = (products, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) {
    return products;
  }

  const query = searchQuery.toLowerCase().trim();
  return products.filter((item) => {
    const productName = item.product_name ? item.product_name.toLowerCase() : "";
    const brand = item.brand && item.brand.trim() ? item.brand.toLowerCase() : "";
    return productName.includes(query) || brand.includes(query);
  });
};

/**
 * 제품 카테고리 필터 적용
 * @param {Array} products - 제품 목록
 * @param {string|number} categoryId - 카테고리 ID
 * @returns {Array} 필터링된 제품 목록
 */
export const applyCategoryFilter = (products, categoryId) => {
  if (!categoryId) {
    return products;
  }

  return products.filter(
    (item) => item.category_id === Number(categoryId)
  );
};

/**
 * 날짜 범위 필터 적용
 * @param {Array} products - 제품 목록
 * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
 * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
 * @returns {Array} 필터링된 제품 목록
 */
export const applyDateRangeFilter = (products, startDate, endDate) => {
  if (!startDate && !endDate) {
    return products;
  }

  return products.filter((item) => {
    const itemDate = item.registered_date || item.updated_at || item.created_at;
    if (!itemDate) return false;
    
    return isDateInRange(itemDate, startDate, endDate);
  });
};

/**
 * 제품 목록 정렬
 * @param {Array} products - 제품 목록
 * @param {string} sortField - 정렬 필드
 * @param {string} sortDirection - 정렬 방향 ('asc' | 'desc')
 * @returns {Array} 정렬된 제품 목록
 */
export const sortProducts = (products, sortField, sortDirection) => {
  if (!sortField) {
    return products;
  }

  return [...products].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // 숫자 필드인 경우
    if (sortField === "category_id") {
      aValue = aValue !== null && aValue !== undefined ? Number(aValue) : 0;
      bValue = bValue !== null && bValue !== undefined ? Number(bValue) : 0;
    }
    // 날짜 필드인 경우
    else if (sortField === "registered_date") {
      aValue = aValue ? new Date(aValue) : new Date(0);
      bValue = bValue ? new Date(bValue) : new Date(0);
    }
    // 문자열 필드인 경우
    else {
      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
    }

    const result =
      aValue < bValue
        ? sortDirection === "asc"
          ? -1
          : 1
        : aValue > bValue
        ? sortDirection === "asc"
          ? 1
          : -1
        : 0;
    return result;
  });
};

/**
 * 모든 필터 적용 (검색, 카테고리, 날짜 범위, 정렬)
 * @param {Array} products - 제품 목록
 * @param {Object} filters - 필터 옵션
 * @param {string} filters.searchQuery - 검색어
 * @param {string|number} filters.categoryId - 카테고리 ID
 * @param {string} filters.startDate - 시작 날짜
 * @param {string} filters.endDate - 종료 날짜
 * @param {string} filters.sortField - 정렬 필드
 * @param {string} filters.sortDirection - 정렬 방향
 * @returns {Array} 필터링 및 정렬된 제품 목록
 */
export const applyAllFilters = (products, filters) => {
  const {
    searchQuery,
    categoryId,
    startDate,
    endDate,
    sortField,
    sortDirection,
  } = filters;

  let filtered = [...products];

  // 필터 적용 순서: 검색 → 카테고리 → 날짜 범위 → 정렬
  filtered = applySearchFilter(filtered, searchQuery);
  filtered = applyCategoryFilter(filtered, categoryId);
  filtered = applyDateRangeFilter(filtered, startDate, endDate);
  filtered = sortProducts(filtered, sortField, sortDirection);

  return filtered;
};

