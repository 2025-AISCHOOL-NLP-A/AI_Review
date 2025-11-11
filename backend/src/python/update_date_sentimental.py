# -*- coding: utf-8 -*-
"""
tb_productDashboard.date_sentimental 주간(week) 집계 업데이트 스크립트
- .env: backend/.env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
- 실행:
    cd backend/src/python
    python update_date_sentimental.py               # 전체 product 갱신
    python update_date_sentimental.py --product 1011  # 특정 product만 갱신
"""

import os
import sys
import json
import argparse
import pymysql

# ✅ import 경로 보정 (python/ -> src, backend 루트)
CURR = os.path.dirname(__file__)
SRC_DIR = os.path.abspath(os.path.join(CURR, "../"))
BACKEND_DIR = os.path.abspath(os.path.join(CURR, "../.."))
sys.path.append(SRC_DIR)
sys.path.append(BACKEND_DIR)

from utils.db_connect import get_connection  # noqa: E402


def build_weekly_sentiment(product_id: int):
    """
    특정 product_id에 대해 주(ISO 주) 단위 감정비율/리뷰수 집계 JSON(Array) 생성
    """
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    query = """
        SELECT
            YEARWEEK(r.review_date, 1) AS week_id,
            MIN(DATE(r.review_date))   AS week_start,
            MAX(DATE(r.review_date))   AS week_end,
            SUM(CASE WHEN ra.sentiment = 'POS' THEN 1 ELSE 0 END) AS pos_count,
            SUM(CASE WHEN ra.sentiment = 'NEG' THEN 1 ELSE 0 END) AS neg_count,
            COUNT(*) AS total_count
        FROM tb_review r
        JOIN tb_reviewAnalysis ra ON r.review_id = ra.review_id
        WHERE r.product_id = %s
        GROUP BY YEARWEEK(r.review_date, 1)
        ORDER BY week_start;
    """
    cursor.execute(query, (product_id,))
    rows = cursor.fetchall()
    conn.close()

    weekly = []
    for r in rows:
        total = r["total_count"] or 1
        weekly.append({
            "week_start": str(r["week_start"]),
            "week_end":   str(r["week_end"]),
            "positive_ratio": round((r["pos_count"] or 0) / total, 2),
            "negative_ratio": round((r["neg_count"] or 0) / total, 2),
            "review_count":   int(total),
        })

    return json.dumps(weekly, ensure_ascii=False)


def update_date_sentimental(product_id: int) -> int:
    """
    tb_productDashboard.date_sentimental 갱신
    반환: 변경된 row 수
    """
    data_json = build_weekly_sentiment(product_id)

    conn = get_connection()
    cursor = conn.cursor()
    q = """
        UPDATE tb_productDashboard
        SET date_sentimental = %s
        WHERE product_id = %s
    """
    cursor.execute(q, (data_json, product_id))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected


def update_all_products():
    """
    전체 product 갱신 루프
    """
    conn = get_connection()
    c = conn.cursor(pymysql.cursors.DictCursor)
    c.execute("SELECT product_id FROM tb_product")
    products = [row["product_id"] for row in c.fetchall()]
    conn.close()

    ok, fail = 0, 0
    for pid in products:
        try:
            affected = update_date_sentimental(pid)
            print(f"✅ product_id={pid} 업데이트 완료 (rows={affected})")
            ok += 1
        except Exception as e:
            print(f"❌ product_id={pid} 실패: {e}")
            fail += 1
    print(f"\n🎯 완료: 성공 {ok} / 실패 {fail} / 총 {len(products)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--product", type=int, help="특정 product_id만 갱신")
    args = parser.parse_args()

    if args.product:
        try:
            rows = update_date_sentimental(args.product)
            print(f"✅ product_id={args.product} 업데이트 완료 (rows={rows})")
        except Exception as e:
            print(f"❌ 실패: {e}")
    else:
        print("🚀 전체 product date_sentimental 주간 집계 업데이트 시작...")
        update_all_products()
