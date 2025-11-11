import api from "./api";

const dashboardService = {
  /** 📊 대시보드 데이터 조회 */
  async getDashboardData(productId = 1007, signal = null) {
    try {
      const config = signal ? { signal } : {};
      const res = await api.get(`/products/${productId}/dashboard`, config);
      return { success: true, data: res.data };
    } catch (err) {
      // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
      if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        throw err;
      }
      
      // 404 에러 처리
      if (err.response?.status === 404) {
        const msg = err.response?.data?.message || "대시보드 데이터를 찾을 수 없습니다. 먼저 리뷰 분석을 실행해주세요.";
        return { success: false, message: msg, status: 404 };
      }
      
      const msg = err.response?.data?.message || "대시보드 데이터를 불러오는데 실패했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 📝 제품 리뷰 데이터 조회 */
  async getProductReviews(productId) {
    try {
      const res = await api.get(`/products/${productId}/reviews`);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || "제품 리뷰를 불러오는데 실패했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 🔍 제품 인사이트 데이터 조회 */
  async getProductInsights(productId) {
    try {
      const res = await api.get(`/products/${productId}/insights`);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || "제품 인사이트를 불러오는데 실패했습니다.";
      return { success: false, message: msg };
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
      const config = signal ? { params, signal } : { params };
      const res = await api.get("/products", config);
      return { success: true, data: res.data };
    } catch (err) {
      // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
      if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        throw err;
      }
      const msg = err.response?.data?.message || "제품 목록을 불러오는데 실패했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 📦 제품 상세 조회 */
  async getProduct(productId) {
    try {
      const res = await api.get(`/products/${productId}`);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || "제품을 불러오는데 실패했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 🗑️ 제품 삭제 */
  async deleteProduct(productId) {
    try {
      const res = await api.delete(`/products/${productId}`);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || "제품 삭제에 실패했습니다.";
      return { success: false, message: msg };
    }
  },

  /** ➕ 제품 생성 */
  async createProduct(productData) {
    try {
      const res = await api.post("/products", productData);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || "제품 생성에 실패했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 🔬 제품 리뷰 분석 요청 */
  async requestReviewAnalysis(productId) {
    try {
      const res = await api.post(`/products/${productId}/reviews/analysis`);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || "리뷰 분석 요청에 실패했습니다.";
      return { success: false, message: msg };
    }
  },
};

export default dashboardService;