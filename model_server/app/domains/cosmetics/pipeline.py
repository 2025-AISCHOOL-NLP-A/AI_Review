import os
import json
from transformers import pipeline as hf_pipeline

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
cfg = json.load(open(CONFIG_PATH, encoding="utf-8"))

_ABSA = None

def get_absa_pipeline():
    global _ABSA
    if _ABSA is None:
        model_ckpt = cfg["absa_model"]
        _ABSA = hf_pipeline(
            task="text-classification",
            model=model_ckpt,
            tokenizer=model_ckpt,
            return_all_scores=True
        )
    return _ABSA

def analyze_review(text):
    absa = get_absa_pipeline()
    aspect_groups = cfg.get("aspect_groups", {})
    label_map = cfg.get("label_map", {
        "LABEL_0": "부정",
        "LABEL_1": "중립",
        "LABEL_2": "긍정",
        "LABEL_3": "언급없음"
    })

    results = []
    present_aspects = []

    for group_name in aspect_groups.keys():
        input_text = f"{group_name}: {text}"
        preds = absa(input_text)
        top = max(preds[0], key=lambda x: x["score"])
        mapped = label_map.get(top["label"], top["label"])
        result = {
            "aspect": group_name,
            "label": mapped,
            "score": round(float(top["score"]), 4)
        }
        results.append(result)
        if mapped != "언급없음":
            present_aspects.append(group_name)

    return {
        "text": text,
        "aspects": present_aspects,
        "results": results
    }