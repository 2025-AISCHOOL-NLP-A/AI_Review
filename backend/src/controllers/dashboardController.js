// 대시보드 데이터 제공용 컨트롤러
import db from "../models/db.js";

/** 제품 대시보드 데이터 조회 API (productId 쿼리 ) */
export const getProductDashboardData = async (req, res) => {
  try {
    const parsedId = Number.parseInt(req.query.productId, 10);
    const productId = Number.isNaN(parsedId) ? undefined : parsedId; //기본값: undefined(productId입력)

    // 1) 제품 정보
    const [products] = await db.query(
      "SELECT * FROM tb_product WHERE product_id = ?",
      [productId]
    );

    // 2) 인사이트 (제품별)
    const [insights] = await db.query(
      "SELECT * FROM tb_productInsight WHERE product_id = ?",
      [productId]
    );

    // 3) 리뷰 목록 & 평점
    const [reviews] = await db.query(
      "SELECT * FROM tb_review WHERE product_id = ? ORDER BY review_date ASC",
      [productId]
    );

    // 4) 주요 키워드, 긍/부정 비율 + 건수(툴팁용) //서브 쿼리 조인
    const [keywords] = await db.query(
      `SELECT
        k.keyword_text,
        pk.positive_ratio,
        pk.negative_ratio,
        pk.keyword_id,
        COALESCE(agg.positive_count, 0) AS positive_count,
        COALESCE(agg.negative_count, 0) AS negative_count
      FROM tb_productKeyword pk
      JOIN tb_keyword k
        ON k.keyword_id = pk.keyword_id
      LEFT JOIN (
        SELECT
          r.product_id,
          ra.keyword_id,
          SUM(CASE WHEN ra.sentiment = 'positive' THEN 1 ELSE 0 END) AS positive_count,
          SUM(CASE WHEN ra.sentiment = 'negative' THEN 1 ELSE 0 END) AS negative_count
        FROM tb_reviewAnalysis ra
        JOIN tb_review r
          ON r.review_id = ra.review_id
        GROUP BY r.product_id, ra.keyword_id
      ) agg
        ON agg.product_id = pk.product_id
      AND agg.keyword_id = pk.keyword_id
      WHERE pk.product_id = ?
      ORDER BY k.keyword_id;`,
      [productId]
    );

    // 5) KPI 통계: 총 리뷰 수, 긍/부정 비율
    const [[reviewCountRow]] = await db.query(
      "SELECT COUNT(*) AS totalReviews FROM tb_review WHERE product_id = ?",
      [productId]
    );

    // 6) 리뷰 분석 데이터
    const [[sentimentRow]] = await db.query(
      `SELECT
         SUM(CASE WHEN ra.sentiment = 'positive' THEN 1 ELSE 0 END) AS positiveCount,
         SUM(CASE WHEN ra.sentiment = 'negative' THEN 1 ELSE 0 END) AS negativeCount,
         COUNT(*) AS totalCount
       FROM tb_reviewAnalysis ra
       JOIN tb_review r ON ra.review_id = r.review_id
       WHERE r.product_id = ?`,
      [productId]
    );

    // 7) 일자별 통계 데이터
    /*const [dailyTrend] = await db.query(
      `SELECT date, positive_ratio, negative_ratio, reviewCount
       FROM v_product_daily_trend
       WHERE product_id = ?
       ORDER BY date ASC`,
      [productId]
    );*/

    
    const totalCount = Number(sentimentRow?.totalCount || 0);
    const positiveCount = Number(sentimentRow?.positiveCount || 0);
    const negativeCount = Number(sentimentRow?.negativeCount || 0);
    const positiveRatio = totalCount > 0 ? (positiveCount / totalCount) * 100 : 0;
    const negativeRatio = totalCount > 0 ? (negativeCount / totalCount) * 100 : 0;

    // 프론트엔드에 데이터 전달
    res.json({
      product: products[0] || null,
      insight: insights[0] || null,
      reviews,
      keywords,
      stats: {
        totalReviews: Number(reviewCountRow?.totalReviews || 0),
        positiveRatio,
        negativeRatio,
        avgRating: insights[0]?.avg_rating ?? null,
      },
      //  dailyTrend, // 일자별 통계 데이터
    });
  } catch (err) {
    console.error("대시보드 데이터 조회 오류:", err);
    res.status(500).json({ message: "DB 오류" });
  }
};