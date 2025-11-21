import { useState, useEffect } from "react";
import dashboardService from "../../services/dashboardService";

/**
 * 제품 데이터 페칭 커스텀 훅
 */
export function useProductData(refreshTrigger) {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return {
    allProducts,
    loading,
  };
}

