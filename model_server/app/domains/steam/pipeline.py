import re
import torch
import numpy as np
import time
from typing import List, Dict, Any
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from app.models import ModelRegistry
from .keywords import BOOST_KEYWORDS, NEG_TRIGGERS
import json, os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
cfg = json.load(open(CONFIG_PATH, encoding="utf-8"))
ASPECTS = cfg["aspect_labels"]

# =========================================================
# 1️⃣ 문장 분리 (접속사 포함) - 최적화 버전
# =========================================================
def split_sentences(text, max_sentences=10, min_length=5):
    """
    문장 분리 (성능 최적화)
    - 최대 문장 수 제한 (너무 많은 문장 생성 방지)
    - 최소 길이 제한 (너무 짧은 문장 제거)
    """
    text = re.sub(r"([^.?!]*?)(?:지만|그러나|하지만|반면에)\s*", r"\1. ", text)
    sentences = re.split(r'(?<=[.!?])\s+|[。！？]|(?<=다)\s', text)
    # 필터링: 최소 길이 이상이고, 최대 문장 수 제한
    filtered = [s.strip() for s in sentences if s.strip() and len(s.strip()) >= min_length]
    # 최대 문장 수 제한 (앞부분 우선)
    return filtered[:max_sentences]

# =========================================================
# 2️⃣ 키워드 기반 Boost
# =========================================================
def boost_aspects(text, probs_dict):
    for aspect, kws in BOOST_KEYWORDS.items():
        if any(k in text for k in kws):
            probs_dict[aspect] = min(probs_dict.get(aspect, 0) + cfg["boost_value"], 1.0)
    return probs_dict

# =========================================================
# 3️⃣ Phase-1 측면 탐지
# =========================================================
def detect_aspects_multi(text, threshold=0.35):
    reg = ModelRegistry.get(
        cfg["phase1_model"],
        cfg["phase2_model"]
    )
    tok, model = reg["aspect_tokenizer"], reg["aspect_model"]   # ✅ dict 접근
    device = reg["device"]

    sentences = split_sentences(text)
    total = {}

    print(f"\n🧠 [DEBUG] 문장별 측면 확률 로그")
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
    device = reg["device"]        # ✅ dict이므로 [] 아님, 아래서 수정 반영
    ctx = text if aspect not in text else text[text.find(aspect)-20:text.find(aspect)+30]
    inputs = tok(f"[{aspect}] {ctx}", return_tensors="pt", truncation=True, padding=True).to(device)
    with torch.no_grad():
        probs = torch.softmax(model(**inputs).logits, dim=-1).cpu().numpy()[0]
    pos, neg = float(probs[1]), float(probs[0])
    if abs(pos-neg) < cfg["margin"]:
        label = "중립"
    else:
        label = "긍정" if pos>neg else "부정"
    return {
        "aspect": aspect,
        "POS": pos,
        "NEG": neg,
        "label": polarity_correction(text, aspect, label)
    }

# =========================================================
# 6️⃣ 통합 리뷰 분석
# =========================================================
def analyze_review(text):
    detected = detect_aspects_multi(text)
    results = [analyze_sentiment(asp, text) for asp in detected.keys()]
    return {"text": text, "aspects": list(detected.keys()), "results": results}

