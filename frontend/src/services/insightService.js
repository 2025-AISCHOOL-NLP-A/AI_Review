import api from "./api";

const insightService = {
  /** 📊 인사이트 목록 조회 */
  async getInsights(productId = null, signal = null) {
    try {
      const params = {};
      if (productId) {
        params.product_id = productId;
      }
      const config = signal ? { params, signal } : { params };
      const res = await api.get("/insights", config);
      return { success: true, data: res.data };
    } catch (err) {
      // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
      if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        throw err;
      }
      const msg = err.response?.data?.message || "인사이트 목록을 불러오는데 실패했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 📄 인사이트 상세 조회 */
  async getInsight(insightId, signal = null) {
    try {
      const config = signal ? { signal } : {};
      const res = await api.get(`/insights/${insightId}`, config);
      return { success: true, data: res.data };
    } catch (err) {
      // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
      if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        throw err;
      }
      const msg = err.response?.data?.message || "인사이트를 불러오는데 실패했습니다.";
      return { success: false, message: msg };
    }
  },

  /** 🔍 분석 요청 */
  async requestAnalysis(productId, dateFrom = null, dateTo = null, requirements = null) {
    try {
      const payload = {
        product_id: productId,
      };
      
      if (dateFrom) payload.date_from = dateFrom;
      if (dateTo) payload.date_to = dateTo;
      if (requirements) payload.requirements = requirements;
      
      const res = await api.post("/insights/request", payload);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || "분석 요청에 실패했습니다.";
      return { success: false, message: msg };
    }
  },
};

export default insightService;

