import base64
import os
import re
import sys
from collections import Counter
from io import BytesIO

from dotenv import load_dotenv
from konlpy.tag import Okt
from wordcloud import WordCloud

# Local import when executed as a script
if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_server_dir = os.path.dirname(current_dir)
    if model_server_dir not in sys.path:
        sys.path.insert(0, model_server_dir)

from utils.db_connect import get_connection

load_dotenv()


# ---------------------------------------------------------------------------
# Path helpers
# ---------------------------------------------------------------------------
def get_font_path():
    """Find a usable font path for wordcloud generation."""
    candidates = []

    env_font = os.environ.get("WORCLOUD_FONT") or os.environ.get("WORDCLOUD_FONT")
    if env_font:
        candidates.append(env_font)

    cwd = os.getcwd()
    candidates.extend(
        [
            os.path.join(cwd, "malgun.ttf"),
            os.path.join(cwd, "NanumGothic.ttf"),
            "malgun.ttf",
            "NanumGothic.ttf",
            r"C:\Windows\Fonts\malgun.ttf",
            "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
            "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        ]
    )

    for path in candidates:
        if path and os.path.exists(path):
            return path

    print(
        "[wordcloud] 경고: 사용할 글꼴을 찾지 못했습니다. "
        "WORCLOUD_FONT 또는 WORDCLOUD_FONT 환경변수로 직접 TTF 경로를 지정해주세요."
    )
    return None


def get_model_server_dir():
    current_file = os.path.abspath(__file__)
    utils_dir = os.path.dirname(current_file)
    return os.path.dirname(utils_dir)


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------
def fetch_product_info(cursor, product_id: int):
    cursor.execute(
        "SELECT product_name, brand FROM tb_product WHERE product_id = %s", (product_id,)
    )
    info = cursor.fetchone()
    return (info["product_name"], info["brand"]) if info else (None, None)


def fetch_reviews(cursor, product_id: int, start_date: str = None, end_date: str = None):
    where_clause = "WHERE product_id = %s"
    params = [product_id]
    if start_date:
        where_clause += " AND DATE(review_date) >= %s"
        params.append(start_date)
    if end_date:
        where_clause += " AND DATE(review_date) <= %s"
        params.append(end_date)

    cursor.execute(
        f"SELECT review_text FROM tb_review {where_clause}",
        tuple(params),
    )
    return [r["review_text"] for r in cursor.fetchall() if r["review_text"]]


# ---------------------------------------------------------------------------
# Stopword / token helpers
# ---------------------------------------------------------------------------
def load_stopwords(domain="steam", debug=False):
    stopwords = set()

    current_dir = os.path.dirname(os.path.abspath(__file__))
    stopword_dir = os.path.join(current_dir, "stopwords")
    base_path = os.path.join(stopword_dir, "base.txt")
    domain_path = os.path.join(stopword_dir, f"{domain}.txt")

    for path in [base_path, domain_path]:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8-sig") as f:
                for line in f:
                    word = line.strip().replace("\ufeff", "").replace("\t", "").replace(" ", "")
                    if word:
                        stopwords.add(word)
            if debug:
                print(f"[wordcloud] 불용어 로드: {os.path.basename(path)}")
        elif debug:
            print(f"[wordcloud] 불용어 파일 없음: {os.path.basename(path)}")

    if debug:
        print(f"[wordcloud] 불용어 총 {len(stopwords)}개 (domain={domain})")

    return stopwords


def add_product_stopwords(stopwords, product_name: str, brand: str, debug: bool):
    if product_name:
        words = product_name.split()
        for word in words:
            if word.strip() and len(word.strip()) > 1:
                stopwords.add(word.strip())
        if product_name.strip():
            stopwords.add(product_name.strip())
        if debug:
            print(f"[wordcloud] 상품명 불용어 추가: {product_name}")

    if brand:
        brand_clean = brand.strip()
        if brand_clean and len(brand_clean) > 1:
            stopwords.add(brand_clean)
            if debug:
                print(f"[wordcloud] 브랜드 불용어 추가: {brand}")


def chunk_long_text(text: str, max_length: int):
    parts = []
    current = ""
    for char in text:
        current += char
        if len(current) >= max_length:
            parts.append(current)
            current = ""
    if current:
        parts.append(current)
    return parts


def tokenize_batch(okt, batch_text: str, max_length: int, batch_index: int):
    effective_texts = (
        chunk_long_text(batch_text, max_length) if len(batch_text) > max_length else [batch_text]
    )
    tokens = []
    for idx, text_part in enumerate(effective_texts):
        try:
            part_tokens = [
                t for t, pos in okt.pos(text_part) if pos in ["Noun", "Adjective"] and len(t) > 1
            ]
            tokens.extend(part_tokens)
        except Exception as e:
            print(f"[wordcloud] ⚠️ 배치 {batch_index} 부분 {idx + 1} 처리 오류 (건너뜀): {e}")
    return tokens


def tokenize_reviews(reviews, batch_size=100, max_text_length=30000):
    print("[wordcloud] 형태소 분석 시작...")
    okt = Okt()
    all_tokens = []
    num_batches = (len(reviews) + batch_size - 1) // batch_size

    for i in range(0, len(reviews), batch_size):
        batch_num = i // batch_size + 1
        batch_reviews = reviews[i : i + batch_size]
        batch_text = " ".join(batch_reviews)
        batch_text = re.sub(r"[^가-힣A-Za-z0-9\s]", " ", batch_text)

        all_tokens.extend(tokenize_batch(okt, batch_text, max_text_length, batch_num))
        print(f"   진행: {batch_num}/{num_batches} 배치 완료 ({len(all_tokens)}개 토큰)")

    print(f"[wordcloud] 형태소 분석 완료: {len(all_tokens)}개 토큰 추출")
    return all_tokens


def filter_tokens(tokens, stopwords, product_name: str, brand: str, debug: bool):
    filtered_tokens = []
    removed = []

    if debug:
        print(f"[wordcloud] 불용어 갯수: {len(stopwords)}")

    for token in tokens:
        normalized = token.strip()
        if not normalized:
            continue

        if normalized in stopwords:
            removed.append(normalized)
            continue
        if any(sw in normalized for sw in stopwords if len(sw) > 1):
            removed.append(normalized)
            continue
        if product_name and normalized in product_name:
            removed.append(normalized)
            continue
        if brand and normalized in brand:
            removed.append(normalized)
            continue

        filtered_tokens.append(normalized)

    if debug:
        tokens_before = len(tokens)
        print(f"[wordcloud] 불용어 제거 통계: before={tokens_before}, after={len(filtered_tokens)}, removed={tokens_before - len(filtered_tokens)}")
        if removed:
            removed_counter = Counter(removed)
            print(f"[wordcloud] 상위 제거 단어: {dict(removed_counter.most_common(10))}")

    return filtered_tokens


def limit_reviews(reviews, max_reviews=2000):
    if len(reviews) <= max_reviews:
        return reviews
    import random

    sampled = reviews[-max_reviews:] if len(reviews) > max_reviews * 2 else random.sample(reviews, max_reviews)
    print(f"[wordcloud] 성능 최적화: {len(reviews)}개 → {len(sampled)}개 샘플링")
    return sampled


def build_wordcloud(freq, font_path):
    return WordCloud(
        font_path=font_path,
        width=1000,
        height=700,
        background_color="white",
        colormap="tab10",
    ).generate_from_frequencies(freq)


# ---------------------------------------------------------------------------
# Public APIs
# ---------------------------------------------------------------------------
def generate_wordcloud_from_db(product_id: int, domain="steam", start_date: str = None, end_date: str = None):
    conn = get_connection()
    cursor = conn.cursor()

    product_name, brand = fetch_product_info(cursor, product_id)
    reviews = fetch_reviews(cursor, product_id, start_date, end_date)

    if not reviews:
        conn.close()
        return None

    print(f"[wordcloud] 총 리뷰 수: {len(reviews)}")
    reviews = limit_reviews(reviews)

    tokens = tokenize_reviews(reviews)
    stopwords = load_stopwords(domain, debug=True)
    add_product_stopwords(stopwords, product_name, brand, debug=True)
    tokens = filter_tokens(tokens, stopwords, product_name, brand, debug=True)

    freq = dict(Counter(tokens).most_common(200))
    if not freq:
        conn.close()
        return None

    model_server_dir = get_model_server_dir()
    static_dir = os.path.join(model_server_dir, "static", "wordclouds")
    os.makedirs(static_dir, exist_ok=True)

    suffix = ""
    if start_date or end_date:
        start_token = start_date.replace("-", "") if start_date else "start"
        end_token = end_date.replace("-", "") if end_date else "end"
        suffix = f"_{start_token}_{end_token}"

    save_path = os.path.join(static_dir, f"product_{product_id}_wc{suffix}.png")
    public_path = f"/static/wordclouds/product_{product_id}_wc{suffix}.png"

    font_path = get_font_path()
    if not font_path:
        conn.close()
        return None

    try:
        wc = build_wordcloud(freq, font_path)
    except Exception as e:
        print(f"[wordcloud] generate_wordcloud_from_db 실패: {e}, font_path={font_path}")
        conn.close()
        return None

    wc.to_file(save_path)

    if not start_date and not end_date:
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


def generate_wordcloud_base64(product_id: int, domain="steam", start_date: str = None, end_date: str = None):
    """
    파일 저장 없이 메모리에서 워드클라우드를 생성해 base64 문자열을 반환합니다.
    """
    conn = get_connection()
    cursor = conn.cursor()

    product_name, brand = fetch_product_info(cursor, product_id)
    reviews = fetch_reviews(cursor, product_id, start_date, end_date)

    if not reviews:
        conn.close()
        return None

    reviews = limit_reviews(reviews)
    tokens = tokenize_reviews(reviews)

    stopwords = load_stopwords(domain, debug=False)
    add_product_stopwords(stopwords, product_name, brand, debug=False)
    tokens = filter_tokens(tokens, stopwords, product_name, brand, debug=False)

    freq = dict(Counter(tokens).most_common(200))
    if not freq:
        conn.close()
        return None

    font_path = get_font_path()
    if not font_path:
        conn.close()
        return None

    try:
        wc = build_wordcloud(freq, font_path)
    except Exception as e:
        print(f"[wordcloud] generate_wordcloud_base64 실패: {e}, font_path={font_path}")
        conn.close()
        return None

    buffer = BytesIO()
    wc.to_image().save(buffer, format="PNG")
    base64_img = base64.b64encode(buffer.getvalue()).decode("utf-8")

    conn.close()
    return f"data:image/png;base64,{base64_img}"


# ---------------------------------------------------------------------------
# CLI execution (manual test)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    from utils.db_connect import init_db_pool, close_db_pool

    product_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1038
    domain = sys.argv[2] if len(sys.argv) > 2 else "electronics"

    try:
        print("[wordcloud] DB Connection Pool 초기화")
        init_db_pool()

        print(f"\n[wordcloud] 워드클라우드 생성 시작 (product_id={product_id}, domain={domain})")
        wc_path = generate_wordcloud_from_db(product_id, domain)

        if wc_path:
            print(f"\n[wordcloud] 생성 완료: {wc_path}")
        else:
            print("\n[wordcloud] 생성 실패")

    except Exception as e:
        print(f"\n[wordcloud] 실패: {e}")
        import traceback

        traceback.print_exc()
    finally:
        try:
            close_db_pool()
        except Exception:
            pass