# =========================================================
# 7️⃣ 배치(Batch) 분석 (여러 리뷰 한 번에)
# =========================================================
def analyze_reviews(texts: List[str], debug: bool = False, batch_size: int = 16, threshold: float = 0.35) -> List[Dict[str, Any]]:
    """
    여러 리뷰 텍스트를 Batch로 분석하여 Steam 형식으로 반환
    
    Args:
        texts: 분석할 리뷰 텍스트 리스트
        debug: 디버그 모드 (상세 로그 출력)
        batch_size: 배치 크기 (Phase-1, Phase-2 모두에 적용)
        threshold: 측면 탐지 임계값
    
    Returns:
        Steam 형식의 분석 결과 리스트
    """
    if not texts:
        return []
    
    reg = ModelRegistry.get(cfg["phase1_model"], cfg["phase2_model"])
    aspect_tok, aspect_model = reg["aspect_tokenizer"], reg["aspect_model"]
    sent_tok, sent_model = reg["sent_tokenizer"], reg["sent_model"]
    device = reg["device"]
    
    start_total = time.monotonic()
    
    # =========================================================
    # Phase-1: 측면 탐지 (배치 처리)
    # =========================================================
    print(f"[Steam] Phase-1 측면 탐지 시작: {len(texts)}개 리뷰")
    start_phase1 = time.monotonic()
    
    # 모든 리뷰의 문장들을 수집 (최적화: 문장 수 제한)
    all_sentences: List[tuple[int, str]] = []  # (text_index, sentence)
    MAX_SENTENCES_PER_REVIEW = 8  # 리뷰당 최대 문장 수 (성능 최적화)
    for ti, text in enumerate(texts):
        sentences = split_sentences(text, max_sentences=MAX_SENTENCES_PER_REVIEW, min_length=5)
        for sentence in sentences:
            all_sentences.append((ti, sentence))
    
    # Phase-1 배치 추론
    detected_aspects_per_text: List[Dict[str, float]] = [{} for _ in texts]
    total_batches_phase1 = (len(all_sentences) + batch_size - 1) // batch_size
    
    print(f"[Steam] Phase-1: 총 {len(all_sentences)}개 문장, {total_batches_phase1}개 배치 처리 예정")
    
    for i in range(0, len(all_sentences), batch_size):
        batch_num = i // batch_size + 1
        chunk = all_sentences[i:i + batch_size]
        sentences_batch = [item[1] for item in chunk]
        
        print(f"[Steam] Phase-1 진행: {batch_num}/{total_batches_phase1} 배치 처리 중... ({len(chunk)}개 문장)")
        
        # 배치 토크나이징
        inputs = aspect_tok(
            sentences_batch,
            return_tensors="pt",
            truncation=True,
            padding=True
        ).to(device)
        
        # 배치 추론
        with torch.no_grad():
            logits = aspect_model(**inputs).logits
            probs = torch.sigmoid(logits).cpu().numpy()
        
        # 결과 처리
        detected_count = 0
        for (ti, sentence), prob_row in zip(chunk, probs):
            detected = {ASPECTS[j]: float(prob_row[j]) for j in range(len(ASPECTS))}
            detected = boost_aspects(sentence, detected)
            
            for asp, prob in detected.items():
                if prob >= threshold:
                    if asp not in detected_aspects_per_text[ti]:
                        detected_aspects_per_text[ti][asp] = prob
                        detected_count += 1
                    else:
                        detected_aspects_per_text[ti][asp] = max(detected_aspects_per_text[ti][asp], prob)
        
        print(f"[Steam] Phase-1 배치 {batch_num}/{total_batches_phase1} 완료: {detected_count}개 측면 탐지")
    
    elapsed_phase1 = (time.monotonic() - start_phase1) * 1000
    print(f"[Steam] Phase-1 완료: {elapsed_phase1:.1f}ms")
    
    # =========================================================
    # Phase-2: 감정 분류 (배치 처리)
    # =========================================================
    print(f"[Steam] Phase-2 감정 분류 시작")
    start_phase2 = time.monotonic()
    
    # 탐지된 측면들을 수집: (text_index, aspect, text, context)
    sentiment_inputs: List[tuple[int, str, str, str]] = []
    for ti, text in enumerate(texts):
        for aspect in detected_aspects_per_text[ti].keys():
            ctx = text if aspect not in text else text[text.find(aspect)-20:text.find(aspect)+30]
            sentiment_inputs.append((ti, aspect, text, ctx))
    
    # Phase-2 배치 추론
    sentiment_results: List[Dict[str, Any]] = [None] * len(sentiment_inputs)
    total_batches_phase2 = (len(sentiment_inputs) + batch_size - 1) // batch_size
    
    print(f"[Steam] Phase-2: 총 {len(sentiment_inputs)}개 측면-감정 쌍, {total_batches_phase2}개 배치 처리 예정")
    
    for i in range(0, len(sentiment_inputs), batch_size):
        batch_num = i // batch_size + 1
        chunk = sentiment_inputs[i:i + batch_size]
        
        print(f"[Steam] Phase-2 진행: {batch_num}/{total_batches_phase2} 배치 처리 중... ({len(chunk)}개 측면-감정 쌍)")
        
        # 입력 텍스트 생성: "[aspect] context"
        inputs_texts = [f"[{item[1]}] {item[3]}" for item in chunk]
        
        # 배치 토크나이징
        inputs = sent_tok(
            inputs_texts,
            return_tensors="pt",
            truncation=True,
            padding=True
        ).to(device)
        
        # 배치 추론
        with torch.no_grad():
            logits = sent_model(**inputs).logits
            probs = torch.softmax(logits, dim=-1).cpu().numpy()
        
        # 결과 처리
        pos_count = 0
        neg_count = 0
        neu_count = 0
        for idx, (ti, aspect, text, _), prob_row in zip(range(i, i + len(chunk)), chunk, probs):
            pos, neg = float(prob_row[1]), float(prob_row[0])
            if abs(pos - neg) < cfg["margin"]:
                label = "중립"
                neu_count += 1
            else:
                label = "긍정" if pos > neg else "부정"
                if label == "긍정":
                    pos_count += 1
                else:
                    neg_count += 1
            
            label = polarity_correction(text, aspect, label)
            sentiment_results[idx] = {
                "aspect": aspect,
                "POS": pos,
                "NEG": neg,
                "label": label
            }
        
        print(f"[Steam] Phase-2 배치 {batch_num}/{total_batches_phase2} 완료: 긍정 {pos_count}, 부정 {neg_count}, 중립 {neu_count}")
    
    elapsed_phase2 = (time.monotonic() - start_phase2) * 1000
    print(f"[Steam] Phase-2 완료: {elapsed_phase2:.1f}ms")
    
    # =========================================================
    # 결과 재구성
    # =========================================================
    # sentiment_inputs와 sentiment_results를 (text_index, aspect)를 키로 매핑
    result_map: Dict[tuple[int, str], Dict[str, Any]] = {}
    for (ti, aspect, _, _), result in zip(sentiment_inputs, sentiment_results):
        if result:
            result_map[(ti, aspect)] = result
    
    # 각 리뷰별로 결과 재구성
    outputs: List[Dict[str, Any]] = []
    for ti, text in enumerate(texts):
        results = []
        detected_aspects = list(detected_aspects_per_text[ti].keys())
        
        # 탐지된 측면별로 결과 매핑
        for aspect in detected_aspects:
            if (ti, aspect) in result_map:
                results.append(result_map[(ti, aspect)])
        
        outputs.append({
            "text": text,
            "aspects": detected_aspects,
            "results": results
        })
    
    elapsed_total = (time.monotonic() - start_total) * 1000
    print(f"[Steam] 배치 분석 완료: reviews={len(texts)}, {elapsed_total:.1f}ms")
    
    if debug:
        print(f"[Steam] 배치 결과 개수: {len(outputs)}")
    
    return outputs
