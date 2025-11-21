import json
import os
import re
import time
from typing import Any, Dict, List

import numpy as np
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from app.models import ModelRegistry
from .keywords import BOOST_KEYWORDS, NEG_TRIGGERS

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
cfg = json.load(open(CONFIG_PATH, encoding="utf-8"))
ASPECTS = cfg["aspect_labels"]


# =========================================================
# 1️⃣ 문장 분리
# =========================================================
def split_sentences(text, max_sentences=10, min_length=5):
    """
    간단한 문장 분리: 짧은 문장 제외, 개수 제한.
    """
    text = re.sub(r"([^.?!]*?)(?:지만|그러나|반면에)\s*", r"\1. ", text)
    sentences = re.split(r"(?<=[.!?])\s+|[?！？\n]", text)
    filtered = [s.strip() for s in sentences if s.strip() and len(s.strip()) >= min_length]
    return filtered[:max_sentences]


# =========================================================
# 2️⃣ 키워드 Boost
# =========================================================
def boost_aspects(text, probs_dict):
    for aspect, kws in BOOST_KEYWORDS.items():
        if any(k in text for k in kws):
            probs_dict[aspect] = min(probs_dict.get(aspect, 0) + cfg["boost_value"], 1.0)
    return probs_dict


# =========================================================
# 3️⃣ Phase-1 측면 예측
# =========================================================
def detect_aspects_multi(text, threshold=0.35):
    reg = ModelRegistry.get(cfg["phase1_model"], cfg["phase2_model"])
    tok, model = reg["aspect_tokenizer"], reg["aspect_model"]
    device = reg["device"]

    sentences = split_sentences(text)
    total = {}

    print(f"\n[Steam DEBUG] 문장별 측면 확률 로그")
    for s in sentences:
        inputs = tok(s, return_tensors="pt", truncation=True, padding=True).to(device)
        with torch.no_grad():
            logits = model(**inputs).logits
            probs = torch.sigmoid(logits).cpu().numpy()[0]
        detected = {ASPECTS[i]: float(probs[i]) for i in range(len(ASPECTS))}
        detected = boost_aspects(s, detected)
        for asp, prob in detected.items():
            print(f" - {asp:6s} | {s[:35]:35s} → {prob:.3f}")
            if prob >= threshold:
                total[asp] = max(total.get(asp, 0), prob)
    return total


# =========================================================
# 4️⃣ 부정 키워드 보정
# =========================================================
def polarity_correction(text, aspect, label):
    if any(k in text for k in NEG_TRIGGERS) and aspect in ["최적화", "밸런스"]:
        return "부정"
    return label


# =========================================================
# 5️⃣ Phase-2 감정 분류
# =========================================================
def analyze_sentiment(aspect, text):
    reg = ModelRegistry.get(cfg["phase1_model"], cfg["phase2_model"])
    tok, model = reg["sent_tokenizer"], reg["sent_model"]
    device = reg["device"]
    ctx = text if aspect not in text else text[text.find(aspect) - 20 : text.find(aspect) + 30]
    inputs = tok(f"[{aspect}] {ctx}", return_tensors="pt", truncation=True, padding=True).to(device)
    with torch.no_grad():
        probs = torch.softmax(model(**inputs).logits, dim=-1).cpu().numpy()[0]
    pos, neg = float(probs[1]), float(probs[0])
    if abs(pos - neg) < cfg["margin"]:
        label = "중립"
    else:
        label = "긍정" if pos > neg else "부정"
    return {
        "aspect": aspect,
        "POS": pos,
        "NEG": neg,
        "label": polarity_correction(text, aspect, label),
    }


# =========================================================
# 6️⃣ 단일 리뷰 분석
# =========================================================
def analyze_review(text):
    detected = detect_aspects_multi(text)
    results = [analyze_sentiment(asp, text) for asp in detected.keys()]
    return {"text": text, "aspects": list(detected.keys()), "results": results}


# =========================================================
# 배치 보조 함수
# =========================================================
def _collect_sentences(texts, max_sentences_per_review: int, min_length: int):
    all_sentences: List[tuple[int, str]] = []
    for ti, text in enumerate(texts):
        sentences = split_sentences(text, max_sentences=max_sentences_per_review, min_length=min_length)
        for sentence in sentences:
            all_sentences.append((ti, sentence))
    return all_sentences


def _run_phase1(aspect_tok, aspect_model, device, all_sentences, batch_size, threshold, text_count):
    detected_aspects_per_text: List[Dict[str, float]] = [{} for _ in range(text_count)]
    total_batches = (len(all_sentences) + batch_size - 1) // batch_size
    print(f"[Steam] Phase-1: 총 {len(all_sentences)}개 문장, {total_batches}개 배치 처리 예정")

    for i in range(0, len(all_sentences), batch_size):
        batch_num = i // batch_size + 1
        chunk = all_sentences[i : i + batch_size]
        sentences_batch = [item[1] for item in chunk]

        print(f"[Steam] Phase-1 진행: {batch_num}/{total_batches} 배치 처리 중... ({len(chunk)}개 문장)")

        inputs = aspect_tok(sentences_batch, return_tensors="pt", truncation=True, padding=True).to(device)
        with torch.no_grad():
            logits = aspect_model(**inputs).logits
            probs = torch.sigmoid(logits).cpu().numpy()

        detected_count = 0
        for (ti, sentence), prob_row in zip(chunk, probs):
            detected = {ASPECTS[j]: float(prob_row[j]) for j in range(len(ASPECTS))}
            detected = boost_aspects(sentence, detected)

            for asp, prob in detected.items():
                if prob >= threshold:
                    prev = detected_aspects_per_text[ti].get(asp, 0)
                    detected_aspects_per_text[ti][asp] = max(prev, prob)
                    if prev == 0:
                        detected_count += 1

        print(f"[Steam] Phase-1 배치 {batch_num}/{total_batches} 완료: {detected_count}개 측면 감지")

    return detected_aspects_per_text


