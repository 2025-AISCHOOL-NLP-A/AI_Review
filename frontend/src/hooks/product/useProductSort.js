import { useState } from "react";

/**
 * 제품 정렬 커스텀 훅
 */
export function useProductSort() {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (field) => {
    if (sortField === field) {
      // 같은 필드를 클릭하면 정렬 방향 토글
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // 다른 필드를 클릭하면 해당 필드로 정렬 (기본 오름차순)
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return {
    sortField,
    sortDirection,
    handleSort,
    resetSort: () => {
      setSortField(null);
      setSortDirection("asc");
    },
  };
}

