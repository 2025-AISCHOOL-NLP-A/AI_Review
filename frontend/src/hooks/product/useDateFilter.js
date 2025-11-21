import { useState, useEffect, useMemo } from "react";
import { formatDateToYYYYMMDD } from "../../utils/format/dateUtils";

/**
 * 날짜 필터링 커스텀 훅
 */
export function useDateFilter(allProducts) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 등록일의 최솟값과 최댓값 계산
  const { minRegisteredDate, maxRegisteredDate } = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return { minRegisteredDate: undefined, maxRegisteredDate: undefined };
    }

    const dates = allProducts
      .map((product) => {
        const dateString = product.registered_date || product.updated_at || product.created_at;
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
      })
      .filter((date) => date !== null);

    if (dates.length === 0) {
      return { minRegisteredDate: undefined, maxRegisteredDate: undefined };
    }

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    return {
      minRegisteredDate: formatDateToYYYYMMDD(minDate),
      maxRegisteredDate: formatDateToYYYYMMDD(maxDate),
    };
  }, [allProducts]);

  // 등록일 최솟값과 최댓값이 계산되면 시작일과 종료일을 자동으로 설정
  useEffect(() => {
    if (minRegisteredDate && maxRegisteredDate && !startDate && !endDate) {
      setStartDate(minRegisteredDate);
      setEndDate(maxRegisteredDate);
    }
  }, [minRegisteredDate, maxRegisteredDate]);

  // 날짜 변경 핸들러 (시작일)
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    // HTML max 속성으로 이미 제한되지만, 방어적 프로그래밍을 위한 검증
    if (endDate && newStartDate > endDate) {
      // 시작일이 종료일보다 나중이면 설정하지 않음 (브라우저에서 이미 제한됨)
      return;
    }
    setStartDate(newStartDate);
  };

  // 날짜 변경 핸들러 (종료일)
  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    // HTML min 속성으로 이미 제한되지만, 방어적 프로그래밍을 위한 검증
    if (startDate && newEndDate < startDate) {
      // 종료일이 시작일보다 이전이면 설정하지 않음 (브라우저에서 이미 제한됨)
      return;
    }
    setEndDate(newEndDate);
  };

  // 날짜 필터 초기화
  const handleClearDateFilter = () => {
    if (minRegisteredDate && maxRegisteredDate) {
      setStartDate(minRegisteredDate);
      setEndDate(maxRegisteredDate);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  return {
    startDate,
    endDate,
    minRegisteredDate,
    maxRegisteredDate,
    handleStartDateChange,
    handleEndDateChange,
    handleClearDateFilter,
  };
}