def _build_sentiment_inputs(texts, detected_aspects_per_text):
    sentiment_inputs: List[tuple[int, str, str, str]] = []
    for ti, text in enumerate(texts):
        for aspect in detected_aspects_per_text[ti].keys():
            ctx = text if aspect not in text else text[text.find(aspect) - 20 : text.find(aspect) + 30]
            sentiment_inputs.append((ti, aspect, text, ctx))
    return sentiment_inputs


def _run_phase2(sent_tok, sent_model, device, sentiment_inputs, batch_size):
    sentiment_results: List[Dict[str, Any]] = [None] * len(sentiment_inputs)
    total_batches = (len(sentiment_inputs) + batch_size - 1) // batch_size

    print(f"[Steam] Phase-2: 총 {len(sentiment_inputs)}개 측면-감정 쌍 {total_batches}개 배치 처리 예정")

    for i in range(0, len(sentiment_inputs), batch_size):
        batch_num = i // batch_size + 1
        chunk = sentiment_inputs[i : i + batch_size]

        print(f"[Steam] Phase-2 진행: {batch_num}/{total_batches} 배치 처리 중... ({len(chunk)}개 측면-감정 쌍)")

        inputs_texts = [f"[{item[1]}] {item[3]}" for item in chunk]
        inputs = sent_tok(inputs_texts, return_tensors="pt", truncation=True, padding=True).to(device)

        with torch.no_grad():
            logits = sent_model(**inputs).logits
            probs = torch.softmax(logits, dim=-1).cpu().numpy()

        pos_count = neg_count = neu_count = 0
        for idx, (ti, aspect, text, _), prob_row in zip(range(i, i + len(chunk)), chunk, probs):
            pos, neg = float(prob_row[1]), float(prob_row[0])
            if abs(pos - neg) < cfg["margin"]:
                label = "중립"
                neu_count += 1
            else:
                label = "긍정" if pos > neg else "부정"
                pos_count += label == "긍정"
                neg_count += label == "부정"

            label = polarity_correction(text, aspect, label)
            sentiment_results[idx] = {
                "aspect": aspect,
                "POS": pos,
                "NEG": neg,
                "label": label,
            }

        print(f"[Steam] Phase-2 배치 {batch_num}/{total_batches} 완료: 긍정 {pos_count}, 부정 {neg_count}, 중립 {neu_count}")

    return sentiment_results


def _merge_results(texts, detected_aspects_per_text, sentiment_inputs, sentiment_results):
    result_map: Dict[tuple[int, str], Dict[str, Any]] = {}
    for (ti, aspect, _, _), result in zip(sentiment_inputs, sentiment_results):
        if result:
            result_map[(ti, aspect)] = result

    outputs: List[Dict[str, Any]] = []
    for ti, text in enumerate(texts):
        detected_aspects = list(detected_aspects_per_text[ti].keys())
        per_text_results = [result_map[(ti, aspect)] for aspect in detected_aspects if (ti, aspect) in result_map]
        outputs.append({"text": text, "aspects": detected_aspects, "results": per_text_results})

    return outputs


# =========================================================
# 7️⃣ 배치(Batch) 분석
# =========================================================
def analyze_reviews(texts: List[str], debug: bool = False, batch_size: int = 16, threshold: float = 0.35) -> List[Dict[str, Any]]:
    """
    여러 리뷰 텍스트를 Batch로 분석해 Steam 형식으로 반환
    """
    if not texts:
        return []

    reg = ModelRegistry.get(cfg["phase1_model"], cfg["phase2_model"])
    aspect_tok, aspect_model = reg["aspect_tokenizer"], reg["aspect_model"]
    sent_tok, sent_model = reg["sent_tokenizer"], reg["sent_model"]
    device = reg["device"]

    start_total = time.monotonic()

    print(f"[Steam] Phase-1 측면 예측 시작: {len(texts)}개 리뷰")
    start_phase1 = time.monotonic()

    MAX_SENTENCES_PER_REVIEW = 8
    all_sentences = _collect_sentences(texts, MAX_SENTENCES_PER_REVIEW, 5)
    detected_aspects_per_text = _run_phase1(aspect_tok, aspect_model, device, all_sentences, batch_size, threshold, len(texts))

    elapsed_phase1 = (time.monotonic() - start_phase1) * 1000
    print(f"[Steam] Phase-1 완료: {elapsed_phase1:.1f}ms")

    print(f"[Steam] Phase-2 감정 분류 시작")
    start_phase2 = time.monotonic()

    sentiment_inputs = _build_sentiment_inputs(texts, detected_aspects_per_text)
    sentiment_results = _run_phase2(sent_tok, sent_model, device, sentiment_inputs, batch_size)

    elapsed_phase2 = (time.monotonic() - start_phase2) * 1000
    print(f"[Steam] Phase-2 완료: {elapsed_phase2:.1f}ms")

    outputs = _merge_results(texts, detected_aspects_per_text, sentiment_inputs, sentiment_results)

    elapsed_total = (time.monotonic() - start_total) * 1000
    print(f"[Steam] 배치 분석 완료: reviews={len(texts)}, {elapsed_total:.1f}ms")

    if debug:
        print(f"[Steam] 배치 결과 개수: {len(outputs)}")

    return outputs
