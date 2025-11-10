import axios from "axios";

// ✅ Python FastAPI 서버 주소 (.env 에서 불러오기)
const PYTHON_API = process.env.PYTHON_ABSA_URL || "http://localhost:8000";

console.log("🔗 PYTHON_ABSA_URL =", process.env.PYTHON_ABSA_URL);
/**
 * 🧠 스팀 리뷰 배치 분석
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
