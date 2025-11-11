import os
import re
import pymysql
from konlpy.tag import Okt
from collections import Counter
from wordcloud import WordCloud
from dotenv import load_dotenv

load_dotenv()


# ======================================
# 🔹 DB 연결 함수
# ======================================
def get_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        charset="utf8mb4",
        autocommit=True,
    )


# ======================================
# 🔹 불용어 로드 함수 (절대경로 + 로그 포함)
# ======================================
def load_stopwords(domain="steam"):
    stopwords = set()

    # 🔹 현재 파일(app/utils/generate_wordcloud_from_db.py) 기준 경로
    current_dir = os.path.dirname(os.path.abspath(__file__))
    stopword_dir = os.path.join(current_dir, "stopwords")  # ✅ 같은 폴더
    base_path = os.path.join(stopword_dir, "base.txt")
    domain_path = os.path.join(stopword_dir, f"{domain}.txt")

    for path in [base_path, domain_path]:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8-sig") as f:
                for line in f:
                    word = line.strip().replace("\ufeff", "")
                    if word:
                        stopwords.add(word)
        else:
            print(f"⚠️ 불용어 파일 없음: {path}")

    print(f"📘 불용어 {len(stopwords)}개 로드 완료 ({domain})")
    print("🔹 일부 불용어 예시:", list(stopwords)[:15])
    return stopwords


# ======================================
# 🔹 워드클라우드 생성 함수
# ======================================
def generate_wordcloud_from_db(product_id: int, domain="steam"):
    conn = get_connection()
    cursor = conn.cursor()

    # 1️⃣ 리뷰 불러오기
    cursor.execute(
        "SELECT review_text FROM tb_review WHERE product_id = %s", (product_id,)
    )
    reviews = [r[0] for r in cursor.fetchall() if r[0]]

    if not reviews:
        print(f"⚠️ 리뷰 없음 (product_id={product_id})")
        conn.close()
        return None

    print(f"🎮 리뷰 {len(reviews)}개 불러옴 (product_id={product_id})")

    # 2️⃣ 텍스트 정제
    text_all = " ".join(reviews)
    text_all = re.sub(r"[^ㄱ-ㅎ가-힣a-zA-Z0-9\s]", " ", text_all)

    # 3️⃣ 형태소 분석
    okt = Okt()
    tokens = [
        t for t, pos in okt.pos(text_all) if pos in ["Noun", "Adjective"] and len(t) > 1
    ]

    print(f"🧩 전체 토큰 수: {len(tokens)}")

    # 4️⃣ 불용어 제거
    stopwords = load_stopwords(domain)
    before_count = len(tokens)
    tokens = [t for t in tokens if t not in stopwords]
    after_count = len(tokens)
    removed_ratio = (
        round((before_count - after_count) / before_count * 100, 2)
        if before_count
        else 0
    )

    print(
        f"🧹 불용어 제거 완료: {before_count - after_count}개 제거 ({removed_ratio}% 필터링됨)"
    )
    print(f"🔸 최종 유효 토큰 수: {after_count}")

    # 5️⃣ 빈도 계산
    freq = dict(Counter(tokens).most_common(200))
    if not freq:
        print("⚠️ 유효 토큰이 없어 워드클라우드 생성 생략")
        conn.close()
        return None

    # 6️⃣ 워드클라우드 생성 및 저장
    os.makedirs("static/wordclouds", exist_ok=True)
    save_path = f"static/wordclouds/product_{product_id}_wc.png"
    public_path = f"/static/wordclouds/product_{product_id}_wc.png"

    wc = WordCloud(
        font_path="malgun.ttf",
        width=1000,
        height=700,
        background_color="white",
        colormap="tab10",
    ).generate_from_frequencies(freq)

    wc.to_file(save_path)
    print(f"✅ 워드클라우드 생성 완료: {save_path}")

    # 7️⃣ DB 경로 업데이트
    cursor.execute(
        """
        UPDATE tb_productDashboard
        SET wordcloud_path = %s
        WHERE product_id = %s
    """,
        (public_path, product_id),
    )
    conn.commit()
    print(f"📦 DB 업데이트 완료 → {public_path}")

    conn.close()
    return public_path


# ======================================
# 🔹 실행 (테스트)
# ======================================
if __name__ == "__main__":
    product_id = 1011  # 테스트할 제품 ID 입력
    generate_wordcloud_from_db(product_id, domain="steam")