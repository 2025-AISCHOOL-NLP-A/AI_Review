import React, { useState } from "react";
import Sidebar from "../../components/layout/sidebar/Sidebar";
import Footer from "../../components/layout/Footer/Footer";
import ProductModal from "../../components/product/ProductModal";
import ProductInfoForm from "../../components/product/ProductInfoForm";
import ProductUploadForm from "../../components/product/ProductUploadForm";
import AddReviewForm from "../../components/product/AddReviewForm";
import ProductFilterBar from "../../components/workplace/ProductFilterBar";
import ProductListTable from "../../components/workplace/ProductListTable";
import ProductPagination from "../../components/workplace/ProductPagination";
import { useProductFilter } from "../../hooks/product/useProductFilter";
import { useProductSort } from "../../hooks/product/useProductSort";
import { useProductData } from "../../hooks/product/useProductData";
import { useProductModal } from "../../hooks/product/useProductModal";
import { useProductActions } from "../../hooks/product/useProductActions";
import { useDropdownMenu } from "../../hooks/product/useDropdownMenu";
import { useDateFilter } from "../../hooks/product/useDateFilter";
import { useSidebar } from "../../hooks/ui/useSidebar";
import { getTodayDate } from "../../utils/format/dateUtils";
import { CATEGORY_NAMES } from "../../constants";
import { sanitizeInput } from "../../utils/format/inputSanitizer";
import "../../styles/common.css";
import "../../styles/modal.css";
import "./dashboard.css";
import "../../components/layout/sidebar/sidebar.css";
import "./workplace.css";

