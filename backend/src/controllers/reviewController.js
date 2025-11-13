import { analyzeProductReviews } from "../services/absaService.js"; // Python 서버 전체 파이프라인 호출

/**
 * 리뷰 분석 컨트롤러
 * ------------------------------------------------------------
 * Python 서버의 전체 분석 파이프라인 엔드포인트 호출
 * - 리뷰 분석 (FastAPI)
 * - tb_reviewAnalysis에 결과 저장
 * - tb_productDashboard 업데이트 (프로시저 호출)
 * - 워드클라우드 생성
 */
export const analyzeReviews = async (req, res) => {
  const { id: product_id } = req.params;
  const { domain } = req.query; // 선택적 도메인 파라미터

  try {
    console.log(`📦 ${product_id}번 제품 리뷰 분석 시작 (도메인: ${domain || "자동"})`);

    // ✅ Python 서버의 전체 파이프라인 호출
    const result = await analyzeProductReviews(product_id, domain);

    console.log(`✅ 분석 완료:`, result);

    // ✅ Python 서버에서 이미 모든 처리가 완료되었으므로 결과만 반환
    res.json({
      success: true,
      product_id: result.product_id || parseInt(product_id),
      review_count: result.review_count || 0,
      analyzed_count: result.analyzed_count || 0,
      inserted_count: result.inserted_count || 0,
      wordcloud_path: result.wordcloud_path || null,
      message: result.message || "리뷰 분석 및 대시보드 갱신 완료",
    });
  } catch (err) {
    console.error("❌ 리뷰 분석 오류:", err);
    
    // Python 서버의 에러 응답 처리
    if (err.response) {
      const status = err.response.status;
      const errorMessage = err.response.data?.detail || err.response.data?.message || err.message;
      return res.status(status).json({ 
        success: false,
        error: errorMessage 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};
