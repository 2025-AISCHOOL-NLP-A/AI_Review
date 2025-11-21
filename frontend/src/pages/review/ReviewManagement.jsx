import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../../components/layout/sidebar/Sidebar";
import Footer from "../../components/layout/Footer/Footer";
import ReviewFilterBar from "../../components/review/ReviewFilterBar";
import ReviewListTable from "../../components/review/ReviewListTable";
import ProductPagination from "../../components/workplace/ProductPagination";
import reviewService from "../../services/reviewService";
import { useSidebar } from "../../hooks/ui/useSidebar";
import { getTodayDate } from "../../utils/format/dateUtils";
import { sanitizeInput } from "../../utils/format/inputSanitizer";
import "../../styles/common.css";
import "../../styles/modal.css";
import "../dashboard/dashboard.css";
import "../../components/layout/sidebar/sidebar.css";
import "./review-management.css";

function ReviewManagement() {
  const [searchParams] = useSearchParams();
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductFilter, setSelectedProductFilter] = useState("");
  const [selectedSentimentFilter, setSelectedSentimentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDateFilterInitialized, setIsDateFilterInitialized] = useState(false);
  const [minReviewDate, setMinReviewDate] = useState("");
  const [maxReviewDate, setMaxReviewDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState("review_date");
  const [sortDirection, setSortDirection] = useState("desc");
  
  const reviewsPerPage = 10;
  const abortControllerRef = useRef(null);
  
  // 사이드바 상태 관리
  const sidebarOpen = useSidebar();

  // URL 쿼리 파라미터에서 productId 읽어서 제품 필터 설정
  useEffect(() => {
    const productIdFromUrl = searchParams.get("productId");
    if (productIdFromUrl) {
      setSelectedProductFilter(productIdFromUrl);
    }
  }, [searchParams]);

  // 날짜 변경 핸들러
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    if (endDate && newStartDate > endDate) {
      return;
    }
    setStartDate(newStartDate);
    setIsDateFilterInitialized(true); // 사용자가 수동으로 변경했음을 표시
    setCurrentPage(1);
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    if (startDate && newEndDate < startDate) {
      return;
    }
    setEndDate(newEndDate);
    setIsDateFilterInitialized(true); // 사용자가 수동으로 변경했음을 표시
    setCurrentPage(1);
  };

  // 정렬 처리
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // 제품 목록 로드
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await reviewService.getProducts();
        if (result.success && Array.isArray(result.data)) {
          setProducts(result.data);
        }
      } catch (error) {
        console.error("제품 목록 로드 실패:", error);
      }
    };

    fetchProducts();
  }, []);

  // 검색이나 필터가 변경될 때 날짜 범위를 다시 계산하기 위해 초기화 플래그 리셋
  useEffect(() => {
    // 검색이나 필터가 변경되면 날짜 범위를 다시 계산할 수 있도록 플래그 리셋
    setIsDateFilterInitialized(false);
  }, [selectedProductFilter, selectedSentimentFilter, searchQuery]);

  // URL의 productId가 변경될 때도 날짜 범위를 다시 계산
  useEffect(() => {
    const productIdFromUrl = searchParams.get("productId");
    if (productIdFromUrl) {
      // URL에서 제품이 변경되면 날짜 범위를 다시 계산하도록 초기화
      setIsDateFilterInitialized(false);
    }
  }, [searchParams]);

  // 전체 리뷰의 날짜 범위 계산 (날짜 필터 제외)
  useEffect(() => {
    if (isDateFilterInitialized) return; // 이미 초기화되었으면 실행하지 않음

    const fetchDateRange = async () => {
      try {
        // URL의 productId를 우선 사용, 없으면 selectedProductFilter 사용
        const productIdFromUrl = searchParams.get("productId");
        const productIdToUse = productIdFromUrl || selectedProductFilter;
        
        // 날짜 필터를 제외한 필터 조건으로 전체 리뷰의 날짜 범위 계산
        const filters = {
          ...(productIdToUse && { product_id: parseInt(productIdToUse) }),
          ...(selectedSentimentFilter && { sentiment: selectedSentimentFilter }),
          ...(searchQuery.trim() && { search: searchQuery.trim() }),
          // 날짜 필터는 제외
        };

        // 최소 날짜와 최대 날짜를 각각 가져오기 위해 두 번의 요청
        // 1. 오름차순 정렬로 첫 번째 리뷰 (최소 날짜)
        const minResult = await reviewService.getReviews(
          filters,
          1,
          1, // 첫 번째 리뷰만 필요
          "review_date",
          "asc",
          null
        );

        // 2. 내림차순 정렬로 첫 번째 리뷰 (최대 날짜)
        const maxResult = await reviewService.getReviews(
          filters,
          1,
          1, // 첫 번째 리뷰만 필요
          "review_date",
          "desc",
          null
        );

        // 날짜를 YYYY-MM-DD 형식으로 변환
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        let minDateStr = "";
        let maxDateStr = "";

        if (minResult.success && minResult.data && minResult.data.length > 0) {
          const minReview = minResult.data[0];
          if (minReview.review_date) {
            const minDate = new Date(minReview.review_date);
            if (!isNaN(minDate.getTime())) {
              minDateStr = formatDate(minDate);
              setMinReviewDate(minDateStr);
            }
          }
        }

        if (maxResult.success && maxResult.data && maxResult.data.length > 0) {
          const maxReview = maxResult.data[0];
          if (maxReview.review_date) {
            const maxDate = new Date(maxReview.review_date);
            if (!isNaN(maxDate.getTime())) {
              maxDateStr = formatDate(maxDate);
              setMaxReviewDate(maxDateStr);
            }
          }
        }

        // 날짜 범위 계산이 완료된 후 한 번에 startDate와 endDate 설정 (중복 요청 방지)
        if (minDateStr && maxDateStr) {
          setStartDate(minDateStr);
          setEndDate(maxDateStr);
        } else if (minDateStr) {
          setStartDate(minDateStr);
          setEndDate(minDateStr); // 최소 날짜만 있는 경우 동일하게 설정
        } else if (maxDateStr) {
          setStartDate(maxDateStr); // 최대 날짜만 있는 경우 동일하게 설정
          setEndDate(maxDateStr);
        }

        // 날짜 범위 계산이 완료되었거나 리뷰가 없는 경우 초기화 완료 처리
        setIsDateFilterInitialized(true);
      } catch (error) {
        console.error("날짜 범위 계산 중 오류:", error);
        // 오류 발생 시에도 초기화 완료 처리하여 리뷰 목록이 로드되도록 함
        setIsDateFilterInitialized(true);
      }
    };

    fetchDateRange();
  }, [
    selectedProductFilter,
    selectedSentimentFilter,
    searchQuery,
    isDateFilterInitialized,
    searchParams,
  ]);

  // 리뷰 목록 로드
  useEffect(() => {
    // 날짜 필터가 초기화되지 않았으면 리뷰 목록을 로드하지 않음 (깜빡임 방지)
    // 또는 날짜 범위 계산 중이면 리뷰 목록을 로드하지 않음 (중복 요청 방지)
    if (!isDateFilterInitialized) {
      return;
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새로운 AbortController 생성
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchReviews = async () => {
      setLoading(true);
      try {
        const filters = {
          ...(selectedProductFilter && { product_id: parseInt(selectedProductFilter) }),
          ...(selectedSentimentFilter && { sentiment: selectedSentimentFilter }),
          ...(searchQuery.trim() && { search: searchQuery.trim() }),
          ...(startDate && { start_date: startDate }),
          ...(endDate && { end_date: endDate }),
        };

        const result = await reviewService.getReviews(
          filters,
          currentPage,
          reviewsPerPage,
          sortField,
          sortDirection,
          signal
        );

        if (result.success) {
          const reviewsData = result.data || [];
          setReviews(reviewsData);
          setTotalPages(result.pagination?.totalPages || 1);
          setTotalCount(result.total || 0);
        } else {
          console.error("리뷰 목록 로드 실패:", result.message);
          setReviews([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } catch (error) {
        // AbortError는 정상적인 취소이므로 무시
        if (error.name !== "AbortError" && error.name !== "CanceledError") {
          console.error("리뷰 목록 로드 중 오류:", error);
          setReviews([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();

    // cleanup 함수
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    currentPage,
    selectedProductFilter,
    selectedSentimentFilter,
    searchQuery,
    startDate,
    endDate,
    sortField,
    sortDirection,
    reviewsPerPage,
    isDateFilterInitialized, // 날짜 필터 초기화 상태를 의존성에 추가
  ]);

  // 체크박스 전체 선택/해제
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // 백엔드에서 보내는 review_id 필드 사용
      setSelectedReviews(reviews.map((review) => review.review_id).filter((id) => id != null));
    } else {
      setSelectedReviews([]);
    }
  };

  // 개별 체크박스 선택/해제
  const handleSelectItem = (id) => {
    if (selectedReviews.includes(id)) {
      setSelectedReviews(selectedReviews.filter((item) => item !== id));
    } else {
      setSelectedReviews([...selectedReviews, id]);
    }
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedReviews([]); // 페이지 변경 시 선택 초기화
  };

  // 검색 처리
  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
    }
  };

  // 선택된 리뷰 삭제
  const handleDeleteSelected = async () => {
    if (selectedReviews.length === 0) {
      alert("삭제할 리뷰를 선택해주세요.");
      return;
    }

    if (!window.confirm(`선택한 ${selectedReviews.length}개의 리뷰를 삭제하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    try {
      let result;
      if (selectedReviews.length === 1) {
        // 단일 삭제
        result = await reviewService.deleteReview(selectedReviews[0]);
      } else {
        // 일괄 삭제
        result = await reviewService.deleteReviews(selectedReviews);
      }

      if (result.success) {
        alert("리뷰가 성공적으로 삭제되었습니다.");
        setSelectedReviews([]);
        // 리뷰 목록 새로고침 (currentPage 변경으로 useEffect 트리거)
        if (currentPage === 1) {
          // 첫 페이지면 강제 새로고침
          setCurrentPage(0);
          setTimeout(() => setCurrentPage(1), 0);
        } else {
          setCurrentPage(1);
        }
      } else {
        alert(result.message || "리뷰 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("리뷰 삭제 중 오류:", error);
      alert("리뷰 삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={`dashboard-page ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar />
      <div className="dashboard-wrapper">
        <div className="dashboard-content">
          <div className="dashboard-inner">
            <div className="review-management-container">
            {/* Header Section */}
            <div className="review-management-header">
              <div className="flex items-center justify-between">
                <h1 className="review-management-title">리뷰 관리</h1>
                {!loading && (
                  <div className="review-count-badge">
                    총 <span className="font-bold text-blue-600">{totalCount.toLocaleString()}</span>개
                  </div>
                )}
              </div>
            </div>

            {/* Filters Section */}
            <ReviewFilterBar
              searchQuery={searchQuery}
              onSearchChange={(e) => {
                // 검색 쿼리 sanitization (스페이스바 허용을 위해 trim 비활성화)
                const sanitizedValue = sanitizeInput(e.target.value, {
                  type: "text",
                  maxLength: 100,
                  trim: false,
                });
                setSearchQuery(sanitizedValue);
              }}
              onSearchKeyDown={handleSearch}
              selectedProductFilter={selectedProductFilter}
              onProductFilterChange={(value) => {
                setSelectedProductFilter(value);
                setCurrentPage(1);
              }}
              products={products}
              selectedSentimentFilter={selectedSentimentFilter}
              onSentimentFilterChange={(value) => {
                setSelectedSentimentFilter(value);
                setCurrentPage(1);
              }}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              onClearDateFilter={() => {
                // 초기화 시 최솟값과 최댓값으로 재설정
                if (minReviewDate && maxReviewDate) {
                  setStartDate(minReviewDate);
                  setEndDate(maxReviewDate);
                } else {
                  setStartDate("");
                  setEndDate("");
                }
                setIsDateFilterInitialized(false); // 날짜 필터 초기화 시 다시 자동 설정 가능하도록
                setCurrentPage(1);
                // 날짜 필터 초기화 후 전체 리뷰의 날짜 범위를 다시 계산하기 위해
                // useEffect가 다시 실행되도록 함 (isDateFilterInitialized가 false가 되면)
              }}
              getTodayDate={getTodayDate}
              minReviewDate={minReviewDate}
              maxReviewDate={maxReviewDate}
            />

            {/* Table Section */}
            <ReviewListTable
              reviewData={reviews}
              loading={loading}
              selectedReviews={selectedReviews}
              onSelectAll={handleSelectAll}
              onSelectItem={handleSelectItem}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />

            {/* Footer Section */}
            <div className="review-management-footer">
              <ProductPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
              <div className="action-buttons">
                <button
                  className="delete-btn"
                  onClick={handleDeleteSelected}
                  disabled={selectedReviews.length === 0 || loading}
                  title={
                    selectedReviews.length === 0
                      ? "삭제할 리뷰를 선택해주세요"
                      : `선택한 ${selectedReviews.length}개 리뷰 삭제`
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="delete-icon"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
            </div>

            {/* Footer */}
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewManagement;

