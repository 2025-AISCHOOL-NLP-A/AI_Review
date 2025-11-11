from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.domains.steam import pipeline as steam
from app.utils.generate_wordcloud_from_db import generate_wordcloud_from_db

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

# ✅ 제품 리뷰 기반 워드클라우드 생성 엔드포인트
@router.post("/products/{product_id}/reviews/analysis")
def analyze_product_reviews(product_id: int, domain: str = "steam"):
    """
    특정 product_id의 리뷰 텍스트를 기반으로 워드클라우드 생성
    """
    try:
        wc_path = generate_wordcloud_from_db(product_id, domain)
        if not wc_path:
            raise HTTPException(status_code=404, detail="리뷰 데이터 없음 또는 워드클라우드 생성 실패")
        return {
            "success": True,
            "product_id": product_id,
            "domain": domain,
            "wordcloud_path": wc_path
        }
    except Exception as e:
        import traceback
        print("❌ [ERROR] 워드클라우드 생성 중 오류 발생:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
