// 대시보드 데이터 제공용 컨트롤러
import db from "../models/db.js";

/** 1. 제품 주요 정보 조회 API */
export const getSonyProductInfo = async (req, res) => {
  try {
    // 1) 제품 정보
    const [products] = await db.query(
      "SELECT * FROM tb_product WHERE product_id = 1001"
    );
    // 2) 인사이트 (제품별)
    const [insights] = await db.query(
      "SELECT * FROM tb_productInsight WHERE product_id = 1001"
    );
    // 3) 리뷰 목록 & 평점
    const [reviews] = await db.query(
      "SELECT * FROM tb_review WHERE product_id = 1001 ORDER BY review_date ASC"
    );
    // 4) 주요 키워드, 긍/부정 비율
    const [keywords] = await db.query(
      `SELECT k.keyword_text, pk.positive_ratio, pk.negative_ratio
       FROM tb_productKeyword pk
       JOIN tb_keyword k ON pk.keyword_id = k.keyword_id
       WHERE pk.product_id = 1001
       ORDER BY k.keyword_id`
    );

    // 프론트엔드에 데이터 전달
    res.json({ product: products[0], insight: insights[0], reviews, keywords });
  } catch (err) {
    console.error("대시보드 데이터 조회 오류:", err);
    res.status(500).json({ message: "DB 오류" });
  }
};