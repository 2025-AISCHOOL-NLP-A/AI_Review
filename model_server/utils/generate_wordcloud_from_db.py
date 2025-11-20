import os
import re
import sys
from konlpy.tag import Okt
from collections import Counter
from wordcloud import WordCloud
from dotenv import load_dotenv

# 경로 설정 (독립 실행 시)
if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_server_dir = os.path.dirname(current_dir)
    if model_server_dir not in sys.path:
        sys.path.insert(0, model_server_dir)

from utils.db_connect import get_connection

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
# 🔹 불용어 로드 함수 (절대경로 + 로그 포함)
# ======================================
def load_stopwords(domain="steam", debug=False):
    stopwords = set()

    # 🔹 현재 파일(app/utils/generate_wordcloud_from_db.py) 기준 경로
    current_dir = os.path.dirname(os.path.abspath(__file__))
    stopword_dir = os.path.join(current_dir, "stopwords")  # ✅ 같은 폴더
    base_path = os.path.join(stopword_dir, "base.txt")
    domain_path = os.path.join(stopword_dir, f"{domain}.txt")

    loaded_count = 0
    for path in [base_path, domain_path]:
        if os.path.exists(path):
            file_count = 0
            with open(path, "r", encoding="utf-8-sig") as f:
                for line in f:
                    # 공백, 탭, 개행 문자 모두 제거하고 정제
                    word = line.strip().replace("\ufeff", "").replace("\t", "").replace(" ", "")
                    # 빈 문자열이 아니고 의미있는 단어만 추가
                    if word and len(word) > 0:
                        stopwords.add(word)
                        file_count += 1
            loaded_count += file_count
            if debug:
                print(f"📝 불용어 파일 로드: {os.path.basename(path)} - {file_count}개 단어")
        else:
            if debug:
                print(f"⚠️ 불용어 파일 없음: {os.path.basename(path)}")
    
    if debug:
        print(f"✅ 총 불용어 로드: {len(stopwords)}개 (domain={domain})")
    
    return stopwords


