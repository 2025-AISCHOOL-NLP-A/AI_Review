import api from "./api";

const dashboardService = {
  /** 📊 대시보드 데이터 조회 */
  async getDashboardData(productId = 1007) { // 기본값 1001
    try {
      const res = await api.get(`/products/${productId}/dashboard`); // 쿼리 파라미터 "/dashboard/data", { params: { productId } }에서 변경
      return { success: true, data: res.data };
    } catch (err) {
      console.error("대시보드 데이터 조회 오류:", err);
      const msg = err.response?.data?.message || "대시보드 데이터를 불러오는데 실패했습니다.";
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