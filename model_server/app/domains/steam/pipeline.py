import re
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from app.models import ModelRegistry
from .keywords import BOOST_KEYWORDS, NEG_TRIGGERS
import json, os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
cfg = json.load(open(CONFIG_PATH, encoding="utf-8"))
ASPECTS = cfg["aspect_labels"]

# =========================================================
# 1️⃣ 문장 분리 (접속사 포함)
# =========================================================
def split_sentences(text):
    text = re.sub(r"([^.?!]*?)(?:지만|그러나|하지만|반면에)\s*", r"\1. ", text)
    sentences = re.split(r'(?<=[.!?])\s+|[。！？]|(?<=다)\s', text)
    return [s.strip() for s in sentences if s.strip()]

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
