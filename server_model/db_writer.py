from datetime import datetime
from server_model.db_connect import get_connection


def insert_analysis_result(review_id, analysis_dict):
    conn = get_connection()
    cur = conn.cursor()

    # 중복 시 업데이트 (UPSERT)
    for aspect, polarity_list in analysis_dict.items():
        raw = polarity_list[0]
        # ✅ DB에 맞게 변환
        sentiment = {
            "pos": "positive",
            "neg": "negative",
            "neutral": "neutral"
        }.get(raw, "neutral")

        query = """
            INSERT INTO tb_reviewAnalysis (keyword_id, review_id, sentiment, analyzed_at)
            SELECT k.keyword_id, %s, %s, NOW()
            FROM tb_keyword k
            WHERE k.keyword_text = %s
            ON DUPLICATE KEY UPDATE sentiment = VALUES(sentiment), analyzed_at = NOW();
        """
        cur.execute(query, (review_id, sentiment, aspect))

    conn.commit()
    conn.close()


def update_product_insight(product_id):
    """tb_productInsight 테이블 갱신"""
    conn = get_connection()
    cur = conn.cursor()

    query = """
    SELECT k.keyword_text,
        SUM(CASE WHEN r.sentiment='positive' THEN 1 ELSE 0 END) AS pos_cnt,
        SUM(CASE WHEN r.sentiment='negative' THEN 1 ELSE 0 END) AS neg_cnt
    FROM tb_reviewAnalysis r
    JOIN tb_review v ON r.review_id = v.review_id
    JOIN tb_keyword k ON r.keyword_id = k.keyword_id
    WHERE v.product_id = %s
    GROUP BY k.keyword_text;
    """
    cur.execute(query, (product_id,))
    rows = cur.fetchall()

    pos_top = sorted(rows, key=lambda x: x["pos_cnt"], reverse=True)[:3]
    neg_top = sorted(rows, key=lambda x: x["neg_cnt"], reverse=True)[:3]

    pos_keywords = ", ".join([x["keyword_text"] for x in pos_top]) if pos_top else None
    neg_keywords = ", ".join([x["keyword_text"] for x in neg_top]) if neg_top else None

    summary = f"긍정요소: {pos_keywords or '-'} / 개선요소: {neg_keywords or '-'}"

    cur.execute(
        """
        UPDATE tb_productInsight
        SET pos_top_keywords=%s,
            neg_top_keywords=%s,
            insight_summary=%s,
            created_at=NOW()
        WHERE product_id=%s
    """,
        (pos_keywords, neg_keywords, summary, product_id),
    )

    conn.commit()
    conn.close()
