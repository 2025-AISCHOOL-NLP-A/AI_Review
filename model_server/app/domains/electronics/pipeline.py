import json
import os
from transformers import pipeline as hf_pipeline

# =========================================================
# 설정 로드
# =========================================================
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
cfg = json.load(open(CONFIG_PATH, encoding="utf-8"))

ASPECTS = cfg["aspect_labels"]
ASPECT_GROUPS = cfg["aspect_groups"]
LABEL_MAP = cfg["label_map"]

# =========================================================
# 1️⃣ 모델 초기화 (캐싱)
# =========================================================
_pipeline_cache = None


def get_absa_pipeline():
    """ABSA 파이프라인 싱글톤 (한 번만 로드)"""
    global _pipeline_cache
    if _pipeline_cache is None:
        print(f"📦 Loading Electronics ABSA model: {cfg['model']}")
        _pipeline_cache = hf_pipeline(
            task="text-classification",
            model=cfg["model"],
            tokenizer=cfg["model"],
            return_all_scores=True,
        )
    return _pipeline_cache


# =========================================================
# 2️⃣ Aspect별 감성 분석
# =========================================================
def analyze_aspects_single_phase(text, debug=False):
    """
    단일 모델로 모든 aspect에 대해 감성 분석 수행
    Returns: {aspect: {"label": "긍정/중립/부정", "score": 0.95}}
    """
    absa = get_absa_pipeline()
    results = {}

    if debug:
        print(f"\n🔍 [DEBUG] 리뷰 분석 중: {text[:50]}...")

    for aspect in ASPECTS:
        input_text = f"{aspect}: {text}"
        preds = absa(input_text)

        # 가장 높은 점수의 라벨 선택
        best_pred = max(preds[0], key=lambda x: x["score"])
        label_raw = best_pred["label"]
        score = round(best_pred["score"], 4)

        if debug:
            print(f"  {aspect:15s} → {label_raw} ({score:.3f})")

        # LABEL_3 (언급없음)은 제외
        if label_raw == "LABEL_3":
            continue

        # 라벨 변환
        label_kr = LABEL_MAP.get(label_raw, "중립")

        results[aspect] = {"label": label_kr, "score": score}

    if debug:
        print(f"  ✅ 탐지된 aspect 수: {len(results)}")

    return results


# =========================================================
# 3️⃣ 그룹별 감성 압축
# =========================================================
def compress_to_groups(aspect_results):
    """
    20개 aspect를 6개 그룹으로 압축
    그룹 내 감성 합산 후 최종 감성 결정
    """
    label_to_value = {"부정": -1, "중립": 0, "긍정": 1}
    compressed_label_map = {1: "긍정", 0: "중립", -1: "부정"}

    compressed = {}

    for group_name, aspects in ASPECT_GROUPS.items():
        values = []
        scores = []  # 점수도 함께 저장

        for asp in aspects:
            if asp in aspect_results:
                label = aspect_results[asp]["label"]
                score = aspect_results[asp]["score"]
                if label in label_to_value:
                    values.append(label_to_value[label])
                    scores.append(score)

        if values:
            s = sum(values)
            # 합이 양수면 긍정, 음수면 부정, 0이면 중립
            compressed_value = (s > 0) - (s < 0)
            avg_score = sum(scores) / len(scores) if scores else 0.5
            
            compressed[group_name] = {
                "label": compressed_label_map[compressed_value],
                "raw_sum": s,
                "count": len(values),
                "avg_score": avg_score,  # 평균 점수 추가
            }

    return compressed


# =========================================================
# 4️⃣ 통합 리뷰 분석 (Steam 인터페이스 호환)
# =========================================================
def analyze_review(text, debug=False):
    """
    Steam pipeline과 동일한 인터페이스
    Returns: {
        "text": "리뷰 텍스트",
        "aspects": ["가격", "기능/성능", ...],
        "results": [
            {"aspect": "가격", "label": "긍정", "POS": 0.8, "NEG": 0.2},
            ...
        ]
    }
    """
    # 1. 20개 aspect별 분석
    aspect_results = analyze_aspects_single_phase(text, debug=debug)

    # 2. 6개 그룹으로 압축
    compressed = compress_to_groups(aspect_results)

    # 3. Steam 형식으로 변환
    results = []
    detected_aspects = []

    for group_name, data in compressed.items():
        label = data["label"]
        avg_score = data["avg_score"]

        # POS/NEG 점수 생성 (모델 점수 기반)
        if label == "긍정":
            pos = avg_score
            neg = 1 - avg_score
        elif label == "부정":
            neg = avg_score
            pos = 1 - avg_score
        else:  # 중립
            pos = 0.5
            neg = 0.5

        results.append(
            {"aspect": group_name, "label": label, "POS": round(pos, 3), "NEG": round(neg, 3)}
        )

        detected_aspects.append(group_name)

    return {"text": text, "aspects": detected_aspects, "results": results}


# =========================================================
# 🧪 테스트 코드
# =========================================================
if __name__ == "__main__":
    import sys
    import os

    # 경로 설정
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_server_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
    if model_server_dir not in sys.path:
        sys.path.insert(0, model_server_dir)

    from utils.db_connect import init_db_pool, close_db_pool, get_connection

    # 테스트용 product_id
    product_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1008

    try:
        print("🔧 DB Connection Pool 초기화 중...")
        init_db_pool()

        print(f"\n📦 제품 {product_id}의 리뷰 조회 중...")
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT review_id, review_text FROM tb_review WHERE product_id = %s LIMIT 5",
            (product_id,),
        )
        reviews = cursor.fetchall()
        conn.close()

        if not reviews:
            print(f"❌ 제품 {product_id}의 리뷰가 없습니다.")
            sys.exit(1)

        print(f"✅ 리뷰 {len(reviews)}개 발견\n")

        # 각 리뷰 분석
        for idx, review in enumerate(reviews, 1):
            review_id = review["review_id"]
            review_text = review["review_text"]

            print(f"{'=' * 80}")
            print(f"📝 리뷰 #{idx} (review_id={review_id})")
            print(f"{'=' * 80}")
            print(f"내용: {review_text[:100]}{'...' if len(review_text) > 100 else ''}\n")

            # 분석 수행
            result = analyze_review(review_text, debug=True)

            # 결과 출력
            print(f"\n🎯 탐지된 Aspects: {', '.join(result['aspects'])}\n")
            print("📊 분석 결과:")
            for r in result["results"]:
                print(
                    f"  - {r['aspect']:15s} → {r['label']:4s} (POS: {r['POS']:.3f}, NEG: {r['NEG']:.3f})"
                )
            print()

        print(f"✅ 테스트 완료!")

    except Exception as e:
        print(f"\n❌ 테스트 실패: {e}")
        import traceback

        traceback.print_exc()

    finally:
        print("\n🧹 DB Connection Pool 정리 중...")
        close_db_pool()
