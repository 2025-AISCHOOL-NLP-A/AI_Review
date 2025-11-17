import { useState, useEffect, useMemo } from "react";
import { applyAllFilters } from "../utils/productFilters";

/**
 * 제품 필터링 및 페이지네이션 커스텀 훅
 */
export function useProductFilter(
  allProducts,
  searchQuery,
  selectedCategoryFilter,
  startDate,
  endDate,
  sortField,
  sortDirection,
  productsPerPage = 10
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [workplaceData, setWorkplaceData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 검색어나 필터 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter, startDate, endDate]);

  // 필터링 및 페이지네이션
  useEffect(() => {
    // 모든 필터 적용
    const filtered = applyAllFilters(allProducts, {
      searchQuery,
      categoryId: selectedCategoryFilter,
      startDate,
      endDate,
      sortField,
      sortDirection,
    });

    // 전체 개수 설정
    const total = filtered.length;
    setTotalCount(total);
    setTotalPages(Math.ceil(total / productsPerPage));

    // 페이지네이션 적용
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedData = filtered.slice(startIndex, endIndex);

    setWorkplaceData(paginatedData);
  }, [
    allProducts,
    currentPage,
    searchQuery,
    selectedCategoryFilter,
    startDate,
    endDate,
    sortField,
    sortDirection,
    productsPerPage,
  ]);

  // totalPages가 변경되면 currentPage가 유효한 범위 내에 있는지 확인
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // 카테고리 목록 추출 (중복 제거)
  const categories = useMemo(() => {
    const categorySet = new Set();
    allProducts.forEach((product) => {
      if (product.category_id) {
        categorySet.add(product.category_id);
      }
    });
    return Array.from(categorySet).sort((a, b) => a - b);
  }, [allProducts]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    workplaceData,
    currentPage,
    totalPages,
    totalCount,
    categories,
    handlePageChange,
    setCurrentPage,
  };
}

