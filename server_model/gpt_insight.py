from openai import OpenAI
from server_model.db_connect import get_connection
import json
import decimal
import re
import os
from dotenv import load_dotenv

load_dotenv()
client = OpenAI()

def generate_aggregate_insight(product_id: int):
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT k.keyword_text,
                   SUM(CASE WHEN ra.sentiment='positive' THEN 1 ELSE 0 END) AS pos_count,
                   SUM(CASE WHEN ra.sentiment='negative' THEN 1 ELSE 0 END) AS neg_count
            FROM tb_reviewAnalysis ra
            JOIN tb_keyword k ON ra.keyword_id = k.keyword_id
            JOIN tb_review r ON ra.review_id = r.review_id
            WHERE r.product_id = %s
            GROUP BY k.keyword_text
        """, (product_id,))
        rows = cur.fetchall()

        # ✅ Decimal → float 변환
        for row in rows:
            for k, v in row.items():
                if isinstance(v, decimal.Decimal):
                    row[k] = float(v)

    if not rows:
        return {"error": "해당 상품의 리뷰 데이터가 없습니다."}

    stats = {
        row["keyword_text"]: {
            "positive": row["pos_count"],
            "negative": row["neg_count"]
        } for row in rows
    }

    # ✅ GPT 프롬프트 구성
    prompt = f"""
    당신은 고객 리뷰 분석 전문가입니다.
    아래는 상품 {product_id}의 리뷰 감정 통계입니다:

    {json.dumps(stats, ensure_ascii=False, indent=2)}

    이 데이터를 기반으로 다음을 작성해주세요:
    1. 긍정적 평가 요약
    2. 부정적 평가 요약
    3. 종합 인사이트 요약
    4. 개선 제안

    ⚠️ 반드시 아래와 같은 JSON 객체만 출력하세요. (코드블록 없이)
    {{
        "positive_summary": "...",
        "negative_summary": "...",
        "insight_summary": "...",
        "recommendation": "..."
    }}
    """

    # ✅ GPT 호출
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "너는 데이터 기반 인사이트 리포트를 작성하는 컨설턴트야."},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )

    gpt_text = response.choices[0].message.content.strip()

    # ✅ 코드블록(````json`) 제거 및 JSON 정리
    cleaned = re.sub(r"^```json|```$", "", gpt_text, flags=re.MULTILINE).strip()

    # ✅ JSON 파싱 시도
    try:
        report = json.loads(cleaned)
    except Exception as e:
        print("⚠️ GPT JSON 파싱 실패:", e)
        print("원본 응답:", gpt_text)
        report = {"insight_summary": cleaned}

    # ✅ DB 업데이트
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE tb_productInsight
            SET pos_top_keywords=%s,
                neg_top_keywords=%s,
                insight_summary=%s,
                improvement_suggestion=%s,
                created_at=NOW()
            WHERE product_id=%s
        """, (
            report.get("positive_summary", ""),
            report.get("negative_summary", ""),
            report.get("insight_summary", ""),
            report.get("recommendation", ""),
            product_id
        ))
        conn.commit()
    conn.close()

    return {"product_id": product_id, "gpt_report": report}


######################################################################
# GEMINI 무료 버전 적용
# import google.generativeai as genai
# from server_model.db_connect import get_connection
# import os, json
# import decimal

# # ✅ API Key 설정
# genai.configure(api_key="" )  # ← 네 키 넣기

# def generate_aggregate_insight(product_id: int):
#     conn = get_connection()
#     with conn.cursor() as cur:
#         cur.execute("""
#             SELECT k.keyword_text,
#                    SUM(CASE WHEN ra.sentiment='positive' THEN 1 ELSE 0 END) AS pos_count,
#                    SUM(CASE WHEN ra.sentiment='negative' THEN 1 ELSE 0 END) AS neg_count
#             FROM tb_reviewAnalysis ra
#             JOIN tb_keyword k ON ra.keyword_id = k.keyword_id
#             JOIN tb_review r ON ra.review_id = r.review_id
#             WHERE r.product_id = %s
#             GROUP BY k.keyword_text
#         """, (product_id,))
#         rows = cur.fetchall()

        
#         for row in rows:
#             for k, v in row.items():
#                 if isinstance(v, decimal.Decimal):
#                     row[k] = float(v)

#     if not rows:
#         return {"error": "해당 상품의 리뷰 데이터가 없습니다."}

#     stats = {row["keyword_text"]: {"positive": row["pos_count"], "negative": row["neg_count"]} for row in rows}

#     prompt = f"""
#     아래는 상품 {product_id}의 리뷰 감정 통계입니다.
#     {json.dumps(stats, ensure_ascii=False, indent=2)}

#     이 데이터를 분석하여 JSON 형식으로 작성해주세요:
#     {{
#       "positive_summary": "...",
#       "negative_summary": "...",
#       "insight_summary": "...",
#       "recommendation": "..."
#     }}
#     """

#     model = genai.GenerativeModel("gemini-1.5-flash")
#     response = model.generate_content(prompt)

#     # 결과 추출
#     text = response.text.strip()
#     try:
#         report = json.loads(text)
#     except:
#         report = {"insight_summary": text}

#     with conn.cursor() as cur:
#         cur.execute("""
#             UPDATE tb_productInsight
#             SET pos_top_keywords=%s,
#                 neg_top_keywords=%s,
#                 insight_summary=%s,
#                 improvement_suggestion=%s,
#                 created_at=NOW()
#             WHERE product_id=%s
#         """, (
#             report.get("positive_summary", ""),
#             report.get("negative_summary", ""),
#             report.get("insight_summary", ""),
#             report.get("recommendation", ""),
#             product_id
#         ))
#         conn.commit()
#     conn.close()

#     return {"product_id": product_id, "gemini_report": report}
