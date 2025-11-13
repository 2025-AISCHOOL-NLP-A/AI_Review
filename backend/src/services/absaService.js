import axios from "axios";

// ✅ Python FastAPI 서버 주소 (.env 에서 불러오기)
const PYTHON_API = process.env.PYTHON_ABSA_URL || "http://localhost:8000";

console.log("🔗 PYTHON_ABSA_URL =", process.env.PYTHON_ABSA_URL);

/**
 * 🧠 스팀 리뷰 배치 분석 (기존 함수 - 다른 곳에서 사용할 수 있으므로 유지)
 * @param {string[]} texts - 리뷰 텍스트 배열
 * @returns {object} - 분석 결과(JSON)
 */
export async function analyzeBatchSteam(texts) {
  try {
    const res = await axios.post(`${PYTHON_API}/v1/analyze-batch`, {
      texts,
      aspect_th: 0.35,
      margin: 0.03,
    });
    return res.data;
  } catch (err) {
    console.error("❌ ABSA API 호출 실패:", err.message);
    throw err;
  }
}

/**
 * 🚀 제품 리뷰 전체 분석 파이프라인 호출
 * Python 서버의 전체 파이프라인 엔드포인트 사용
 * - 리뷰 분석
 * - DB 저장 (tb_reviewAnalysis)
 * - 대시보드 업데이트 (프로시저 호출)
 * - 워드클라우드 생성
 * @param {number} product_id - 제품 ID
 * @param {string} domain - 도메인 (steam, cosmetics, electronics) - 선택사항
 * @returns {object} - 분석 결과
 */
export async function analyzeProductReviews(product_id, domain = null) {
  try {
    let url = `${PYTHON_API}/v1/products/${product_id}/reviews/analysis`;
    if (domain) {
      url += `?domain=${domain}`;
    }
    
    const res = await axios.post(url);
    return res.data;
  } catch (err) {
    console.error("❌ 제품 리뷰 분석 파이프라인 호출 실패:", err.message);
    if (err.response) {
      console.error("응답 데이터:", err.response.data);
    }
    throw err;
  }
}
