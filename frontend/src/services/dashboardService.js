import api from "./api";

const dashboardService = {
  /** 📊 대시보드 데이터 조회 (레거시 - 호환성 유지) */
  async getDashboardData(productId = 1007) {
    try {
      // 새로운 API를 사용하여 데이터 조합
      const [reviewsResult, insightsResult] = await Promise.all([
        this.getProductReviews(productId),
        this.getProductInsights(productId),
      ]);

      if (!reviewsResult.success || !insightsResult.success) {
        return {
          success: false,
          message: reviewsResult.message || insightsResult.message || "데이터를 불러오는데 실패했습니다.",
        };
      }

      // 기존 데이터 구조에 맞게 변환
      const combinedData = {
        reviews: reviewsResult.data?.reviews || reviewsResult.data || [],
        insights: insightsResult.data?.insights || insightsResult.data || [],
        analysis: insightsResult.data?.analysis || {},
        stats: insightsResult.data?.stats || {},
        dailyTrend: insightsResult.data?.dailyTrend || [],
        keywords: insightsResult.data?.keywords || [],
        insight: insightsResult.data?.insight || insightsResult.data || {},
      };

      return { success: true, data: combinedData };
    } catch (err) {
      console.error("대시보드 데이터 조회 오류:", err);
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
      console.error("제품 리뷰 조회 오류:", err);
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
      console.error("제품 인사이트 조회 오류:", err);
      const msg = err.response?.data?.message || "제품 인사이트를 불러오는데 실패했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 📦 제품 목록 조회 */
  async getProducts(page = 1, limit = 10, search = "", categoryId = null) {
    try {
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(categoryId && { category_id: categoryId }),
      };
      const res = await api.get("/products", { params });
      return { success: true, data: res.data };
    } catch (err) {
      console.error("제품 목록 조회 오류:", err);
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
      console.error("제품 조회 오류:", err);
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
      console.error("제품 삭제 오류:", err);
      const msg = err.response?.data?.message || "제품 삭제에 실패했습니다.";
      return { success: false, message: msg };
    }
  },
};

export default dashboardService;