# ======================================
# 🔹 워드클라우드 생성 함수
# ======================================
def generate_wordcloud_from_db(product_id: int, domain="steam", start_date: str = None, end_date: str = None):
    conn = get_connection()
    cursor = conn.cursor()

    # 0️⃣ 제품 정보 조회 (제품명, 브랜드를 불용어에 추가하기 위해)
    cursor.execute(
        "SELECT product_name, brand FROM tb_product WHERE product_id = %s", (product_id,)
    )
    product_info = cursor.fetchone()
    product_name = product_info["product_name"] if product_info else None
    brand = product_info["brand"] if product_info else None

    # 1️⃣ 리뷰 불러오기 (기간 필터 적용)
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
    reviews = [r["review_text"] for r in cursor.fetchall() if r["review_text"]]

    if not reviews:
        conn.close()
        return None

    print(f"📊 총 리뷰 수: {len(reviews)}개")
    
    # 성능 최적화: 리뷰가 많을 경우 샘플링 (최대 2000개로 줄임 - 메모리 부족 방지)
    MAX_REVIEWS = 2000
    if len(reviews) > MAX_REVIEWS:
        import random
        # 최근 리뷰 우선 샘플링
        reviews_sample = reviews[-MAX_REVIEWS:] if len(reviews) > MAX_REVIEWS * 2 else random.sample(reviews, MAX_REVIEWS)
        print(f"⚡ 성능 최적화: {len(reviews)}개 중 {len(reviews_sample)}개 샘플링하여 처리")
        reviews = reviews_sample

    # 2️⃣ 텍스트 정제 및 배치 처리
    print("📝 텍스트 정제 및 형태소 분석 중... (시간이 걸릴 수 있습니다)")
    okt = Okt()
    
    # 메모리 효율성을 위해 리뷰를 작은 배치로 나누어 처리
    REVIEW_BATCH_SIZE = 100  # 한 번에 처리할 리뷰 수
    MAX_TEXT_LENGTH = 30000  # 한 번에 처리할 최대 텍스트 길이 (문자)
    
    all_tokens = []
    num_batches = (len(reviews) + REVIEW_BATCH_SIZE - 1) // REVIEW_BATCH_SIZE
    
    for i in range(0, len(reviews), REVIEW_BATCH_SIZE):
        batch_reviews = reviews[i:i + REVIEW_BATCH_SIZE]
        batch_text = " ".join(batch_reviews)
        batch_text = re.sub(r"[^ㄱ-ㅎ가-힣a-zA-Z0-9\s]", " ", batch_text)
        
        # 텍스트가 너무 길면 더 작게 나누기
        if len(batch_text) > MAX_TEXT_LENGTH:
            # 텍스트를 여러 부분으로 나누기
            text_parts = []
            current_part = ""
            for char in batch_text:
                current_part += char
                if len(current_part) >= MAX_TEXT_LENGTH:
                    text_parts.append(current_part)
                    current_part = ""
            if current_part:
                text_parts.append(current_part)
            
            for part_idx, text_part in enumerate(text_parts):
                try:
                    ## 원형 처리 x 버전
                    part_tokens = [
                        t for t, pos in okt.pos(text_part) 
                        if pos in ["Noun", "Adjective"] and len(t) > 1
                    ]
                    all_tokens.extend(part_tokens)
                    ## 원형 처리 버전
                    # part_tokens = []
                    # morphs = okt.pos(text_part, stem=True)
                    # for t, pos in morphs:
                    #     if pos in ["Noun", "Adjective"] and len(t) > 1: # ["Noun", "Adjective", "Verb"]
                    #         part_tokens.append(t)
                    all_tokens.extend(part_tokens)
                except Exception as e:
                    print(f"⚠️ 배치 {i//REVIEW_BATCH_SIZE + 1}의 부분 {part_idx + 1} 처리 중 오류 (건너뜀): {e}")
                    continue
        else:
            try:
                ## 원형 처리 x 버전
                batch_tokens = [
                    t for t, pos in okt.pos(batch_text) 
                    if pos in ["Noun", "Adjective"] and len(t) > 1
                ]
                ## 원형 처리 버전
                # batch_tokens = []
                # morphs = okt.pos(batch_text, stem=True)
                # for t, pos in morphs:
                #     if pos in ["Noun", "Adjective"] and len(t) > 1: # ["Noun", "Adjective", "Verb"]
                #         batch_tokens.append(t)
                all_tokens.extend(batch_tokens)
            except Exception as e:
                print(f"⚠️ 배치 {i//REVIEW_BATCH_SIZE + 1} 처리 중 오류 (건너뜀): {e}")
                continue
        
        # 진행 상황 출력
        batch_num = i // REVIEW_BATCH_SIZE + 1
        print(f"   진행: {batch_num}/{num_batches} 배치 완료 ({len(all_tokens)}개 토큰 수집)")
    
    tokens = all_tokens
    print(f"✅ 형태소 분석 완료: {len(tokens)}개 토큰 추출")

    # 4️⃣ 불용어 제거
    stopwords = load_stopwords(domain, debug=True)
    
    # 제품명과 브랜드를 불용어에 추가
    if product_name:
        # 제품명을 공백으로 분리하여 각 단어도 추가
        product_words = product_name.split()
        for word in product_words:
            word_clean = word.strip()
            if word_clean and len(word_clean) > 1:
                stopwords.add(word_clean)
        # 전체 제품명도 추가
        product_name_clean = product_name.strip()
        if product_name_clean:
            stopwords.add(product_name_clean)
        print(f"📝 제품명 불용어 추가: {product_name} (단어: {product_words})")
    
    if brand:
        brand_clean = brand.strip()
        if brand_clean and len(brand_clean) > 1:
            stopwords.add(brand_clean)
            print(f"📝 브랜드 불용어 추가: {brand}")
    
    # 토큰 정규화 및 불용어 제거
    tokens_before = len(tokens)
    filtered_tokens = []
    removed_words = []
    
    # 불용어 확인용 디버깅
    print(f"🔍 불용어 세트 크기: {len(stopwords)}개")
    test_words = ["새끼", "병신", "씨발"]
    for test_word in test_words:
        if test_word in stopwords:
            print(f"   ✅ '{test_word}' 불용어에 포함됨")
        else:
            print(f"   ❌ '{test_word}' 불용어에 없음!")
    
    for token in tokens:
        # 토큰 정규화: 공백 제거
        normalized_token = token.strip()
        if not normalized_token:
            continue
            
        # 불용어 체크: 정확히 일치하거나, 불용어가 토큰에 포함되거나, 토큰이 불용어에 포함되는 경우 제거
        should_remove = False
        remove_reason = None
        
        # 1. 정확히 일치하는 불용어 체크
        if normalized_token in stopwords:
            should_remove = True
            remove_reason = "불용어 일치"
        # 2. 불용어가 토큰에 포함되는 경우 (예: "개새끼" -> "새끼" 포함)
        elif any(sw in normalized_token for sw in stopwords if len(sw) > 1):
            should_remove = True
            remove_reason = "불용어 포함"
        # 3. 토큰이 불용어에 포함되는 경우 (예: "새" -> "새끼"에 포함, 하지만 이건 제외)
        # 4. 제품명에 포함되는 경우 (부분 매칭)
        elif product_name and normalized_token in product_name:
            should_remove = True
            remove_reason = "제품명 포함"
        # 5. 브랜드에 포함되는 경우 (부분 매칭)
        elif brand and normalized_token in brand:
            should_remove = True
            remove_reason = "브랜드 포함"
        
        if should_remove:
            removed_words.append(normalized_token)
        else:
            filtered_tokens.append(normalized_token)
    
    tokens = filtered_tokens
    tokens_after = len(tokens)
    
    # 디버깅 정보 출력
    print(f"🔍 불용어 제거 통계:")
    print(f"   - 제거 전 토큰 수: {tokens_before}")
    print(f"   - 제거 후 토큰 수: {tokens_after}")
    print(f"   - 제거된 토큰 수: {tokens_before - tokens_after}")
    if removed_words:
        removed_counter = Counter(removed_words)
        print(f"   - 제거된 상위 10개 단어: {dict(removed_counter.most_common(10))}")

    # 5️⃣ 빈도 계산
    freq = dict(Counter(tokens).most_common(200))
    if not freq:
        conn.close()
        return None

    # 6️⃣ 워드클라우드 생성 및 저장 (절대 경로 사용)
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

    wc = WordCloud(
        font_path="malgun.ttf",
        width=1000,
        height=700,
        background_color="white",
        colormap="tab10",
    ).generate_from_frequencies(freq)

    wc.to_file(save_path)

    # 7️⃣ DB 경로 업데이트
    # 대시보드 테이블 업데이트는 전체 기간 기본 경로일 때만 수행 (기간 필터 시에는 파일만 생성)
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


# ======================================
# 🔹 실행 (테스트)
# ======================================
if __name__ == "__main__":
    from utils.db_connect import init_db_pool, close_db_pool
    
    # 테스트용 product_id
    product_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1038
    domain = sys.argv[2] if len(sys.argv) > 2 else "electronics"
    
    try:
        print("🔧 DB Connection Pool 초기화 중...")
        init_db_pool()
        
        print(f"\n🌈 워드클라우드 생성 시작 (product_id={product_id}, domain={domain})")
        wc_path = generate_wordcloud_from_db(product_id, domain)
        
        if wc_path:
            print(f"\n✅ 테스트 성공! 워드클라우드 경로: {wc_path}")
        else:
            print("\n❌ 테스트 실패")
    
    except Exception as e:
        print(f"\n❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        print("\n🧹 DB Connection Pool 정리 중...")
        close_db_pool()
