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

    // 2) 총 리뷰 수 [reviewCountRow] tb_productDashboard 테이블의 total_reviews가 대체

    // 3) 최근 인사이트 (제품별)
    const [insights] = await db.query(
      "SELECT * FROM tb_productInsight WHERE product_id = ?",
      [productId]
    );

    // 4) 리뷰 통계(리뷰 원문 샘플 & 최신순 정렬)
    const [reviews] = await db.query(
      "SELECT * FROM tb_review WHERE product_id = ? ORDER BY review_date ASC",
      [productId]
    );

    // 5) 주요 키워드, 긍/부정 비율 + 속성별 긍·부정 분기형 막대 그래프 //서브 쿼리 조인, keyword_summary만 사용시 삭제
    // - keyword_summary(JSON)만 사용할 계획이라면 이 조인 쿼리는 제거해도 됩니다.
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

    /*// 6) (삭제 가능) 감정 분석 집계 쿼리
    // - 아래 tb_productDashboard.sentiment_distribution(JSON)을 우선 사용 해서 제거함

    // 7) 일자별 통계 데이터
    const [dailyTrend] = await db.query(
      `SELECT date, positive_ratio, negative_ratio, reviewCount
       FROM v_product_daily_trend
       WHERE product_id = ?
       ORDER BY date ASC`,
      [productId]
    );*/

    // 8) tb_productDashboard 집계 사용 (최신 1건)
    const [[dashboard]] = await db.query(
      `SELECT 
         total_reviews,
         sentiment_distribution,
         product_score,
         date_sentimental,
         keyword_summary,
         heatmap,
         wordcloud_path,
         insight_id,
         updated_at
       FROM tb_productDashboard
       WHERE product_id = ?
       ORDER BY updated_at DESC
       LIMIT 1`,
      [productId]
    );

    // tb_productDashboard의 JSON 컬럼 안전하게 파싱하기
    const parseJson = v => !v ? null : (typeof v === "object" ? v : (()=>{try{return JSON.parse(v)}catch{return null}})());
    const sentimentDist = parseJson(dashboard?.sentiment_distribution);  // {positive, negative, neutral}
    const dateSentimental = parseJson(dashboard?.date_sentimental);      // [{week_start, positive, negative, reviewCount}]
    const keywordSummary = parseJson(dashboard?.keyword_summary);

    //총 리뷰 수, 긍정비율, 부정비율
    const totalReviews = dashboard?.total_reviews ?? (Array.isArray(reviews) ? reviews.length : 0);
    let positiveRatio = sentimentDist ? (sentimentDist.positive || 0) * 100 : 0;
    let negativeRatio = sentimentDist ? (sentimentDist.negative || 0) * 100 : 0;

    // 폴백: tb_productDashboard에 감정 분포가 없을 때 DB 집계로 계산
    if (!sentimentDist) {
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
      const totalCount = Number(sentimentRow?.totalCount || 0);
      const posCount = Number(sentimentRow?.positiveCount || 0);
      const negCount = Number(sentimentRow?.negativeCount || 0);
      positiveRatio = totalCount > 0 ? (posCount / totalCount) * 100 : 0;
      negativeRatio = totalCount > 0 ? (negCount / totalCount) * 100 : 0;
    }

    // 일자별 트렌드 변환(프론트 포맷) - tb_productDashboard.date_sentimental 기반
    const dailyTrend = Array.isArray(dateSentimental) ? dateSentimental.map(w => ({
      date: w.week_start,
      positive_ratio: Math.round((w.positive || 0) * 100),
      negative_ratio: Math.round((w.negative || 0) * 100),
      reviewCount: w.reviewCount || 0,
    })) : [];

    // 키워드 폴백(JSON 요약 사용)
    const keywordFromSummary = Array.isArray(keywordSummary)
      ? keywordSummary.map(k => ({
          keyword_text: k.keyword,
          positive_ratio: Math.round((k.pos || 0) * 100),
          negative_ratio: Math.round((k.neg || 0) * 100),
          positive_count: Math.round((k.pos || 0) * (k.mention || 0)),
          negative_count: Math.round((k.neg || 0) * (k.mention || 0)),
        }))
      : [];


    // 프론트엔드에 데이터 전달
    res.json({
      product: products[0] || null,
      // 인사이트 평균 평점이 없으면 대시보드의 product_score로 폴백
      insight: insights[0] || (dashboard?.product_score ? { avg_rating: dashboard.product_score } : null),
      reviews,
      // DB 조인 결과가 없으면 keyword_summary(JSON) 변환 결과 사용
      keywords: (Array.isArray(keywords) && keywords.length > 0) ? keywords : keywordFromSummary,
      stats: {
        // 총 리뷰 수: 대시보드 total_reviews 우선, 폴백 reviews.length
        totalReviews,
        positiveRatio,
        negativeRatio,
        avgRating: insights[0]?.avg_rating ?? (dashboard?.product_score ?? null),
      },
      // 일자별(주간) 트렌드 데이터
      dailyTrend,

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