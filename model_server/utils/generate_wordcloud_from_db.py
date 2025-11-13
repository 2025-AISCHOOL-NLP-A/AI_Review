import os
import re
import pymysql
from konlpy.tag import Okt
from collections import Counter
from wordcloud import WordCloud
from dotenv import load_dotenv

load_dotenv()

# ======================================
# 🔹 model_server 디렉토리 경로 (절대 경로)
# ======================================
def get_model_server_dir():
    """현재 파일 기준으로 model_server 디렉토리 경로 반환"""
    current_file = os.path.abspath(__file__)  # generate_wordcloud_from_db.py의 절대 경로
    utils_dir = os.path.dirname(current_file)  # utils 디렉토리
    model_server_dir = os.path.dirname(utils_dir)  # model_server 디렉토리
    return model_server_dir


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
                    # 공백, 탭, 개행 문자 모두 제거하고 정제
                    word = line.strip().replace("\ufeff", "").replace("\t", "").replace(" ", "")
                    # 빈 문자열이 아니고 의미있는 단어만 추가
                    if word and len(word) > 0:
                        stopwords.add(word)

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
        conn.close()
        return None

    # 2️⃣ 텍스트 정제
    text_all = " ".join(reviews)
    text_all = re.sub(r"[^ㄱ-ㅎ가-힣a-zA-Z0-9\s]", " ", text_all)

    # 3️⃣ 형태소 분석
    okt = Okt()
    tokens = [
        t for t, pos in okt.pos(text_all) if pos in ["Noun", "Adjective"] and len(t) > 1
    ]

    # 4️⃣ 불용어 제거
    stopwords = load_stopwords(domain)
    # 토큰도 공백 제거 후 비교
    tokens = [t.strip() for t in tokens if t.strip() and t.strip() not in stopwords]

    # 5️⃣ 빈도 계산
    freq = dict(Counter(tokens).most_common(200))
    if not freq:
        conn.close()
        return None

    # 6️⃣ 워드클라우드 생성 및 저장 (절대 경로 사용)
    model_server_dir = get_model_server_dir()
    static_dir = os.path.join(model_server_dir, "static", "wordclouds")

    os.makedirs(static_dir, exist_ok=True)

    save_path = os.path.join(static_dir, f"product_{product_id}_wc.png")
    public_path = f"/static/wordclouds/product_{product_id}_wc.png"

    wc = WordCloud(
        font_path="malgun.ttf",
        width=1000,
        height=700,
        background_color="white",
        colormap="tab10",
    ).generate_from_frequencies(freq)

    wc.to_file(save_path)

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
    conn.close()
    return public_path


# ======================================
# 🔹 실행 (테스트)
# ======================================
if __name__ == "__main__":
    product_id = 1011  # 테스트할 제품 ID 입력
    generate_wordcloud_from_db(product_id, domain="steam")