import api from "./api";
import { handleApiError, isAbortError, getErrorMessage } from "../utils/api/errorHandler";
import { createApiConfig, createApiConfigWithParams } from "../utils/api/apiHelpers";

const insightService = {
  /** 📊 인사이트 목록 조회 */
  async getInsights(productId = null, signal = null) {
    try {
      const params = {};
      if (productId) {
        params.product_id = productId;
      }
      const config = createApiConfigWithParams(signal, params);
      const res = await api.get("/insights", config);
      return { success: true, data: res.data };
    } catch (err) {
      if (isAbortError(err)) {
        throw err;
      }
      return handleApiError(err, "인사이트 목록을 불러오는데 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "인사이트 목록을 불러오는데 실패했습니다."),
      };
    }
  },

  /** 📄 인사이트 상세 조회 */
  async getInsight(insightId, signal = null) {
    try {
      const config = createApiConfig(signal);
      const res = await api.get(`/insights/${insightId}`, config);
      return { success: true, data: res.data };
    } catch (err) {
      if (isAbortError(err)) {
        throw err;
      }
      return handleApiError(err, "인사이트를 불러오는데 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "인사이트를 불러오는데 실패했습니다."),
      };
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
      return handleApiError(err, "분석 요청에 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "분석 요청에 실패했습니다."),
      };
    }
  },
};

export default insightService;

