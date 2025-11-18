import os
import json
import time
from typing import List, Dict, Any

import torch
from loguru import logger
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
# 1. 모델 초기화 (캐싱)
# =========================================================
_pipeline_cache = None
_pipeline_device = -1  # -1: CPU, 0+: GPU index

def get_absa_pipeline():
    """ABSA 파이프라인 싱글톤 (한 번만 로드)"""
    global _pipeline_cache, _pipeline_device
    if _pipeline_cache is None:
        try:
            _pipeline_device = 0 if torch.cuda.is_available() else -1
            logger.info(f"화장품 ABSA model 로드 중: {cfg['absa_model']} (device={_pipeline_device})")
            _pipeline_cache = hf_pipeline(
                task="text-classification",
                model=cfg['absa_model'],
                tokenizer=cfg['absa_model'],
                return_all_scores=True,
                device=_pipeline_device,
            )
        except Exception as e:
            logger.exception("Cosmetics ABSA 파이프라인 로딩 실패")
            raise RuntimeError(f"Failed to load cosmetics ABSA model '{cfg['absa_model']}': {e}")
    return _pipeline_cache

# =========================================================
# 2. Aspect별 감성 분석
# =========================================================
def analyze_aspects_single_phase(text, debug=False, max_length: int | None = 256):
    """
    단일 모델로 모든 aspect에 대해 감성 분석 수행
    Returns: {aspect: {"label": "긍정/중립/부정", "score": 0.95}}
    """
    absa = get_absa_pipeline()
    results = {}

    if debug:
        print(f"\n [DEBUG] 리뷰 분석 중: {text[:50]}...")

    for aspect in ASPECTS:
        input_text = f"{aspect}: {text}"
        preds = absa(
            input_text,
            truncation=True,
            padding=True,
            max_length=max_length if max_length else 256,
            batch_size=16,
        )

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
        print(f"  탐지된 aspect 수: {len(results)}")

    return results

# =========================================================
# 3-1. 그룹별 감성 압축
# =========================================================
def compress_to_groups(aspect_results):
    """
    35개 aspect를 6개 그룹으로 압축
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
# 3-2. 배치(Batch) 분석 (여러 리뷰 한 번에)
# =========================================================
def analyze_reviews(texts: List[str], debug: bool = False, batch_size: int = 16, max_length: int | None = 256) -> List[Dict[str, Any]]:
    """
    여러 리뷰 텍스트를 Batch로 분석하여 Steam 호환 형식으로 반환
    """
    if not texts:
        return []

    absa = get_absa_pipeline()

    # 입력 전개: 각 리뷰에 대해 모든 aspect 결합
    expanded_inputs: List[tuple[int, str, str]] = []  # (text_index, aspect, input_text)
    for ti, text in enumerate(texts):
        for aspect in ASPECTS:
            expanded_inputs.append((ti, aspect, f"{aspect}: {text}"))

    # Batch 추론
    start = time.monotonic()
    preds_all: List[Any] = []
    for i in range(0, len(expanded_inputs), batch_size):
        chunk = expanded_inputs[i:i + batch_size]
        inputs = [item[2] for item in chunk]
        preds_chunk = absa(
            inputs,
            truncation=True,
            padding=True,
            max_length=max_length if max_length else 256,
            batch_size=batch_size
        )
        preds_all.extend(preds_chunk)
    elapsed = (time.monotonic() - start) * 1000
    logger.info(f"[Cosmetics] 배치 추론 완료: reviews={len(texts)}, inputs={len(expanded_inputs)}, {elapsed:.1f}ms")

    # 결과 재구성: 텍스트별 aspect 결과 맵
    per_text_aspect: List[Dict[str, Dict[str, float]]] = [dict() for _ in texts]
    for (ti, aspect, _), pred in zip(expanded_inputs, preds_all):
        best_pred = max(pred[0], key=lambda x: x["score"])
        label_raw = best_pred["label"]
        if label_raw == "LABEL_3":
            continue
        score = round(best_pred["score"], 4)
        label_kr = LABEL_MAP.get(label_raw, "중립")
        per_text_aspect[ti][aspect] = {"label": label_kr, "score": score}

    # 그룹 압축 후 Steam 형식으로 변환
    outputs: List[Dict[str, Any]] = []
    for text, aspect_map in zip(texts, per_text_aspect):
        compressed = compress_to_groups(aspect_map)
        results = []
        detected_aspects = []
        for group_name, data in compressed.items():
            label = data["label"]
            avg_score = data["avg_score"]

            if label == "긍정":
                pos = avg_score
                neg = 1 - avg_score
            elif label == "부정":
                neg = avg_score
                pos = 1 - avg_score
            else:
                pos = 0.5
                neg = 0.5

            results.append({"aspect": group_name, "label": label, "POS": round(pos, 3), "NEG": round(neg, 3)})
            detected_aspects.append(group_name)

        outputs.append({"text": text, "aspects": detected_aspects, "results": results})

    if debug:
        logger.debug(f"[Cosmetics] 배치 결과 개수: {len(outputs)}")

    return outputs

# =========================================================
# 4. 통합 리뷰 분석 (Steam 인터페이스와 호환)
# =========================================================
def analyze_review(text, debug=False):
    """
    Steam pipeline과 동일한 인터페이스
    Returns: {
        "text": "리뷰 텍스트",
        "aspects": ["가격", "기능/효과", ...],
        "results": [
            {"aspect": "가격", "label": "긍정", "POS": 0.8, "NEG": 0.2},
            ...
        ]
    }
    """
    # 1. 35개 aspect별 분석
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
# 5. 테스트
# =========================================================
""""
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="화장품 ABSA 파이프라인 테스트")
    parser.add_argument("--text", type=str, help="분석할 리뷰 텍스트")
    parser.add_argument("--debug", action="store_true", help="디버그 모드 (aspect별 상세 출력)")
    args = parser.parse_args()

    sample_texts = [
        "끈적이고 흡수력이 안 좋아요. 여러 가지 화장품 바르는 걸 싫어해서 한 번에 해결된다는 이 화장품으로 선택했는데 유분기가 많아서 별로예요. 잘 발리지 않고 제형이 묽어서 사용하기 불편해요.",
        "가격은 합리적이고 향도 은은해서 하루 종일 기분이 좋아요. 발림성이 좋아서 소량만 써도 충분합니다.",
    ]

    texts_to_run = [args.text] if args.text else sample_texts

    for idx, text in enumerate(texts_to_run, start=1):
        result = analyze_review(text, debug=args.debug)

        print("\n--- 6개 그룹 키워드 분석 결과 ---")
        print(f"[{idx}] 리뷰 텍스트: {result['text']}")
        for item in result["results"]:
            print(f"  - {item['aspect']}: {item['label']} (POS: {item['POS']}, NEG: {item['NEG']})")
            """