function Workplace() {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [actionLoading, setActionLoading] = useState(false); // 액션 수행 중 로딩 상태

  const productsPerPage = 10;

  // 정렬 훅 사용
  const { sortField, sortDirection, handleSort } = useProductSort();

  // 제품 데이터 페칭
  const { allProducts, loading: dataLoading } = useProductData(refreshTrigger);
  
  // 전체 로딩 상태 (데이터 로딩 또는 액션 로딩)
  const loading = dataLoading || actionLoading;

  // 날짜 필터링
  const {
    startDate,
    endDate,
    minRegisteredDate,
    maxRegisteredDate,
    handleStartDateChange,
    handleEndDateChange,
    handleClearDateFilter,
  } = useDateFilter(allProducts);

  // 필터링 및 페이지네이션 훅 사용
  const {
    workplaceData,
    currentPage,
    totalPages,
    totalCount,
    categories,
    handlePageChange,
    setCurrentPage,
  } = useProductFilter(
    allProducts,
    searchQuery,
    selectedCategoryFilter,
    startDate,
    endDate,
    sortField,
    sortDirection,
    productsPerPage
  );

  // 사이드바 상태 관리
  const sidebarOpen = useSidebar();

  // 드롭다운 메뉴 관리
  const {
    openMenuIndex,
    setOpenMenuIndex,
    dropdownPosition,
    menuRefs,
    dropdownRef,
  } = useDropdownMenu(workplaceData);

  // 모달 관리
  const {
    modalStep,
    productFormData,
    selectedItem,
    isUploading,
    setIsUploading,
    handleCloseModal,
    handleAdd,
    handleNextStep,
    handleEdit: handleEditModal,
    handleAddReview: handleAddReviewModal,
  } = useProductModal();

  // 제품 액션 핸들러들
  const {
    handleProductAdded,
    handleAddReviewSuccess,
    handleDownload,
    handleDelete,
    handleSaveEdit,
    handleDeleteSelected,
  } = useProductActions(
    allProducts,
    selectedProducts,
    setSelectedProducts,
    setActionLoading,
    setRefreshTrigger,
    setCurrentPage,
    handleCloseModal,
    setOpenMenuIndex
  );

  // 정렬 변경 시 페이지 초기화
  const handleSortWithPageReset = (field) => {
    handleSort(field);
    setCurrentPage(1);
  };

  // 카테고리 ID를 이름으로 변환
  const getCategoryName = (categoryId) => {
    return CATEGORY_NAMES[categoryId] || (categoryId ? `카테고리 ${categoryId}` : '-');
  };

  // 날짜 포맷팅
  const formatDate = (item) => {
    const dateString = item.registered_date || item.updated_at || item.created_at;
    
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
  const handlePageChangeWithReset = (page) => {
    handlePageChange(page);
    setSelectedProducts([]); // 페이지 변경 시 선택 초기화
  };

  // 검색 처리
  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
    }
  };

  // Edit 버튼 클릭 - 수정 모드로 ProductInfoForm 열기
  const handleEdit = (item) => {
    handleEditModal(item);
    setOpenMenuIndex(null); // 메뉴 닫기
  };

  // Add Review 버튼 클릭 - Add Review 모달 열기
  const handleAddReview = (item) => {
    handleAddReviewModal(item);
    setOpenMenuIndex(null); // 메뉴 닫기
  };

  // 제품 수정 저장 (selectedItem 전달)
  const handleSaveEditWithItem = async (formData) => {
    await handleSaveEdit(formData, selectedItem);
  };

  // 선택된 제품들 삭제 (loading 체크 포함)
  const handleDeleteSelectedWithCheck = async () => {
    if (loading) {
      return;
    }
    await handleDeleteSelected();
  };

  return (
    <div className={`dashboard-page ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar />
      <div className="dashboard-wrapper">
        <div className="dashboard-inner mx-auto max-w-[1400px] px-6">
          <div className="dashboard-content">
          <div className="workplace-container">
          {/* Header Section */}
          <div className="workplace-header">
            <h1 className="workplace-title">Workplace</h1>
          </div>

          {/* Filters Section */}
          <ProductFilterBar
            searchQuery={searchQuery}
            onSearchChange={(e) => {
              // 검색 쿼리 sanitization (스페이스바 허용을 위해 trim 비활성화)
              const sanitizedValue = sanitizeInput(e.target.value, { type: 'text', maxLength: 100, trim: false });
              setSearchQuery(sanitizedValue);
            }}
            onSearchKeyDown={handleSearch}
            selectedCategoryFilter={selectedCategoryFilter}
            onCategoryFilterChange={(value) => {
              setSelectedCategoryFilter(value);
              setCurrentPage(1);
            }}
            categories={categories}
            getCategoryName={getCategoryName}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onClearDateFilter={handleClearDateFilter}
            getTodayDate={getTodayDate}
            minRegisteredDate={minRegisteredDate}
            maxRegisteredDate={maxRegisteredDate}
          />

          {/* Table Section */}
          <ProductListTable
            workplaceData={workplaceData}
            loading={loading}
            selectedProducts={selectedProducts}
            onSelectAll={handleSelectAll}
            onSelectItem={handleSelectItem}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSortWithPageReset}
            formatDate={formatDate}
            getCategoryName={getCategoryName}
            openMenuIndex={openMenuIndex}
            onMenuToggle={setOpenMenuIndex}
            dropdownPosition={dropdownPosition}
            menuRefs={menuRefs}
            onEdit={handleEdit}
            onAddReview={handleAddReview}
            onDelete={handleDelete}
          />

          {/* Footer Section */}
          <div className="workplace-footer">
            <ProductPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChangeWithReset}
            />
            <div className="action-buttons">
              <button 
                className="download-btn" 
                onClick={handleDownload}
                disabled={selectedProducts.length === 0 || loading}
                title={selectedProducts.length === 0 ? "다운로드할 제품을 선택해주세요" : `선택한 ${selectedProducts.length}개 제품 다운로드`}
              >
                Download
              </button>
              <button 
                className="delete-btn" 
                onClick={handleDeleteSelectedWithCheck}
                disabled={selectedProducts.length === 0 || loading}
                title={selectedProducts.length === 0 ? "삭제할 제품을 선택해주세요" : `선택한 ${selectedProducts.length}개 제품 삭제`}
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
        <ProductModal onClose={handleCloseModal} disabled={isUploading}>
          <ProductUploadForm
            onClose={handleCloseModal}
            formData={productFormData}
            onSuccess={handleProductAdded}
            onSubmittingChange={setIsUploading}
          />
        </ProductModal>
      )}

      {/* Edit Modal */}
      {modalStep === "edit" && selectedItem && (
        <ProductModal onClose={handleCloseModal}>
          <ProductInfoForm
            isEditMode={true}
            initialData={selectedItem}
            onSave={handleSaveEditWithItem}
            onClose={handleCloseModal}
          />
        </ProductModal>
      )}

      {/* Add Review Modal */}
      {modalStep === "addReview" && selectedItem && (
        <ProductModal onClose={handleCloseModal} disabled={isUploading}>
          <AddReviewForm
            onClose={handleCloseModal}
            productId={selectedItem.product_id}
            onSuccess={handleAddReviewSuccess}
            onSubmittingChange={setIsUploading}
          />
        </ProductModal>
      )}
    </div>
  );
}

export default Workplace;
