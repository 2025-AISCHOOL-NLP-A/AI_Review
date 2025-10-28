from fastapi import FastAPI
from pydantic import BaseModel
import torch
import numpy as np
import os
from huggingface_hub import login
from dotenv import load_dotenv
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from server_model.db_connect import get_connection
from server_model.db_writer import insert_analysis_result, update_product_insight
from server_model.gpt_insight import generate_aggregate_insight

load_dotenv()
hf_token = os.getenv("HF_TOKEN")
login(token=hf_token)

app = FastAPI(title="Review Sentiment Analysis API")

MODEL_REPO = "Wing4/kcelectra-steam-sentiment-classifier-12label-v2"
ASPECT_LABELS = [
    "OPTIMIZATION_POS",
    "OPTIMIZATION_NEG",
    "GRAPHICS_POS",
    "GRAPHICS_NEG",
    "PRICE_VALUE_POS",
    "PRICE_VALUE_NEG",
    "BALANCE_POS",
    "BALANCE_NEG",
    "ENGAGEMENT_POS",
    "ENGAGEMENT_NEG",
    "STORY_POS",
    "STORY_NEG",
]

hf_token = os.getenv("HF_TOKEN")
tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO, token=hf_token)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_REPO, token=hf_token)
model.eval()


class ReviewRequest(BaseModel):
    review_text: str


@app.post("/analyze_and_save")
def analyze_and_save(req: ReviewRequest):
    # 1️⃣ 감정 분석 수행
    inputs = tokenizer(
        req.review_text, return_tensors="pt", truncation=True, max_length=256
    )
    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.sigmoid(logits).detach().cpu().numpy().squeeze().tolist()

    # 2️⃣ 확률 매핑
    aspect_scores = {}
    for label, prob in zip(ASPECT_LABELS, probs):
        aspect, polarity = label.rsplit("_", 1)
        if aspect not in aspect_scores:
            aspect_scores[aspect] = {"pos": 0.0, "neg": 0.0}
        aspect_scores[aspect]["pos" if polarity == "POS" else "neg"] = prob

    # 3️⃣ 단일 polarity 결정
    THRESH, MARGIN = 0.4, 0.02
    analysis = {}
    for aspect, s in aspect_scores.items():
        pos, neg = s["pos"], s["neg"]
        if max(pos, neg) < THRESH:
            continue
        if abs(pos - neg) < MARGIN:
            analysis[aspect] = ["neutral"]
        else:
            analysis[aspect] = ["pos" if pos > neg else "neg"]

    # 4️⃣ DB 반영
    review_id = 1
    product_id = 1
    insert_analysis_result(review_id, analysis)
    update_product_insight(product_id)

    return {
        "review_text": req.review_text,
        "analysis": analysis,
        "message": "분석 결과가 DB에 저장되고 인사이트가 갱신되었습니다.",
    }


@app.get("/db_test")
def db_test():
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT DATABASE() AS db;")
            result = cur.fetchone()
        conn.close()
        return {"connected_to": result["db"]}
    except Exception as e:
        return {"error": str(e)}


@app.post("/generate_aggregate_insight/{product_id}")
def generate_aggregate_insight_api(product_id: int):
    result = generate_aggregate_insight(product_id)
    return {"status": "success", "data": result}
