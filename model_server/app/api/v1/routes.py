from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.domains.steam import pipeline as steam

router = APIRouter(prefix="/v1")

# ✅ 요청 데이터 구조
class AnalyzeBatchRequest(BaseModel):
    texts: List[str]
    aspect_th: float = 0.35
    margin: float = 0.03

# ✅ 헬스체크
@router.get("/health")
def health():
    return {"status": "ok", "domain": "steam"}

# ✅ 리뷰 분석 엔드포인트
@router.post("/analyze-batch")
def analyze_batch(req: AnalyzeBatchRequest):
    try:
        print("🧠 [DEBUG] 요청 들어옴:", len(req.texts), "개 텍스트")
        results = [steam.analyze_review(t) for t in req.texts]
        return {"items": results, "count": len(results)}
    except Exception as e:
        import traceback
        print("❌ [ERROR] FastAPI 내부 오류 발생:")
        traceback.print_exc()   # 👈 에러 스택 출력
        raise HTTPException(status_code=500, detail=str(e))
