import { useState, useEffect, useMemo } from "react";

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
    let filtered = [...allProducts];

    // 검색 필터 적용
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const productName = item.product_name ? item.product_name.toLowerCase() : "";
        const brand = item.brand && item.brand.trim() ? item.brand.toLowerCase() : "";
        return productName.includes(query) || brand.includes(query);
      });
    }

    // 카테고리 필터 적용
    if (selectedCategoryFilter) {
      filtered = filtered.filter(
        (item) => item.category_id === Number(selectedCategoryFilter)
      );
    }

    // 등록일 날짜 범위 필터 적용
    if (startDate || endDate) {
      filtered = filtered.filter((item) => {
        const itemDate = item.registered_date
          ? new Date(item.registered_date)
          : item.updated_at
          ? new Date(item.updated_at)
          : item.created_at
          ? new Date(item.created_at)
          : null;

        if (!itemDate || isNaN(itemDate.getTime())) return false;

        const itemDateStr = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, "0")}-${String(itemDate.getDate()).padStart(2, "0")}`;

        if (startDate && endDate) {
          return itemDateStr >= startDate && itemDateStr <= endDate;
        } else if (startDate) {
          return itemDateStr >= startDate;
        } else if (endDate) {
          return itemDateStr <= endDate;
        }

        return true;
      });
    }

    // 정렬 적용
    if (sortField) {
      filtered.sort((a, b) => {
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
    }

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

