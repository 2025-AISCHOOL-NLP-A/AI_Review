import api from "./api";
import { handleApiError, getErrorMessage } from "../utils/api/errorHandler";
import { createApiConfig, createApiConfigWithParams } from "../utils/api/apiHelpers";

const reviewService = {
  /**
   * 리뷰 목록 조회
   * @param {Object} filters - 필터 옵션
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @param {string} sortField - 정렬 필드
   * @param {string} sortDirection - 정렬 방향 (asc/desc)
   * @param {AbortSignal} signal - 요청 취소 시그널
   */
  async getReviews(
    filters = {},
    page = 1,
    limit = 10,
    sortField = "review_date",
    sortDirection = "desc",
    signal = null
  ) {
    try {
      const params = {
        page,
        limit,
        sort_field: sortField,
        sort_direction: sortDirection,
        ...(filters.product_id && { product_id: filters.product_id }),
        ...(filters.rating && { rating: filters.rating }),
        ...(filters.sentiment && { sentiment: filters.sentiment }),
        ...(filters.search && { search: filters.search }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      };

      const config = createApiConfigWithParams(signal, params);
      const res = await api.get("/reviews", config);

      // 백엔드 응답 구조: { reviews: [], pagination: {}, total: number }
      return {
        success: true,
        data: res.data.reviews || [],
        pagination: res.data.pagination || {
          page: parseInt(page),
          limit: parseInt(limit),
          total: res.data.total || 0,
          totalPages: res.data.pagination?.totalPages || Math.ceil((res.data.total || 0) / limit),
        },
        total: res.data.total || 0,
      };
    } catch (err) {
      return handleApiError(err, "리뷰 목록을 불러오는데 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "리뷰 목록을 불러오는데 실패했습니다."),
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        total: 0,
      };
    }
  },

  /**
   * 단일 리뷰 삭제
   * @param {number} reviewId - 리뷰 ID
   */
  async deleteReview(reviewId) {
    try {
      const res = await api.delete(`/reviews/${reviewId}`);
      return { success: true, data: res.data };
    } catch (err) {
      return handleApiError(err, "리뷰 삭제에 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "리뷰 삭제에 실패했습니다."),
      };
    }
  },

  /**
   * 여러 리뷰 일괄 삭제
   * @param {Array<number>} reviewIds - 리뷰 ID 배열
   */
  async deleteReviews(reviewIds) {
    try {
      const res = await api.delete("/reviews/batch", {
        data: { review_ids: reviewIds },
      });
      return { success: true, data: res.data };
    } catch (err) {
      return handleApiError(err, "리뷰 일괄 삭제에 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "리뷰 일괄 삭제에 실패했습니다."),
      };
    }
  },

  /**
   * 리뷰 데이터 다운로드 (CSV/Excel)
   * @param {Object} filters - 필터 옵션
   * @param {string} format - 다운로드 형식 (csv/excel)
   */
  async exportReviews(filters = {}, format = "csv") {
    try {
      const params = {
        format,
        ...(filters.product_id && { product_id: filters.product_id }),
        ...(filters.rating && { rating: filters.rating }),
        ...(filters.sentiment && { sentiment: filters.sentiment }),
        ...(filters.search && { search: filters.search }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      };

      const config = {
        params,
        responseType: "blob", // 파일 다운로드를 위해 blob으로 설정
      };

      const res = await api.get("/reviews/export", config);

      // 다운로드 파일 생성
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Content-Disposition 헤더에서 파일명 추출
      const contentDisposition = res.headers["content-disposition"];
      let filename = `reviews_${new Date().getTime()}.${format === "excel" ? "xlsx" : "csv"}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      return handleApiError(err, "리뷰 다운로드에 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "리뷰 다운로드에 실패했습니다."),
      };
    }
  },

  /**
   * 제품 목록 조회 (필터용)
   * @param {AbortSignal} signal - 요청 취소 시그널
   */
  async getProducts(signal = null) {
    try {
      const config = createApiConfig(signal);
      const res = await api.get("/products", {
        ...config,
        params: { page: 1, limit: 1000 }, // 필터용이므로 많은 데이터 가져오기
      });

      // 응답 데이터 구조 파싱
      let products = [];
      const responseData = res.data?.data || res.data;
      
      if (responseData?.products && Array.isArray(responseData.products)) {
        products = responseData.products;
      } else if (Array.isArray(responseData)) {
        products = responseData;
      }

      return { success: true, data: products };
    } catch (err) {
      return handleApiError(err, "제품 목록을 불러오는데 실패했습니다.", null) || {
        success: false,
        message: getErrorMessage(err, "제품 목록을 불러오는데 실패했습니다."),
        data: [],
      };
    }
  },
};

export default reviewService;

