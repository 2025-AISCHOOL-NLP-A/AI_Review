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
 * 🧠 화장품 리뷰 배치 분석
 * @param {string[]} texts - 리뷰 텍스트 배열
 * @returns {object} - 분석 결과(JSON)
 */

export async function analyzeBatchCosmetics(texts) {
  try {
    const res = await axios.post(
      `${PYTHON_API}/v1/analyze-batch?domain=cosmetics`,
      {
        texts,
        aspect_th: 0.35,
        margin: 0.03,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return res.data;
  } catch (err) {
    console.error("❌ ABSA API 호출 실패(cosmetics):", err.message);
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
    
    console.log(`📡 Python 서버 호출: ${url}`);
    
    // 타임아웃 설정 (30분 - 대용량 리뷰 처리 + 전체 파이프라인 고려)
    // 전체 파이프라인: 리뷰 분석(배치) + DB 저장 + 인사이트 생성(OpenAI) + 워드클라우드 생성
    const res = await axios.post(url, {}, {
      timeout: 1800000, // 30분 (리뷰 5000개 이상 + 전체 파이프라인 처리 시간 확보)
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Python 서버 응답 성공:`, res.data);
    return res.data;
  } catch (err) {
    console.error("❌ 제품 리뷰 분석 파이프라인 호출 실패:", err.message);
    if (err.response) {
      console.error("응답 상태:", err.response.status);
      console.error("응답 데이터:", err.response.data);
    } else if (err.request) {
      console.error("요청은 전송되었지만 응답을 받지 못했습니다.");
      console.error("Python 서버가 실행 중인지 확인하세요:", PYTHON_API);
    } else {
      console.error("요청 설정 중 오류:", err.message);
    }
    throw err;
  }
}
