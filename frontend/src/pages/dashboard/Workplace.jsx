import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/sidebar/Sidebar";
import Footer from "../../components/layout/Footer/Footer";
import dashboardService from "../../services/dashboardService";
import ProductModal from "../../components/product/ProductModal";
import ProductInfoForm from "../../components/product/ProductInfoForm";
import ProductUploadForm from "../../components/product/ProductUploadForm";
import AddReviewForm from "../../components/product/AddReviewForm";
import ProductFilterBar from "../../components/workplace/ProductFilterBar";
import ProductListTable from "../../components/workplace/ProductListTable";
import ProductPagination from "../../components/workplace/ProductPagination";
import { useProductFilter } from "../../hooks/useProductFilter";
import { useProductSort } from "../../hooks/useProductSort";
import { getTodayDate, formatDateToYYYYMMDD } from "../../utils/format/dateUtils";
import { useSidebar } from "../../hooks/useSidebar";
import { CATEGORY_NAMES } from "../../constants";
import { sanitizeInput } from "../../utils/format/inputSanitizer";
import "../../styles/common.css";
import "../../styles/modal.css";
import "./dashboard.css";
import "../../components/layout/sidebar/sidebar.css";
import "./workplace.css";

function Workplace() {
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allProducts, setAllProducts] = useState([]); // 전체 제품 데이터 (백엔드에서 받은 원본)
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [modalStep, setModalStep] = useState(null); // 'info' | 'upload' | 'edit' | 'addReview' | null
  const [productFormData, setProductFormData] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null); // 수정/추가 리뷰용 선택된 제품
  const [openMenuIndex, setOpenMenuIndex] = useState(null); // 열린 메뉴의 인덱스
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 }); // 드롭다운 위치
  const menuRefs = useRef({}); // 각 메뉴의 ref를 저장
  const dropdownRef = useRef(null); // 드롭다운 메뉴 ref
  const [isUploading, setIsUploading] = useState(false); // 업로드 중 상태

  const productsPerPage = 10;

  // 정렬 훅 사용
  const { sortField, sortDirection, handleSort } = useProductSort();

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
  
  // 사이드바 상태 관리 (커스텀 훅 사용)
  const sidebarOpen = useSidebar();

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


  // 드롭다운 위치 계산
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (openMenuIndex !== null) {
        const menuElement = menuRefs.current[openMenuIndex];
        if (menuElement) {
          const rect = menuElement.getBoundingClientRect();
          const dropdownHeight = 120; // 대략적인 드롭다운 높이
          const dropdownWidth = 140; // 드롭다운 너비
          
          // 화면 하단에 가까우면 위로, 아니면 아래로
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          
          let top, right;
          
          if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
            // 위로 표시
            top = Math.max(4, rect.top - dropdownHeight - 4);
          } else {
            // 아래로 표시
            top = Math.min(rect.bottom + 4, window.innerHeight - dropdownHeight - 4);
          }
          
          // 오른쪽 정렬, 화면 밖으로 나가지 않도록
          right = Math.max(4, window.innerWidth - rect.right);
          // 왼쪽으로 넘어가지 않도록
          if (rect.right - dropdownWidth < 0) {
            right = window.innerWidth - rect.left;
          }
          
          setDropdownPosition({ top, right });
        }
      }
    };

    if (openMenuIndex !== null) {
      updateDropdownPosition();
      
      // 스크롤 및 리사이즈 시 위치 업데이트
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [openMenuIndex, workplaceData]);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const mouseDownRef = { current: null };

    const handleMouseDown = (e) => {
      if (openMenuIndex !== null) {
        const menuElement = menuRefs.current[openMenuIndex];
        const dropdownElement = dropdownRef.current;
        if (menuElement && dropdownElement) {
          // 메뉴 버튼이나 드롭다운 내부가 아닌 경우 mousedown 위치 저장
          if (!menuElement.contains(e.target) && !dropdownElement.contains(e.target)) {
            mouseDownRef.current = { target: e.target, time: Date.now() };
          } else {
            mouseDownRef.current = null;
          }
        }
      }
    };

    const handleMouseUp = (e) => {
      if (openMenuIndex !== null) {
        // 텍스트 선택이 완료되었는지 확인
        const selection = window.getSelection();
        const hasSelection = selection && selection.toString().length > 0;
        
        // 텍스트가 선택된 경우 메뉴를 닫지 않음
        if (hasSelection) {
          mouseDownRef.current = null;
          return;
        }

        const menuElement = menuRefs.current[openMenuIndex];
        const dropdownElement = dropdownRef.current;
        if (menuElement && dropdownElement) {
          // 메뉴 외부에서 mousedown이 시작되고 mouseup이 발생한 경우에만 메뉴 닫기
          if (
            mouseDownRef.current &&
            !menuElement.contains(e.target) &&
            !dropdownElement.contains(e.target)
          ) {
            // 클릭 시간이 짧은 경우에만 메뉴 닫기 (드래그와 구분)
            const clickDuration = Date.now() - mouseDownRef.current.time;
            if (clickDuration < 300) {
              setOpenMenuIndex(null);
            }
          }
        }
      }

      mouseDownRef.current = null;
    };

    if (openMenuIndex !== null) {
      document.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [openMenuIndex]);

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

  // 정렬 변경 시 페이지 초기화
  const handleSortWithPageReset = (field) => {
    handleSort(field);
    setCurrentPage(1);
  };

  // 카테고리 ID를 이름으로 변환 (상수 사용)
  const getCategoryName = (categoryId) => {
    return CATEGORY_NAMES[categoryId] || (categoryId ? `카테고리 ${categoryId}` : '-');
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

  // 다운로드 버튼 클릭 - 각 제품의 대시보드 PDF 다운로드
  const handleDownload = async () => {
    if (selectedProducts.length === 0) {
      alert("다운로드할 제품을 선택해주세요.");
      return;
    }

    if (!window.confirm(`선택한 ${selectedProducts.length}개 제품의 대시보드 PDF를 다운로드하시겠습니까?\n\n각 제품의 대시보드 페이지가 새 창으로 열리고 PDF가 자동으로 다운로드됩니다.`)) {
      return;
    }

    setLoading(true);
    
    try {
      // 각 제품에 대해 순차적으로 대시보드 PDF 다운로드
      for (let i = 0; i < selectedProducts.length; i++) {
        const productId = selectedProducts[i];
        
        // 제품 정보 찾기
        const product = allProducts.find(p => p.product_id === productId);
        const productName = product?.product_name || `제품_${productId}`;
        
        // 대시보드 페이지를 새 창으로 열기
        const dashboardUrl = `${window.location.origin}/dashboard?productId=${productId}`;
        const newWindow = window.open(dashboardUrl, `dashboard_${productId}`, 'width=1400,height=800');
        
        if (!newWindow) {
          alert(`${productName}의 대시보드 창을 열 수 없습니다. 팝업 차단을 해제해주세요.`);
          continue;
        }
        
        // 새 창이 로드되고 대시보드가 완전히 렌더링될 때까지 대기
        await new Promise((resolve) => {
          let checkCount = 0;
          const maxChecks = 100; // 최대 10초 대기
          
          const checkLoad = setInterval(() => {
            checkCount++;
            
            try {
              // 새 창이 닫혔는지 확인
              if (newWindow.closed) {
                clearInterval(checkLoad);
                resolve();
                return;
              }
              
              // 대시보드 컨텐츠가 로드되었는지 확인
              const dashboardContent = newWindow.document.getElementById('dashboard-content');
              const downloadBtn = newWindow.document.querySelector('button[ref]');
              
              if (dashboardContent && downloadBtn && newWindow.document.readyState === 'complete') {
                clearInterval(checkLoad);
                
                // 차트가 렌더링될 때까지 추가 대기
                setTimeout(() => {
                  // PDF 다운로드 버튼 클릭
                  try {
                    downloadBtn.click();
                    
                    // PDF 다운로드가 시작될 때까지 대기 후 창 닫기
                    setTimeout(() => {
                      if (!newWindow.closed) {
                        newWindow.close();
                      }
                      resolve();
                    }, 3000);
                  } catch (err) {
                    console.error('PDF 다운로드 버튼 클릭 오류:', err);
                    if (!newWindow.closed) {
                      newWindow.close();
                    }
                    resolve();
                  }
                }, 3000); // 차트 렌더링을 위한 3초 대기
              } else if (checkCount >= maxChecks) {
                // 최대 대기 시간 초과
                clearInterval(checkLoad);
                alert(`${productName}의 대시보드 로딩이 시간 초과되었습니다.`);
                if (!newWindow.closed) {
                  newWindow.close();
                }
                resolve();
              }
            } catch (err) {
              // 크로스 오리진 오류 등 처리
              if (checkCount >= maxChecks) {
                clearInterval(checkLoad);
                console.error('대시보드 로딩 확인 오류:', err);
                resolve();
              }
            }
          }, 100); // 100ms마다 확인
        });
        
        // 다음 제품 다운로드 전에 잠시 대기 (브라우저가 파일 다운로드를 처리할 시간)
        if (i < selectedProducts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      alert(`선택한 ${selectedProducts.length}개 제품의 대시보드 PDF 다운로드가 완료되었습니다.`);
    } catch (error) {
      console.error("PDF 다운로드 중 오류:", error);
      alert("PDF 다운로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
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
    setSelectedItem(null);
    setIsUploading(false); // 업로드 상태 초기화
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

  // Edit 버튼 클릭 - 수정 모드로 ProductInfoForm 열기
  const handleEdit = (item) => {
    setSelectedItem(item);
    setModalStep("edit");
    setOpenMenuIndex(null); // 메뉴 닫기
  };

  // Add Review 버튼 클릭 - Add Review 모달 열기
  const handleAddReview = (item) => {
    setSelectedItem(item);
    setModalStep("addReview");
    setOpenMenuIndex(null); // 메뉴 닫기
  };

  // Add Review 완료 후 콜백
  const handleAddReviewSuccess = () => {
    setModalStep(null);
    setSelectedItem(null);
    setRefreshTrigger(prev => prev + 1); // 목록 새로고침
  };

  // Delete 버튼 클릭 - 제품 삭제
  const handleDelete = async (productId) => {
    setOpenMenuIndex(null); // 메뉴 닫기
    
    if (window.confirm("정말 삭제하시겠습니까?")) {
      setLoading(true);
      try {
        const result = await dashboardService.deleteProduct(productId);
        if (result.success) {
          // 제품 목록 새로고침
          setRefreshTrigger(prev => prev + 1);
        } else {
          alert(result.message || "제품 삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("제품 삭제 중 오류:", error);
        alert("제품 삭제 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
  };

  // 제품 수정 저장
  const handleSaveEdit = async (formData) => {
    if (!selectedItem) {
      console.error("❌ selectedItem이 없습니다.");
      return;
    }

    console.log("📝 제품 수정 시작:", {
      product_id: selectedItem.product_id,
      formData: formData
    });

    setLoading(true);
    try {
      const result = await dashboardService.updateProduct(selectedItem.product_id, {
        product_name: formData.productName,
        brand: formData.brand || null,
        category_id: parseInt(formData.category, 10),
      });
      
      console.log("📝 제품 수정 결과:", result);
      
      if (result.success) {
        alert("제품 정보가 수정되었습니다.");
        handleCloseModal();
        setRefreshTrigger(prev => prev + 1);
      } else {
        console.error("❌ 제품 수정 실패:", result.message);
        alert(result.message || "제품 정보 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ 제품 수정 중 오류:", error);
      console.error("❌ 에러 상세:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert(`제품 수정 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
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
            onClearDateFilter={() => {
              // 초기화 시 최솟값과 최댓값으로 재설정
              if (minRegisteredDate && maxRegisteredDate) {
                setStartDate(minRegisteredDate);
                setEndDate(maxRegisteredDate);
              } else {
                setStartDate("");
                setEndDate("");
              }
            }}
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
                onClick={handleDeleteSelected}
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
            onSave={handleSaveEdit}
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

