import os
import sys
import json
import pandas as pd
from datetime import datetime
import pymysql
from dotenv import load_dotenv

# =====================================================
# ✅ 1. 환경변수 로드
# =====================================================
load_dotenv()

# =====================================================
# ✅ 2. DB 연결 함수
# =====================================================
def get_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 3312)),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )

# =====================================================
# ✅ 3. 리뷰 삽입 함수
# =====================================================
def insert_steam_reviews(json_path, product_name, brand_name=None, category_id=103, user_id=10001, max_reviews=400):
    conn = get_connection()
    cursor = conn.cursor()

    # --- (1) 제품 존재 여부 확인
    cursor.execute("SELECT product_id FROM tb_product WHERE product_name=%s", (product_name,))
    result = cursor.fetchone()

    if result:
        product_id = result["product_id"]
        print(f"🔍 '{product_name}' 이미 존재 (product_id={product_id})")
    else:
        cursor.execute("""
            INSERT INTO tb_product (category_id, product_name, brand, user_id, registered_date)
            VALUES (%s, %s, %s, %s, NOW())
        """, (category_id, product_name, brand_name, user_id))
        product_id = cursor.lastrowid
        conn.commit()
        print(f"✅ '{product_name}' 신규 등록 완료 (product_id={product_id})")

    # --- (2) JSON 파일 불러오기
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        df = pd.DataFrame(data)
    except Exception as e:
        print(f"❌ JSON 파일 읽기 오류: {e}")
        conn.close()
        return

    print(f"📦 리뷰 {len(df)}개 로드 완료 (상위 {max_reviews}개 삽입 예정)")

    # --- (3) 리뷰 삽입
    inserted, skipped = 0, 0
    for _, row in df.head(max_reviews).iterrows():
        try:
            review_text = str(row.get("review", "")).strip()
            if not review_text:
                skipped += 1
                continue

            # ✅ (수정된 평점 계산 로직)
            voted_up = row.get("voted_up", False)
            score = float(row.get("weighted_vote_score", 0.5))

            if voted_up:
                rating = 3.0 + (score * 2.0)   # 긍정 리뷰 → 3.0~5.0점
            else:
                rating = score * 2.0           # 부정 리뷰 → 0.0~2.0점

            # ✅ 날짜 변환 (timestamp / datetime 대응)
            value = row.get("timestamp_created")
            if isinstance(value, (int, float)):
                review_date = datetime.fromtimestamp(value)
            else:
                review_date = pd.to_datetime(value)

            cursor.execute("""
                INSERT INTO tb_review (product_id, review_text, rating, review_date, source)
                VALUES (%s, %s, %s, %s, %s)
            """, (product_id, review_text, rating, review_date, "Steam"))

            inserted += 1

        except Exception as e:
            print(f"⚠️ 삽입 오류: {e}")
            skipped += 1

    conn.commit()
    conn.close()
    print(f"✅ '{product_name}' 리뷰 삽입 완료: {inserted}개 성공 / {skipped}개 실패")


# =====================================================
# ✅ 4. 실행 진입점
# =====================================================
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("⚙️ 사용법: python insert_steam_reviews.py <json파일경로> <제품명> [브랜드명]")
        sys.exit(1)

    json_path = sys.argv[1]
    product_name = sys.argv[2]
    brand_name = sys.argv[3] if len(sys.argv) > 3 else None

    insert_steam_reviews(json_path, product_name, brand_name)
