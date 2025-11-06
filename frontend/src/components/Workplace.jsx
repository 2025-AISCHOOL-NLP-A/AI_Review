import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import dashboardService from "../services/dashboardService";
import "../styles/dashboard.css";
import "../styles/sidebar.css";
import "../styles/workplace.css";

function Workplace() {
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [workplaceData, setWorkplaceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const productsPerPage = 10;

  // 제품 목록 가져오기
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const result = await dashboardService.getProducts(
        currentPage,
        productsPerPage,
        searchQuery,
        selectedCategoryFilter || null
      );
      
      if (result.success && result.data) {
        // 데이터 구조에 맞게 변환
        const products = Array.isArray(result.data) 
          ? result.data 
          : result.data.products || [];
        const total = result.data.total || products.length;
        
        setWorkplaceData(products);
        setTotalCount(total);
        setTotalPages(Math.ceil(total / productsPerPage));
      } else {
        console.error("제품 목록을 불러오는데 실패했습니다:", result.message);
        setWorkplaceData([]);
      }
    } catch (error) {
      console.error("제품 목록 조회 중 오류:", error);
      setWorkplaceData([]);
    } finally {
      setLoading(false);
    }
  };

  // 제품 목록 가져오기 (useEffect)
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, selectedCategoryFilter]);

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
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
    if (e.key === "Enter" || e.type === "click") {
      setCurrentPage(1);
      fetchProducts();
    }
  };

  // 다운로드 버튼 클릭
  const handleDownload = () => {
    console.log("Download clicked", selectedProducts);
    // 선택된 제품 다운로드 로직 구현
  };

  // 분석 버튼 클릭
  const handleAnalyze = () => {
    console.log("Analyze clicked");
    // 분석 페이지로 이동하거나 모달 열기
  };

  // 제품 삭제
  const handleDeleteProduct = async (productId) => {
    if (window.confirm("정말 이 제품을 삭제하시겠습니까?")) {
      const result = await dashboardService.deleteProduct(productId);
      if (result.success) {
        fetchProducts(); // 목록 새로고침
        setSelectedProducts(selectedProducts.filter(id => id !== productId));
      } else {
        alert(result.message || "제품 삭제에 실패했습니다.");
      }
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="dashboard-content">
        <div className="workplace-container">
          {/* Header Section */}
          <div className="workplace-header">
            <h1 className="workplace-title">Workplace</h1>
            <div className="workplace-filters">
              <div className="filter-dropdown">
                <select
                  className="product-filter"
                  value={selectedCategoryFilter}
                  onChange={(e) => {
                    setSelectedCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">전체 카테고리</option>
                  {/* TODO: 카테고리 목록을 API에서 가져와서 동적으로 표시 */}
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
                  className="search-input"
                  placeholder="제품명 또는 브랜드로 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                />
              </div>
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
                      checked={
                        workplaceData.length > 0 &&
                        selectedProducts.length === workplaceData.length
                      }
                      onChange={handleSelectAll}
                      disabled={loading || workplaceData.length === 0}
                    />
                  </th>
                  <th>등록일</th>
                  <th>제품명</th>
                  <th>브랜드</th>
                  <th className="action-column"></th>
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
                      등록된 제품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  workplaceData.map((item) => (
                    <tr key={item.product_id}>
                      <td className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(item.product_id)}
                          onChange={() => handleSelectItem(item.product_id)}
                        />
                      </td>
                      <td>{formatDate(item.registered_date)}</td>
                      <td className="product-cell">
                        <span>{item.product_name || "-"}</span>
                      </td>
                      <td>{item.brand || "-"}</td>
                      <td className="action-column">
                        <button
                          className="action-menu-btn"
                          onClick={() => handleDeleteProduct(item.product_id)}
                          title="삭제"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="action-icon"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
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
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <div className="page-numbers">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
            <div className="action-buttons">
              <button className="download-btn" onClick={handleDownload}>
                Download
              </button>
              <button className="analyze-btn" onClick={handleAnalyze}>
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
                Analyze
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Workplace;
