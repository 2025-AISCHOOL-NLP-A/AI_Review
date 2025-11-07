import db from "../models/db.js";

// ==============================
// 제품 대시보드 조회
// ==============================
 // TODO: 제품 대시보드 데이터 조회 로직 구현
    // - 제품 기본 정보
    // - 리뷰 통계
    // - 감정 분석 결과
    // - 키워드 분석 결과
    // - 최근 인사이트

// 대시보드 데이터 제공용 컨트롤러


/** 제품 대시보드 데이터 조회 API (productId URL 파라미터) */
export const getProductDashboardData = async (req, res) => {
  try {
    const parsedId = Number.parseInt(req.params.id, 10); // 기존 핸들러 재사용을 위해 params.id 로 매핑
    const productId = Number.isNaN(parsedId) ? undefined : parsedId; //기본값: undefined(productId입력)

    // 1) 제품 기본 정보
    const [products] = await db.query(
      "SELECT * FROM tb_product WHERE product_id = ?",
      [productId]
    );

    // 2) 총 리뷰 수
    const [[reviewCountRow]] = await db.query(
      "SELECT COUNT(*) AS totalReviews FROM tb_review WHERE product_id = ?",
      [productId]
    );
    
    // 3) 최근 인사이트 (제품별)
    const [insights] = await db.query(
      "SELECT * FROM tb_productInsight WHERE product_id = ?",
      [productId]
    );

    // 3) 리뷰 통계(리뷰 원문 샘플 & 최신순 정렬)
    const [reviews] = await db.query(
      "SELECT * FROM tb_review WHERE product_id = ? ORDER BY review_date ASC",
      [productId]
    );

    // 4) 주요 키워드, 긍/부정 비율 + 속성별 긍·부정 분기형 막대 그래프 //서브 쿼리 조인
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


    // 6) 감정 분석 결과(긍/부정 비율, 일자별 긍·부정 포함 리뷰 비율, 
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
    const positiveCount = Number(sentimentRow?.positiveCount || 0); //감정 워드클라우드
    const negativeCount = Number(sentimentRow?.negativeCount || 0); //감정 워드클라우드
    const positiveRatio = totalCount > 0 ? (positiveCount / totalCount) * 100 : 0; //일자별 긍·부정 포함 리뷰 비율,속성별 긍·부정 분기형 막대 그래프
    const negativeRatio = totalCount > 0 ? (negativeCount / totalCount) * 100 : 0; //일자별 긍·부정 포함 리뷰 비율,속성별 긍·부정 분기형 막대 그래프

    // 프론트엔드에 데이터 전달
    res.json({
      product: products[0] || null,
      insight: insights[0] || null,
      reviews,
      keywords, // 각 항목에 positive_count, negative_count 포함
      stats: {
        totalReviews: Number(reviewCountRow?.totalReviews || 0),
        positiveRatio,
        negativeRatio,
        avgRating: insights[0]?.avg_rating ?? null,
      },
      //  dailyTrend, // 일자별 통계 데이터

      //
      /*if (!productId) {
        return res.status(400).json({ message: "productId 가 필요합니다." });
      }*/
    });
  } catch (err) {
    console.error("대시보드 데이터 조회 오류:", err);
    res.status(500).json({ message: "DB 오류" });
  }
};