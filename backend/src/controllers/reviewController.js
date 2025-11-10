import db from "../models/db.js";
import { analyzeBatchSteam } from "../services/absaService.js"; // FastAPI 호출 서비스
import dotenv from "dotenv";

dotenv.config();

/**
 * 리뷰 분석 컨트롤러
 * ------------------------------------------------------------
 * 1️⃣ DB에서 해당 product_id의 리뷰 텍스트 불러옴
 * 2️⃣ FastAPI 모델 서버에 전달해 측면별 감정 분석 수행
 * 3️⃣ 결과를 tb_reviewAnalysis에 삽입
 * 4️⃣ MySQL 프로시저(sp_update_product_dashboard) 호출로
 *    tb_productDashboard 자동 업데이트
 */
export const analyzeReviews = async (req, res) => {
  const { id: product_id } = req.params;

  try {
    // ✅ 1️⃣ 리뷰 텍스트 로드
    const [reviews] = await db.query(
      "SELECT review_id, review_text FROM tb_review WHERE product_id = ?",
      [product_id]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ message: "분석할 리뷰가 없습니다." });
    }

    console.log(`📦 ${product_id}번 제품 리뷰 ${reviews.length}개 분석 시작`);

    // ✅ 2️⃣ FastAPI로 텍스트 전달
    const texts = reviews.map((r) => r.review_text);
    const result = await analyzeBatchSteam(texts);

    console.log(`✅ FastAPI 응답 수: ${result.count}`);

    // ✅ 3️⃣ 키워드 매핑 테이블 (tb_keyword → keyword_id)
    const [keywords] = await db.query(
      "SELECT keyword_id, keyword_text FROM tb_keyword WHERE category_id = (SELECT category_id FROM tb_product WHERE product_id = ?)",
      [product_id]
    );

    const keywordMap = Object.fromEntries(
      keywords.map((k) => [k.keyword_text, k.keyword_id])
    );

    let insertCount = 0;

    // ✅ 4️⃣ tb_reviewAnalysis 삽입
    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      const item = result.items[i];

      for (const asp of item.results) {
        const keywordId = keywordMap[asp.aspect];
        if (!keywordId) continue;

        await db.query(
          `INSERT INTO tb_reviewAnalysis (keyword_id, review_id, sentiment, analyzed_at)
           VALUES (?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE sentiment = VALUES(sentiment), analyzed_at = NOW()`,
          [
            keywordId,
            review.review_id,
            asp.label === "긍정" ? "positive" : "negative",
          ]
        );
        insertCount++;
      }
    }

    console.log(`✅ tb_reviewAnalysis에 ${insertCount}건 삽입 완료`);

    // ✅ 5️⃣ 프로시저 호출 (tb_productDashboard 자동 갱신)
    await db.query("CALL sp_update_product_dashboard(?)", [product_id]);
    console.log(`✅ 대시보드 갱신 완료 (product_id=${product_id})`);

    // ✅ 6️⃣ 응답
    res.json({
      success: true,
      product_id,
      review_count: reviews.length,
      inserted: insertCount,
      message: "리뷰 분석 및 대시보드 갱신 완료",
    });
  } catch (err) {
    console.error("❌ 리뷰 분석 오류:", err);
    res.status(500).json({ error: err.message });
  }
};
