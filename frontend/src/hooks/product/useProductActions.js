import { useNavigate } from "react-router-dom";
import dashboardService from "../../services/dashboardService";

/**
 * 제품 액션 핸들러들 커스텀 훅
 */
export function useProductActions(
  allProducts,
  selectedProducts,
  setSelectedProducts,
  setLoading,
  setRefreshTrigger,
  setCurrentPage,
  handleCloseModal,
  setOpenMenuIndex
) {
  const navigate = useNavigate();

  // 제품 추가 성공 시 호출되는 콜백
  const handleProductAdded = () => {
    handleCloseModal();
    setCurrentPage(1);
    setRefreshTrigger(prev => prev + 1);
  };

  // Add Review 완료 후 콜백
  const handleAddReviewSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // 다운로드 버튼 클릭 - 각 제품의 대시보드 PDF 다운로드
  const handleDownload = async () => {
    if (selectedProducts.length === 0) {
      alert("다운로드할 제품을 선택해주세요.");
      return;
    }

    if (!window.confirm(`선택한 ${selectedProducts.length}개 제품의 대시보드 PDF를 다운로드하시겠습니까?\n\n각 제품의 대시보드 페이지가 백그라운드에서 열리고 PDF가 자동으로 다운로드됩니다.`)) {
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
        
        console.log(`[${i + 1}/${selectedProducts.length}] ${productName} 다운로드 중...`);
        
        // 대시보드 페이지를 새 창으로 열기 (백그라운드에서 처리)
        const dashboardUrl = `${window.location.origin}/dashboard?productId=${productId}`;
        const newWindow = window.open(dashboardUrl, `dashboard_${productId}`, 'width=1400,height=800');
        
        if (!newWindow) {
          alert(`[${i + 1}/${selectedProducts.length}] ${productName}의 대시보드 창을 열 수 없습니다. 팝업 차단을 해제해주세요.`);
          continue;
        }
        
        // 새 창이 로드되고 대시보드가 완전히 렌더링될 때까지 대기
        await new Promise((resolve, reject) => {
          let checkCount = 0;
          const maxChecks = 150; // 최대 15초 대기
          let downloadBtn = null;
          let contentLoaded = false;
          
          const checkLoad = setInterval(() => {
            checkCount++;
            
            try {
              // 새 창이 닫혔는지 확인
              if (newWindow.closed) {
                clearInterval(checkLoad);
                resolve();
                return;
              }
              
              // 새 창의 document가 준비되었는지 확인
              if (!newWindow.document || newWindow.document.readyState !== 'complete') {
                return; // 아직 로딩 중이면 다음 체크로
              }
              
              // 대시보드 컨텐츠가 로드되었는지 확인 (한 번만 체크)
              if (!contentLoaded) {
                const dashboardContent = newWindow.document.getElementById('dashboard-content');
                if (dashboardContent) {
                  contentLoaded = true;
                }
              }
              
              // PDF 다운로드 버튼 찾기 (한 번만 찾기)
              if (!downloadBtn && contentLoaded) {
                // data-pdf-download 속성으로 먼저 찾기
                downloadBtn = newWindow.document.querySelector('button[data-pdf-download="true"]');
                
                // 없으면 텍스트 내용으로 찾기
                if (!downloadBtn) {
                  const buttons = newWindow.document.querySelectorAll('button');
                  for (const btn of buttons) {
                    const btnText = btn.textContent?.trim() || '';
                    if (btnText.includes('리포트 PDF 다운로드') || btnText.includes('PDF 다운로드')) {
                      downloadBtn = btn;
                      break;
                    }
                  }
                }
              }
              
              // 모든 조건이 만족되면 다운로드 실행
              if (contentLoaded && downloadBtn) {
                clearInterval(checkLoad);
                
                // 차트가 렌더링될 때까지 대기
                setTimeout(() => {
                  // PDF 다운로드 버튼 클릭
                  try {
                    // 버튼을 다시 찾아서 최신 상태 확인
                    let currentBtn = newWindow.document.querySelector('button[data-pdf-download="true"]');
                    if (!currentBtn) {
                      const buttons = newWindow.document.querySelectorAll('button');
                      for (const btn of buttons) {
                        const btnText = btn.textContent?.trim() || '';
                        if (btnText.includes('리포트 PDF 다운로드') || btnText.includes('PDF 다운로드')) {
                          currentBtn = btn;
                          break;
                        }
                      }
                    }
                    
                    if (currentBtn && currentBtn.parentElement && !currentBtn.disabled) {
                      // 버튼 클릭
                      currentBtn.click();
                      console.log(`[${i + 1}/${selectedProducts.length}] ${productName} PDF 다운로드 시작`);
                      
                      // PDF 다운로드가 시작될 때까지 대기 후 창 닫기
                      setTimeout(() => {
                        if (!newWindow.closed) {
                          newWindow.close();
                        }
                        console.log(`[${i + 1}/${selectedProducts.length}] ${productName} 다운로드 완료!`);
                        resolve();
                      }, 4000); // 다운로드 대기 시간 (4초)
                    } else {
                      console.warn(`${productName}: PDF 다운로드 버튼을 찾을 수 없거나 비활성화되었습니다.`);
                      if (!newWindow.closed) {
                        newWindow.close();
                      }
                      resolve();
                    }
                  } catch (err) {
                    console.error(`${productName} PDF 다운로드 버튼 클릭 오류:`, err);
                    if (!newWindow.closed) {
                      newWindow.close();
                    }
                    resolve();
                  }
                }, 4000); // 차트 렌더링을 위한 대기 시간 (4초)
              } else if (checkCount >= maxChecks) {
                // 최대 대기 시간 초과
                clearInterval(checkLoad);
                console.warn(`${productName}의 대시보드 로딩이 시간 초과되었습니다.`);
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
                console.error(`${productName} 대시보드 로딩 확인 오류:`, err);
                if (!newWindow.closed) {
                  newWindow.close();
                }
                resolve();
              }
            }
          }, 100); // 100ms마다 확인
        });
        
        // 다음 제품 다운로드 전에 잠시 대기
        if (i < selectedProducts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      // 전체 다운로드 완료 알림
      alert(`✅ 모든 다운로드가 완료되었습니다!\n\n총 ${selectedProducts.length}개 제품의 PDF가 다운로드되었습니다.`);
    } catch (error) {
      console.error("PDF 다운로드 중 오류:", error);
      alert("PDF 다운로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Delete 버튼 클릭 - 제품 삭제
  const handleDelete = async (productId) => {
    setOpenMenuIndex(null); // 메뉴 닫기
    
    if (window.confirm("정말 삭제하시겠습니까?")) {
      setLoading(true);
      try {
        const result = await dashboardService.deleteProduct(productId);
        if (result.success) {
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
  const handleSaveEdit = async (formData, selectedItem) => {
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
          setRefreshTrigger(prev => prev + 1);
        } else {
          alert("일부 제품 삭제에 실패했습니다.");
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

  return {
    handleProductAdded,
    handleAddReviewSuccess,
    handleDownload,
    handleDelete,
    handleSaveEdit,
    handleDeleteSelected,
  };
}

