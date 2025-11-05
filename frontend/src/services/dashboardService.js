import api from "./api";

const dashboardService = {
  /** 📊 대시보드 데이터 조회 */
  async getDashboardData() {
    try {
      const res = await api.get("/dashboard/data");
      return { success: true, data: res.data.data };
    } catch (err) {
      console.error("대시보드 데이터 조회 오류:", err);
      const msg = err.response?.data?.message || "대시보드 데이터를 불러오는데 실패했습니다.";
      return { success: false, message: msg };
    }
  },
};

export default dashboardService;

