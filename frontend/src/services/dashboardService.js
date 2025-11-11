import api from "./api";

const dashboardService = {
  /** 📊 대시보드 데이터 조회 - /products/{id}/reviews API 사용 */
  async getDashboardData(productId = 1007, dateFrom = null, dateTo = null, keyword = null, signal = null) {
    try {
      // 현재 백엔드 /products/{id}/reviews API는 날짜 필터를 지원하지 않음
      // 키워드가 있으면 /products/{id}/reviews API 사용, 없으면 /products/{id}/dashboard 사용
      let responseData;
      
      if (keyword) {
        // 키워드 필터가 있으면 /products/{id}/reviews API 사용
        const reviewsRes = await api.get(`/products/${productId}/reviews`, {
          params: { keyword },
          ...(signal ? { signal } : {})
        });
        
        // reviews API는 리뷰만 반환하므로, dashboard API도 함께 호출
        const dashboardRes = await api.get(`/products/${productId}/dashboard`, signal ? { signal } : {});
        
        // 두 응답 병합
        responseData = {
          ...dashboardRes.data,
          reviews: reviewsRes.data?.reviews || dashboardRes.data?.reviews || [],
        };
      } else {
        // 키워드 필터가 없으면 기존 dashboard API 사용
        const res = await api.get(`/products/${productId}/dashboard`, signal ? { signal } : {});
        responseData = res.data;
      }
      
      // 키워드 데이터 변환: positive_count와 negative_count로 비율 계산
      const keywords = (responseData?.keywords || []).map(kw => {
        const posCount = kw.positive_count || 0;
        const negCount = kw.negative_count || 0;
        const total = posCount + negCount;
        const positiveRatio = total > 0 ? (posCount / total) * 100 : 0;
        const negativeRatio = total > 0 ? (negCount / total) * 100 : 0;
        
        return {
          keyword_id: kw.keyword_id || null,
          keyword_text: kw.keyword_text || '',
          positive_count: posCount,
          negative_count: negCount,
          positiveCount: posCount,
          negativeCount: negCount,
          positive_ratio: Number(positiveRatio.toFixed(2)),
          negative_ratio: Number(negativeRatio.toFixed(2)),
          positiveRatio: Number(positiveRatio.toFixed(2)),
          negativeRatio: Number(negativeRatio.toFixed(2)),
        };
      });

      // 리뷰 데이터 변환: rating과 source 기본값 설정
      const reviews = (responseData?.reviews || []).map(review => ({
        ...review,
        rating: review.rating || 0,
        source: review.source || 'Unknown',
      }));

      // dailyTrend 데이터 생성: reviews 기반으로 날짜별 집계 (백엔드에서 오지 않으므로 클라이언트에서 생성)
      const dailyTrendMap = new Map();
      reviews.forEach(review => {
        if (review.review_date) {
          const date = new Date(review.review_date).toISOString().split('T')[0];
          if (!dailyTrendMap.has(date)) {
            dailyTrendMap.set(date, {
              date,
              reviewCount: 0,
              positiveCount: 0,
              negativeCount: 0,
            });
          }
          const dayData = dailyTrendMap.get(date);
          dayData.reviewCount += 1;
          // rating 기반으로 긍정/부정 판단 (3.0 이상이면 긍정)
          if (review.rating >= 3.0) {
            dayData.positiveCount += 1;
          } else {
            dayData.negativeCount += 1;
          }
        }
      });

      // dailyTrend 배열로 변환 및 비율 계산
      const dailyTrend = Array.from(dailyTrendMap.values())
        .map(item => {
          const total = item.reviewCount || 1;
          const positiveRatio = (item.positiveCount / total) * 100;
          const negativeRatio = (item.negativeCount / total) * 100;
          return {
            date: item.date,
            reviewCount: item.reviewCount,
            positiveCount: item.positiveCount,
            negativeCount: item.negativeCount,
            positive_ratio: Number(positiveRatio.toFixed(2)),
            negative_ratio: Number(negativeRatio.toFixed(2)),
            positiveRatio: Number(positiveRatio.toFixed(2)),
            negativeRatio: Number(negativeRatio.toFixed(2)),
          };
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // 날짜순 정렬

      // insight에서 키워드 추출
      const insight = responseData?.insight || {};
      const positiveKeywords = insight.pos_top_keywords 
        ? insight.pos_top_keywords.split(/[|,]/).map(k => k.trim()).filter(Boolean)
        : [];
      const negativeKeywords = insight.neg_top_keywords 
        ? insight.neg_top_keywords.split(/[|,]/).map(k => k.trim()).filter(Boolean)
        : [];

      // 기존 데이터 구조에 맞게 변환
      const combinedData = {
        product: responseData?.product || {},
        reviews: reviews,
        insights: [], // 백엔드에서 오지 않으므로 빈 배열
        analysis: {
          positiveRatio: responseData?.stats?.positiveRatio || 0,
          negativeRatio: responseData?.stats?.negativeRatio || 0,
          avgRating: insight?.avg_rating || 0,
          positiveKeywords: positiveKeywords,
          negativeKeywords: negativeKeywords,
        },
        stats: {
          totalReviews: responseData?.stats?.totalReviews || 0,
          positiveRatio: responseData?.stats?.positiveRatio || 0,
          negativeRatio: responseData?.stats?.negativeRatio || 0,
          positiveCount: responseData?.stats?.positiveCount || 0,
          negativeCount: responseData?.stats?.negativeCount || 0,
          avgRating: insight?.avg_rating || 0,
        },
        dailyTrend: dailyTrend,
        keywords: keywords,
        insight: insight,
      };

      return { success: true, data: combinedData };
    } catch (err) {
      // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
      if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        throw err;
      }
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

  /** ➕ 제품 생성 */
  async createProduct(productData) {
    try {
      const res = await api.post("/products", productData);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("제품 생성 오류:", err);
      const msg = err.response?.data?.message || "제품 생성에 실패했습니다.";
      return { success: false, message: msg };
    }
  },
};

export default dashboardService;