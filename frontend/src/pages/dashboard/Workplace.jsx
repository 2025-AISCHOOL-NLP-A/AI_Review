import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/sidebar/Sidebar";
import Footer from "../../components/layout/Footer/Footer";
import dashboardService from "../../services/dashboardService";
import ProductModal from "../../components/ProductModal";
import ProductInfoForm from "../../components/ProductInfoForm";
import ProductUploadForm from "../../components/ProductUploadForm";
import "../../styles/common.css";
import "../../styles/modal.css";
import "./dashboard.css";
import "../../components/layout/sidebar/sidebar.css";
import "./workplace.css";

function Workplace() {
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allProducts, setAllProducts] = useState([]); // 전체 제품 데이터 (백엔드에서 받은 원본)
  const [workplaceData, setWorkplaceData] = useState([]); // 화면에 표시할 제품 데이터 (필터링/페이지네이션 적용)
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [modalStep, setModalStep] = useState(null); // 'info' | 'upload' | null
  const [productFormData, setProductFormData] = useState(null);
  const [sortField, setSortField] = useState(null); // 'registered_date' | 'product_name' | 'brand' | 'category_id' | null
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  
  // 사이드바 상태를 localStorage에서 읽어오기
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? saved === "true" : true;
  });

  const productsPerPage = 10;

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

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

  // 사이드바 상태 변경 감지 (CustomEvent 사용)
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarOpen(e.detail.isOpen);
    };

    // CustomEvent 리스너 등록
    window.addEventListener("sidebar-toggle", handleSidebarToggle);
    
    // localStorage 변경 감지 (다른 탭에서 변경된 경우)
    const handleStorageChange = (e) => {
      if (e.key === "sidebarOpen") {
        setSidebarOpen(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("sidebar-toggle", handleSidebarToggle);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // 제품 목록 가져오기 (전체 데이터를 한 번만 가져옴)
  useEffect(() => {
    // AbortController를 사용하여 요청 취소 가능하도록 함
    const abortController = new AbortController();
    let isMounted = true;

    const fetchProducts = async () => {
      if (!isMounted || abortController.signal.aborted) {
        return;
      }

      setLoading(true);

      try {
        // 백엔드에서 전체 데이터를 가져옴 (페이지네이션 파라미터는 무시, AbortSignal 전달)
        const result = await dashboardService.getProducts(1, 1000, "", null, abortController.signal);

        // 요청이 취소되었거나 컴포넌트가 언마운트된 경우 상태 업데이트 방지
        if (!isMounted || abortController.signal.aborted) {
          return;
        }

        // result가 있고 success가 false가 아니면 처리
        if (result && (result.success === true || result.data !== undefined || result.products !== undefined)) {
          // 백엔드 응답 구조에 맞게 변환
          let products = [];
          // result.data가 있으면 사용, 없으면 result 자체를 사용
          const responseData = result.data !== undefined ? result.data : result;

          // 백엔드가 { message: "...", products: [] } 형태로 보내는 경우
          if (responseData?.products && Array.isArray(responseData.products)) {
            products = responseData.products;
          }
          // 배열로 직접 반환하는 경우
          else if (Array.isArray(responseData)) {
            products = responseData;
          }
          // { data: [] } 형태
          else if (responseData?.data && Array.isArray(responseData.data)) {
            products = responseData.data;
          }
          // 기타 객체 형태 - 모든 키를 확인
          else if (typeof responseData === 'object' && responseData !== null) {
            // 객체의 모든 키를 확인하여 배열을 찾음
            for (const key in responseData) {
              if (Array.isArray(responseData[key])) {
                products = responseData[key];
                break;
              }
            }
          }

          // 전체 제품 데이터 저장 (빈 배열도 저장)
          if (isMounted && !abortController.signal.aborted) {
            if (Array.isArray(products)) {
              setAllProducts(products);
            } else {
              setAllProducts([]);
            }
          }
        } else {
          if (isMounted && !abortController.signal.aborted) {
            setAllProducts([]);
          }
        }
      } catch (error) {
        // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
        if (error.name === 'AbortError' || error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || abortController.signal.aborted) {
          return;
        }
        console.error("❌ 제품 목록 조회 중 오류:", error);
        if (isMounted && !abortController.signal.aborted) {
          setAllProducts([]);
        }
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    // cleanup 함수: 컴포넌트 언마운트 시 또는 refreshTrigger 변경 시 진행 중인 요청 취소
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [refreshTrigger]); // refreshTrigger만 의존성으로 설정

  // 카테고리 목록 추출 (중복 제거) - category_id 기반
  const categories = React.useMemo(() => {
    const categorySet = new Set();
    allProducts.forEach((product) => {
      if (product.category_id) {
        categorySet.add(product.category_id);
      }
    });
    return Array.from(categorySet).sort((a, b) => a - b);
  }, [allProducts]);

  // 검색어나 필터 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter, startDate, endDate]);

  // 정렬 핸들러
  const handleSort = (field) => {
    if (sortField === field) {
      // 같은 필드를 클릭하면 정렬 방향 토글
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드를 클릭하면 해당 필드로 정렬 (기본 오름차순)
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로
  };

  // 클라이언트 사이드 필터링 및 페이지네이션
  useEffect(() => {
    let filtered = [...allProducts];

    // 검색 필터 적용
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (item) => {
          const productName = item.product_name ? item.product_name.toLowerCase() : '';
          const brand = item.brand && item.brand.trim() ? item.brand.toLowerCase() : '';
          return productName.includes(query) || brand.includes(query);
        }
      );
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
          : (item.updated_at ? new Date(item.updated_at) : (item.created_at ? new Date(item.created_at) : null));
        
        if (!itemDate || isNaN(itemDate.getTime())) return false;
        
        // 날짜만 비교 (시간 제외) - YYYY-MM-DD 형식으로 변환
        const itemDateStr = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
        
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

        // 숫자 필드인 경우 먼저 처리
        if (sortField === 'category_id') {
          aValue = (aValue !== null && aValue !== undefined) ? Number(aValue) : 0;
          bValue = (bValue !== null && bValue !== undefined) ? Number(bValue) : 0;
        }
        // 날짜 필드인 경우 Date 객체로 변환
        else if (sortField === 'registered_date') {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        }
        // 문자열 필드인 경우
        else {
          // null이나 undefined 처리
          if (aValue === null || aValue === undefined) aValue = '';
          if (bValue === null || bValue === undefined) bValue = '';
          
          // 문자열 비교 (대소문자 구분 없음)
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
          }
        }

        const result = aValue < bValue ? (sortDirection === 'asc' ? -1 : 1) : (aValue > bValue ? (sortDirection === 'asc' ? 1 : -1) : 0);
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
  }, [allProducts, currentPage, searchQuery, selectedCategoryFilter, startDate, endDate, productsPerPage, sortField, sortDirection]);

  // totalPages가 변경되면 currentPage가 유효한 범위 내에 있는지 확인
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // 카테고리 ID를 이름으로 변환
  const getCategoryName = (categoryId) => {
    const categoryMap = {
      101: '전자기기',
      102: '화장품',
      103: '게임'
    };
    return categoryMap[categoryId] || (categoryId ? `카테고리 ${categoryId}` : '-');
  };

  // 날짜 포맷팅 (registered_date 우선 사용, 없으면 updated_at 사용)
  const formatDate = (item) => {
    // registered_date를 우선 사용, 없으면 updated_at 사용
    const dateString = item.registered_date || item.updated_at || item.created_at;
    
    // null, undefined, 빈 문자열 체크
    if (!dateString || dateString === null || dateString === undefined || dateString === '') {
      return "-";
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "-";
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}.${month}.${day}`;
    } catch (e) {
      return "-";
    }
  };

  // 체크박스 전체 선택/해제
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(workplaceData.map(item => item.product_id));
    } else {
      setSelectedProducts([]);
    }
  };

  // 개별 체크박스 선택/해제
  const handleSelectItem = (id) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(item => item !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSelectedProducts([]); // 페이지 변경 시 선택 초기화
    }
  };

  // 검색 처리
  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
    }
  };

  // 다운로드 버튼 클릭
  const handleDownload = () => {
    // 선택된 제품 다운로드 로직 구현
  };

  // Add 버튼 클릭 - Step 1 모달 열기
  const handleAdd = () => {
    setModalStep("info");
    setProductFormData(null);
  };

  // Step 1에서 Next 클릭 - Step 2로 이동
  const handleNextStep = (formData) => {
    setProductFormData(formData);
    setModalStep("upload");
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setModalStep(null);
    setProductFormData(null);
  };

  // 제품 추가 성공 시 호출되는 콜백
  const handleProductAdded = () => {
    // 모달 닫기
    handleCloseModal();
    // 첫 페이지로 이동
    setCurrentPage(1);
    // 제품 목록 새로고침
    setRefreshTrigger(prev => prev + 1);
  };

  // 선택된 제품들 삭제
  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) {
      alert("삭제할 제품을 선택해주세요.");
      return;
    }

    // 중복 요청 방지
    if (loading) {
      return;
    }

    if (window.confirm(`선택한 ${selectedProducts.length}개의 제품을 삭제하시겠습니까?`)) {
      setLoading(true);
      try {
        // 모든 선택된 제품 삭제
        const deletePromises = selectedProducts.map(productId => 
          dashboardService.deleteProduct(productId)
        );
        const results = await Promise.all(deletePromises);
        
        // 모든 삭제가 성공했는지 확인
        const allSuccess = results.every(result => result.success);
        
        if (allSuccess) {
          // 선택된 제품 목록 초기화
          setSelectedProducts([]);
          // refreshTrigger를 변경하여 useEffect가 다시 실행되도록 함
          setRefreshTrigger(prev => prev + 1);
          // 삭제 후 현재 페이지가 빈 페이지가 되면 이전 페이지로 이동
          // (이 로직은 useEffect에서 totalPages를 계산한 후 처리됨)
        } else {
          alert("일부 제품 삭제에 실패했습니다.");
          // 성공한 것만 제거하고 새로고침
          setRefreshTrigger(prev => prev + 1);
        }
      } catch (error) {
        console.error("제품 삭제 중 오류:", error);
        alert("제품 삭제 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={`dashboard-page ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar />
      <div className="dashboard-wrapper">
        <div className="dashboard-content">
          <div className="workplace-container">
          {/* Header Section */}
          <div className="workplace-header">
            <h1 className="workplace-title">Workplace</h1>
          </div>

          {/* Filters Section */}
          <div className="workplace-filters">
            <div className="filters-left">
              <div className="filter-dropdown">
                <select
                  id="workplace_category_filter"
                  name="category_filter"
                  className="product-filter"
                  value={selectedCategoryFilter}
                  onChange={(e) => {
                    setSelectedCategoryFilter(e.target.value);
                    setCurrentPage(1);
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
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
                onChange={handleStartDateChange}
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
                onChange={handleEndDateChange}
                min={startDate || undefined}
                max={getTodayDate()}
              />
              {(startDate || endDate) && (
                <button
                  className="date-clear-btn"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
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

          {/* Table Section */}
          <div className="workplace-table-container">
            <table className="workplace-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input
                      type="checkbox"
                      id="workplace_select_all"
                      name="select_all"
                      checked={
                        workplaceData.length > 0 &&
                        selectedProducts.length === workplaceData.length
                      }
                      onChange={handleSelectAll}
                      disabled={loading || workplaceData.length === 0}
                    />
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('registered_date')}
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ flex: 1, textAlign: 'center' }}>등록일</span>
                      <span style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '2px',
                        fontSize: '0.7rem',
                        alignItems: 'center',
                        color: sortField === 'registered_date' ? '#5B8EFF' : '#9CA3AF',
                        marginLeft: 'auto'
                      }}>
                        <span style={{ 
                          opacity: sortField === 'registered_date' && sortDirection === 'asc' ? 1 : 0.3 
                        }}>▲</span>
                        <span style={{ 
                          opacity: sortField === 'registered_date' && sortDirection === 'desc' ? 1 : 0.3 
                        }}>▼</span>
                      </span>
                    </div>
                  </th>
                  <th style={{ textAlign: 'center' }}>제품명</th>
                  <th style={{ textAlign: 'center' }}>브랜드</th>
                  <th style={{ textAlign: 'center' }}>카테고리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                      로딩 중...
                    </td>
                  </tr>
                ) : workplaceData.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        <p style={{ margin: 0, fontSize: "1rem", color: "#6b7280" }}>
                          등록된 제품이 없습니다.
                        </p>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "#9ca3af" }}>
                          제품을 추가하여 분석을 시작하세요.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  workplaceData.map((item) => {
                    return (
                    <tr 
                      key={item.product_id}
                      onClick={() => navigate(`/dashboard?productId=${item.product_id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="checkbox-column" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          id={`workplace_product_${item.product_id}`}
                          name={`product_${item.product_id}`}
                          checked={selectedProducts.includes(item.product_id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectItem(item.product_id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>{formatDate(item)}</td>
                      <td className="product-cell" style={{ textAlign: 'center' }}>
                        {item.product_name || "-"}
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.brand && item.brand.trim() !== "" ? item.brand : "-"}</td>
                      <td style={{ textAlign: 'center' }}>{getCategoryName(item.category_id)}</td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Section */}
          <div className="workplace-footer">
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || totalPages === 0}
              >
                Previous
              </button>
              <div className="page-numbers">
                {totalPages > 0 && Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  // 페이지 번호가 유효한 범위 내에 있는지 확인
                  if (page < 1 || page > totalPages) {
                    return null;
                  }
                  return (
                    <button
                      key={page}
                      className={`page-number ${currentPage === page ? "active" : ""}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
            <div className="action-buttons">
              <button className="download-btn" onClick={handleDownload}>
                Download
              </button>
              <button className="add-btn" onClick={handleAdd}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="plus-icon"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add
              </button>
            </div>
          </div>
        </div>
        
        {/* ===================== FOOTER ===================== */}
        <Footer />
      </div>
      </div>

      {/* Step 1: Product Information Modal */}
      {modalStep === "info" && (
        <ProductModal onClose={handleCloseModal}>
          <ProductInfoForm
            onNext={handleNextStep}
            onClose={handleCloseModal}
          />
        </ProductModal>
      )}

      {/* Step 2: Upload Files Modal */}
      {modalStep === "upload" && (
        <ProductModal onClose={handleCloseModal}>
          <ProductUploadForm
            onClose={handleCloseModal}
            formData={productFormData}
            onSuccess={handleProductAdded}
          />
        </ProductModal>
      )}
    </div>
  );
}

export default Workplace;

