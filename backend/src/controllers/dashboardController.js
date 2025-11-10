import db from "../models/db.js";

/**
 * 📊 제품 대시보드 조회 컨트롤러
 * ------------------------------------------------------------
 * - 제품 기본 정보
 * - 리뷰 통계 (전체 리뷰 수, 긍·부정 비율)
 * - 키워드 분석 결과 (각 속성별 긍·부정 개수 및 비율)
 * - 최신 리뷰 목록 (샘플)
 * - 최근 인사이트 (AI 인사이트)
 */
export const getProductDashboardData = async (req, res) => {
  try {
    const productId = Number.parseInt(req.params.id, 10);
    if (!productId) {
      return res.status(400).json({ message: "유효한 productId가 필요합니다." });
    }

    console.log(`📊 대시보드 요청 수신 (product_id=${productId})`);

    // 1️⃣ 제품 기본 정보
    const [[product]] = await db.query(
      `SELECT 
         p.product_id, p.product_name, p.brand,
         c.category_name,
         IFNULL(d.product_score, 0) AS product_score,
         IFNULL(d.total_reviews, 0) AS total_reviews,
         d.updated_at
       FROM tb_product p
       LEFT JOIN tb_productCategory c ON p.category_id = c.category_id
       LEFT JOIN tb_productDashboard d ON p.product_id = d.product_id
       WHERE p.product_id = ?`,
      [productId]
    );

    if (!product) {
      return res.status(404).json({ message: "해당 제품을 찾을 수 없습니다." });
    }

    // 2️⃣ 리뷰 통계
    const [[sentimentStats]] = await db.query(
      `SELECT
         SUM(CASE WHEN ra.sentiment = 'positive' THEN 1 ELSE 0 END) AS positiveCount,
         SUM(CASE WHEN ra.sentiment = 'negative' THEN 1 ELSE 0 END) AS negativeCount,
         COUNT(*) AS totalCount
       FROM tb_reviewAnalysis ra
       JOIN tb_review r ON ra.review_id = r.review_id
       WHERE r.product_id = ?`,
      [productId]
    );

    const totalCount = sentimentStats?.totalCount || 0;
    const positiveCount = sentimentStats?.positiveCount || 0;
    const negativeCount = sentimentStats?.negativeCount || 0;
    const positiveRatio = totalCount ? (positiveCount / totalCount) * 100 : 0;
    const negativeRatio = totalCount ? (negativeCount / totalCount) * 100 : 0;

    // 3️⃣ 주요 키워드별 긍·부정 집계
    const [keywords] = await db.query(
      `SELECT
         k.keyword_text,
         COALESCE(SUM(CASE WHEN ra.sentiment = 'positive' THEN 1 ELSE 0 END), 0) AS positive_count,
         COALESCE(SUM(CASE WHEN ra.sentiment = 'negative' THEN 1 ELSE 0 END), 0) AS negative_count
       FROM tb_keyword k
       LEFT JOIN tb_reviewAnalysis ra ON k.keyword_id = ra.keyword_id
       LEFT JOIN tb_review r ON ra.review_id = r.review_id
       WHERE r.product_id = ?
       GROUP BY k.keyword_id, k.keyword_text
       ORDER BY k.keyword_id`,
      [productId]
    );

    // 4️⃣ 최근 인사이트
    const [[insight]] = await db.query(
      `SELECT *
       FROM tb_productInsight
       WHERE product_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [productId]
    );

    // 5️⃣ 최신 리뷰 샘플 (최대 5개)
    const [reviews] = await db.query(
      `SELECT review_id, review_text, review_date
       FROM tb_review
       WHERE product_id = ?
       ORDER BY review_date DESC
       LIMIT 5`,
      [productId]
    );

    // ✅ 최종 응답 구조
    res.json({
      product,
      insight: insight || null,
      stats: {
        totalReviews: totalCount,
        positiveRatio: Number(positiveRatio.toFixed(2)),
        negativeRatio: Number(negativeRatio.toFixed(2)),
        positiveCount,
        negativeCount,
      },
      keywords,
      reviews,
    });
  } catch (err) {
    console.error("❌ 대시보드 데이터 조회 오류:", err);
    res.status(500).json({ message: "DB 조회 중 오류가 발생했습니다." });
  }
};
