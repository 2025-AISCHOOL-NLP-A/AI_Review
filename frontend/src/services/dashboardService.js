import api from "./api";
import { processDashboardResponse } from "./dashboardResponseProcessor";
import { handleApiError, isAbortError, getErrorMessage } from "../utils/api/errorHandler";
import { createApiConfig, createApiConfigWithParams } from "../utils/api/apiHelpers";

const dashboardService = {
  /** 📊 대시보드 데이터 조회 및 처리 */
  async getDashboardData(productId = 1007, signal = null, productInfo = null) {
    try {
      const config = createApiConfig(signal);
      const url = `/products/${productId}/dashboard`;

      const res = await api.get(url, config);

      // API 응답 데이터 처리
      const processedData = processDashboardResponse({
        responseData: res.data,
        productInfo: productInfo,
      });

      if (!processedData) {
        return {
          success: false,
          message: "대시보드 데이터 처리에 실패했습니다.",
          status: 500,
        };
      }

      return { success: true, data: processedData };
    } catch (err) {
      // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
      if (isAbortError(err)) {
        throw err;
      }

      // 에러 로깅 (디버깅용)
      console.error("dashboardService.getDashboardData 에러:", {
        name: err.name,
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers,
        requestUrl: err.config?.url,
        requestMethod: err.config?.method,
        fullError: err,
      });

      // 응답 데이터의 상세 정보 출력
      if (err.response?.data) {
        console.error("❌ 서버 응답 데이터:", JSON.stringify(err.response.data, null, 2));
      }

      // 네트워크 요청 정보 출력 (브라우저 네트워크 탭에서 확인 가능)
      console.error("❌ 네트워크 요청 정보:", {
        requestUrl: err.config?.url,
        fullUrl: `${err.config?.baseURL || ""}${err.config?.url || ""}`,
        method: err.config?.method,
        requestHeaders: err.config?.headers,
        requestData: err.config?.data,
      });

      // 브라우저 개발자 도구 네트워크 탭 확인 안내
      console.error("💡 브라우저 개발자 도구(F12) > Network 탭에서 다음을 확인하세요:");
      console.error("   1. 요청이 전송되었는지");
      console.error("   2. 응답 상태 코드 (500)");
      console.error("   3. 응답 본문 (Response 탭)");
      console.error("   4. 요청 헤더 (Headers 탭)");

      // 404 에러 처리
      if (err.response?.status === 404) {
        const msg =
          err.response?.data?.message || "대시보드 데이터를 찾을 수 없습니다. 먼저 리뷰 분석을 실행해주세요.";
        return { success: false, message: msg, status: 404 };
      }

      // 500 에러 처리
      if (err.response?.status === 500) {
        const msg = err.response?.data?.message || "대시보드 조회 중 서버 오류가 발생했습니다.";
        return { success: false, message: msg, status: 500 };
      }

      const msg = getErrorMessage(err, "대시보드 데이터를 불러오는데 실패했습니다.");
      return { success: false, message: msg, status: err.response?.status };
    }
  },

  /** 📝 제품 리뷰 데이터 조회 */
  async getProductReviews(productId) {
    try {
      const res = await api.get(`/products/${productId}/reviews`);
      return { success: true, data: res.data };
    } catch (err) {
      return handleApiError(err, "제품 리뷰를 불러오는데 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "제품 리뷰를 불러오는데 실패했습니다."),
      };
    }
  },

  /** 🔍 제품 인사이트 데이터 조회 */
  async getProductInsights(productId) {
    try {
      const res = await api.get(`/products/${productId}/insights`);
      return { success: true, data: res.data };
    } catch (err) {
      return handleApiError(err, "제품 인사이트를 불러오는데 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "제품 인사이트를 불러오는데 실패했습니다."),
      };
    }
  },

  /** 📦 제품 목록 조회 */
  async getProducts(page = 1, limit = 10, search = "", categoryId = null, signal = null) {
    try {
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(categoryId && { category_id: categoryId }),
      };
      const config = createApiConfigWithParams(signal, params);
      const res = await api.get("/products", config);
      return { success: true, data: res.data };
    } catch (err) {
      if (isAbortError(err)) {
        throw err;
      }
      return handleApiError(err, "제품 목록을 불러오는데 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "제품 목록을 불러오는데 실패했습니다."),
      };
    }
  },

  /** 📦 제품 상세 조회 */
  async getProduct(productId, signal = null) {
    try {
      const config = createApiConfig(signal);
      const res = await api.get(`/products/${productId}`, config);
      return { success: true, data: res.data };
    } catch (err) {
      if (isAbortError(err)) {
        throw err;
      }
      return handleApiError(err, "제품을 불러오는데 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "제품을 불러오는데 실패했습니다."),
      };
    }
  },

  /** 🗑️ 제품 삭제 */
  async deleteProduct(productId) {
    try {
      const res = await api.delete(`/products/${productId}`);
      return { success: true, data: res.data };
    } catch (err) {
      return handleApiError(err, "제품 삭제에 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "제품 삭제에 실패했습니다."),
      };
    }
  },

  /** ➕ 제품 생성 */
  async createProduct(productData) {
    try {
      const res = await api.post("/products", productData);
      return { success: true, data: res.data };
    } catch (err) {
      return handleApiError(err, "제품 생성에 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "제품 생성에 실패했습니다."),
      };
    }
  },

  /** ✏️ 제품 정보 수정 */
  async updateProduct(productId, productData) {
    try {
      console.log("📤 제품 수정 API 호출:", `/products/${productId}`, productData);
      const res = await api.put(`/products/${productId}`, productData);
      console.log("📥 제품 수정 API 응답:", res.data);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("❌ 제품 수정 API 오류:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      return handleApiError(err, "제품 정보 수정에 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "제품 정보 수정에 실패했습니다."),
      };
    }
  },

  /** 🔬 제품 리뷰 분석 요청 */
  async requestReviewAnalysis(productId) {
    try {
      const res = await api.post(`/products/${productId}/reviews/analysis`);
      return { success: true, data: res.data };
    } catch (err) {
      return handleApiError(err, "리뷰 분석 요청에 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "리뷰 분석 요청에 실패했습니다."),
      };
    }
  },

  /** 📤 리뷰 파일 업로드 및 매핑 정보 전송 (SSE 방식 진행도 추적) */
  async uploadReviewFiles(productId, files, onProgress = null) {
    try {
      const formData = new FormData();
      
      // 각 파일과 매핑 정보를 FormData에 추가
      files.forEach((fileData) => {
        formData.append(`files`, fileData.file);
        formData.append(`mappings`, JSON.stringify({
          reviewColumn: fileData.mapping.reviewColumn,
          dateColumn: fileData.mapping.dateColumn,
          ratingColumn: fileData.mapping.ratingColumn || null,
        }));
      });

      // 파일 업로드 요청 (taskId 반환 가정)
      const res = await api.post(`/products/${productId}/reviews/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 1800000, // 30분 (파일 업로드 + 자동 분석 처리 시간 확보)
      });

      // SSE로 진행도 추적 시작
      const taskId = res.data?.taskId || res.data?.uploadId || res.data?.data?.taskId;
      if (taskId && onProgress) {
        await this.trackUploadProgress(productId, taskId, onProgress);
      }

      return { success: true, data: res.data };
    } catch (err) {
      return handleApiError(err, "파일 업로드에 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "파일 업로드에 실패했습니다."),
      };
    }
  },

  /** 📡 SSE를 통한 업로드 진행도 추적 */
  async trackUploadProgress(productId, taskId, onProgress) {
    return new Promise((resolve, reject) => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
      const token = localStorage.getItem("token");
      
      // SSE 엔드포인트 URL 구성
      const sseUrl = `${API_BASE_URL}/products/${productId}/reviews/upload/progress/${taskId}`;
      
      // EventSource 생성 (토큰은 쿼리 파라미터로 전달)
      const eventSource = new EventSource(`${sseUrl}?token=${encodeURIComponent(token || "")}`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.progress !== undefined) {
            // 진행도 업데이트
            onProgress(data.progress, data.message || null);
          }
          
          // 완료 또는 에러 처리
          if (data.status === "completed" || data.progress === 100) {
            eventSource.close();
            resolve(data);
          } else if (data.status === "error") {
            eventSource.close();
            reject(new Error(data.message || "업로드 진행도 추적 중 오류가 발생했습니다."));
          }
        } catch (parseError) {
          console.error("SSE 데이터 파싱 오류:", parseError);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error("SSE 연결 오류:", error);
        eventSource.close();
        // SSE 연결 실패해도 업로드는 계속 진행될 수 있으므로 resolve
        resolve({ progress: 100, message: "진행도 추적을 완료할 수 없습니다." });
      };
      
      // 타임아웃 설정 (30분)
      setTimeout(() => {
        if (eventSource.readyState !== EventSource.CLOSED) {
          eventSource.close();
          resolve({ progress: 100, message: "진행도 추적 시간이 초과되었습니다." });
        }
      }, 1800000);
    });
  },
};

export default dashboardService;