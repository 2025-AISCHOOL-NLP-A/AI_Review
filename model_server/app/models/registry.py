import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import json, os

class ModelRegistry:
    """
    ✅ 모델 캐시 관리 클래스
    - 모델을 한 번만 로드하고 전역적으로 재사용
    - 도메인별 Phase1/Phase2 모델 캐시
    """
    _cache = {}

    @classmethod
    def get(cls, phase1_model_name, phase2_model_name):
        key = f"{phase1_model_name}|{phase2_model_name}"

        if key not in cls._cache:
            print(f"📦 Loading models for: {key}")
            device = "cuda" if torch.cuda.is_available() else "cpu"

            # Phase1: Aspect Classifier
            aspect_tokenizer = AutoTokenizer.from_pretrained(phase1_model_name)
            aspect_model = AutoModelForSequenceClassification.from_pretrained(phase1_model_name).to(device).eval()

            # Phase2: Sentiment Classifier
            sent_tokenizer = AutoTokenizer.from_pretrained(phase2_model_name)
            sent_model = AutoModelForSequenceClassification.from_pretrained(phase2_model_name).to(device).eval()

            cls._cache[key] = {
                "device": device,
                "aspect_tokenizer": aspect_tokenizer,
                "aspect_model": aspect_model,
                "sent_tokenizer": sent_tokenizer,
                "sent_model": sent_model,
            }

        return cls._cache[key]
