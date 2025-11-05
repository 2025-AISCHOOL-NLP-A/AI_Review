--키워드 목록 + 비율 + (서브쿼리로 집계된) 건수 부분 SQL문 단순화하기위한 뷰 생성 (아직 활용안함 )
DROP VIEW IF EXISTS v_product_keyword_sentiment;

CREATE OR REPLACE VIEW v_product_keyword_sentiment AS
SELECT
  r.product_id,
  ra.keyword_id,
  SUM(CASE WHEN ra.sentiment = 'positive' THEN 1 ELSE 0 END) AS positive_count,
  SUM(CASE WHEN ra.sentiment = 'negative' THEN 1 ELSE 0 END) AS negative_count
FROM tb_reviewAnalysis ra
JOIN tb_review r
  ON r.review_id = ra.review_id
GROUP BY r.product_id, ra.keyword_id;