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
  const [allProducts, setAllProducts] = useState([]); // 전체 제품 데이터 (백엔드에서 받은 원본)
  const [workplaceData, setWorkplaceData] = useState([]); // 화면에 표시할 제품 데이터 (필터링/페이지네이션 적용)
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fetchInProgress = useRef(false);
  const [modalStep, setModalStep] = useState(null); // 'info' | 'upload' | null
  const [productFormData, setProductFormData] = useState(null);
  
  // 사이드바 상태를 localStorage에서 읽어오기
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? saved === "true" : true;
  });

  const productsPerPage = 10;

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

    // 초기 로드 시 localStorage에서 상태 확인
    const checkSidebarState = () => {
      const saved = localStorage.getItem("sidebarOpen");
      if (saved !== null) {
        setSidebarOpen(saved === "true");
      }
    };
    
    // 주기적으로 상태 확인 (같은 탭에서의 변경 감지)
    const interval = setInterval(checkSidebarState, 200);

    return () => {
      window.removeEventListener("sidebar-toggle", handleSidebarToggle);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 제품 목록 가져오기 (전체 데이터를 한 번만 가져옴)
  useEffect(() => {
    // 이미 요청이 진행 중이면 중복 요청 방지
    if (fetchInProgress.current) {
      console.log("이미 요청 진행 중, 중복 요청 방지");
      return;
    }

    const fetchProducts = async () => {
      fetchInProgress.current = true;
      console.log("제품 목록 조회 시작");

      setLoading(true);

      try {
        console.log("API 호출 시작...");
        // 백엔드에서 전체 데이터를 가져옴 (페이지네이션 파라미터는 무시)
        const result = await dashboardService.getProducts(1, 1000, "", null);
        console.log("API 호출 완료, 응답:", result);

        console.log("전체 API 응답:", result); // 디버깅용
        console.log("result 타입:", typeof result);
        console.log("result.success:", result?.success);
        console.log("result.data:", result?.data);

        // result가 있고 success가 false가 아니면 처리
        if (result && (result.success === true || result.data !== undefined || result.products !== undefined)) {
          // 백엔드 응답 구조에 맞게 변환
          let products = [];
          // result.data가 있으면 사용, 없으면 result 자체를 사용
          const responseData = result.data !== undefined ? result.data : result;

          console.log("응답 데이터:", responseData); // 디버깅용
          console.log("responseData 타입:", typeof responseData);
          console.log("responseData.products:", responseData?.products);

          // 백엔드가 { message: "...", products: [] } 형태로 보내는 경우
          if (responseData?.products && Array.isArray(responseData.products)) {
            products = responseData.products;
            console.log("✅ products 배열에서 데이터 추출 성공:", products.length, "개");
          }
          // 배열로 직접 반환하는 경우
          else if (Array.isArray(responseData)) {
            products = responseData;
            console.log("✅ 직접 배열로 반환된 데이터:", products.length, "개");
          }
          // { data: [] } 형태
          else if (responseData?.data && Array.isArray(responseData.data)) {
            products = responseData.data;
            console.log("✅ data 속성에서 배열 추출:", products.length, "개");
          }
          // 기타 객체 형태 - 모든 키를 확인
          else if (typeof responseData === 'object' && responseData !== null) {
            console.log("객체의 모든 키 확인 중...", Object.keys(responseData));
            // 객체의 모든 키를 확인하여 배열을 찾음
            for (const key in responseData) {
              if (Array.isArray(responseData[key])) {
                products = responseData[key];
                console.log(`✅ ${key} 키에서 배열 발견:`, products.length, "개");
                break;
              }
            }
          }

          console.log("최종 파싱된 제품 목록:", products); // 디버깅용
          console.log("제품 개수:", products.length); // 디버깅용

          // 전체 제품 데이터 저장 (빈 배열도 저장)
          if (Array.isArray(products)) {
            setAllProducts(products);
            console.log("✅ 제품 데이터 저장 완료:", products.length, "개");
          } else {
            console.warn("❌ 제품 목록이 배열이 아닙니다:", typeof products, products);
            setAllProducts([]);
          }
        } else {
          console.warn("❌ API 응답 실패 또는 데이터 없음:", result);
          console.warn("result 존재 여부:", !!result);
          console.warn("result.success:", result?.success);
          console.warn("result.data 존재 여부:", !!result?.data);
          setAllProducts([]);
        }
      } catch (error) {
        console.error("❌ 제품 목록 조회 중 오류:", error);
        console.error("오류 타입:", error.constructor.name);
        console.error("오류 메시지:", error.message);
        console.error("오류 상세:", error.response || error);
        if (error.response) {
          console.error("응답 상태:", error.response.status);
          console.error("응답 데이터:", error.response.data);
        }
        setAllProducts([]);
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
        console.log("로딩 완료, fetchInProgress 리셋");
      }
    };

    fetchProducts();

    // cleanup 함수는 필요 없음 - React가 자동으로 언마운트된 컴포넌트의 상태 업데이트를 무시함
    return () => {
      // 컴포넌트가 언마운트되면 진행 중인 요청을 취소할 수 있지만,
      // 이미 완료된 요청의 상태 업데이트는 React가 자동으로 무시함
      fetchInProgress.current = false;
    };
  }, [refreshTrigger]); // refreshTrigger만 의존성으로 설정

  // 카테고리 목록 추출 (중복 제거)
  const categories = React.useMemo(() => {
    const categorySet = new Set();
    allProducts.forEach((product) => {
      if (product.category_name) {
        categorySet.add(product.category_name);
      }
    });
    return Array.from(categorySet).sort();
  }, [allProducts]);

  // 검색어나 필터 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter]);

  // 클라이언트 사이드 필터링 및 페이지네이션
  useEffect(() => {
    console.log("필터링 시작 - allProducts 개수:", allProducts.length);
    console.log("검색어:", searchQuery);
    console.log("카테고리 필터:", selectedCategoryFilter);
    
    let filtered = [...allProducts];

    // 검색 필터 적용
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          (item.product_name && item.product_name.toLowerCase().includes(query)) ||
          (item.brand && item.brand.toLowerCase().includes(query))
      );
      console.log("검색 필터 적용 후:", filtered.length, "개");
    }

    // 카테고리 필터 적용
    if (selectedCategoryFilter) {
      filtered = filtered.filter(
        (item) => item.category_name === selectedCategoryFilter
      );
      console.log("카테고리 필터 적용 후:", filtered.length, "개");
    }

    // 전체 개수 설정
    const total = filtered.length;
    setTotalCount(total);
    setTotalPages(Math.ceil(total / productsPerPage));

    // 페이지네이션 적용
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedData = filtered.slice(startIndex, endIndex);

    console.log("최종 표시할 데이터:", paginatedData.length, "개 (페이지:", currentPage, "/", Math.ceil(total / productsPerPage), ")");
    setWorkplaceData(paginatedData);
  }, [allProducts, currentPage, searchQuery, selectedCategoryFilter, productsPerPage]);

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

  // 제품 삭제
  const handleDeleteProduct = async (productId) => {
    if (window.confirm("정말 이 제품을 삭제하시겠습니까?")) {
      const result = await dashboardService.deleteProduct(productId);
      if (result.success) {
        // 선택된 제품 목록에서 제거
        setSelectedProducts(selectedProducts.filter(id => id !== productId));
        // refreshTrigger를 변경하여 useEffect가 다시 실행되도록 함
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(result.message || "제품 삭제에 실패했습니다.");
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
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
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
                    <tr key={item.product_id}>
                      <td className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(item.product_id)}
                          onChange={() => handleSelectItem(item.product_id)}
                        />
                      </td>
                      <td>{formatDate(item)}</td>
                      <td className="product-cell">
                        <span>{item.product_name || "-"}</span>
                      </td>
                      <td>{item.brand && item.brand.trim() !== "" ? item.brand : "-"}</td>
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
          />
        </ProductModal>
      )}
    </div>
  );
}

export default Workplace;

