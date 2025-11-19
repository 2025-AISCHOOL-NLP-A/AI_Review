import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/sidebar/Sidebar";
import Footer from "../../components/layout/Footer/Footer";
import ReviewFilterBar from "../../components/review/ReviewFilterBar";
import ReviewListTable from "../../components/review/ReviewListTable";
import ProductPagination from "../../components/workplace/ProductPagination";
import reviewService from "../../services/reviewService";
import { useSidebar } from "../../hooks/useSidebar";
import { getTodayDate } from "../../utils/dateUtils";
import { sanitizeInput } from "../../utils/inputSanitizer";
import "../../styles/common.css";
import "../../styles/modal.css";
import "../dashboard/dashboard.css";
import "../../components/layout/sidebar/sidebar.css";
import "./review-management.css";

function ReviewManagement() {
  const navigate = useNavigate();
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductFilter, setSelectedProductFilter] = useState("");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState("");
  const [selectedSentimentFilter, setSelectedSentimentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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

  // 날짜 변경 핸들러
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    if (endDate && newStartDate > endDate) {
      return;
    }
    setStartDate(newStartDate);
    setCurrentPage(1);
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    if (startDate && newEndDate < startDate) {
      return;
    }
    setEndDate(newEndDate);
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

  // 리뷰 목록 로드
  useEffect(() => {
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
          ...(selectedRatingFilter && { rating: parseInt(selectedRatingFilter) }),
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
          setReviews(result.data || []);
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
    selectedRatingFilter,
    selectedSentimentFilter,
    searchQuery,
    startDate,
    endDate,
    sortField,
    sortDirection,
    reviewsPerPage,
  ]);

  // 체크박스 전체 선택/해제
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedReviews(reviews.map((review) => review.review_id));
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

  // 리뷰 클릭 처리 (상세보기 등)
  const handleReviewClick = (review) => {
    // 리뷰 클릭 시 제품 대시보드로 이동
    if (review.product_id) {
      navigate(`/dashboard?productId=${review.product_id}`);
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

  // 선택된 리뷰 다운로드
  const handleDownload = async () => {
    if (selectedReviews.length === 0) {
      alert("다운로드할 리뷰를 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const filters = {
        // 선택된 리뷰만 다운로드하기 위한 필터
        review_ids: selectedReviews,
        ...(selectedProductFilter && { product_id: parseInt(selectedProductFilter) }),
        ...(selectedRatingFilter && { rating: parseInt(selectedRatingFilter) }),
        ...(selectedSentimentFilter && { sentiment: selectedSentimentFilter }),
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      };

      const result = await reviewService.exportReviews(filters, "csv");

      if (result.success) {
        // 다운로드 성공 메시지는 exportReviews 내부에서 파일 다운로드 처리
      } else {
        alert(result.message || "리뷰 다운로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("리뷰 다운로드 중 오류:", error);
      alert("리뷰 다운로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`dashboard-page ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar />
      <div className="dashboard-wrapper">
        <div className="dashboard-content">
          <div className="review-management-container">
            {/* Header Section */}
            <div className="review-management-header">
              <h1 className="review-management-title">리뷰 관리</h1>
            </div>

            {/* Filters Section */}
            <ReviewFilterBar
              searchQuery={searchQuery}
              onSearchChange={(e) => {
                const sanitizedValue = sanitizeInput(e.target.value, {
                  type: "text",
                  maxLength: 100,
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
              selectedRatingFilter={selectedRatingFilter}
              onRatingFilterChange={(value) => {
                setSelectedRatingFilter(value);
                setCurrentPage(1);
              }}
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
                setStartDate("");
                setEndDate("");
                setCurrentPage(1);
              }}
              getTodayDate={getTodayDate}
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
              onReviewClick={handleReviewClick}
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
                  className="download-btn"
                  onClick={handleDownload}
                  disabled={selectedReviews.length === 0 || loading}
                  title={
                    selectedReviews.length === 0
                      ? "다운로드할 리뷰를 선택해주세요"
                      : `선택한 ${selectedReviews.length}개 리뷰 다운로드`
                  }
                >
                  Download
                </button>
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
  );
}

export default ReviewManagement;

