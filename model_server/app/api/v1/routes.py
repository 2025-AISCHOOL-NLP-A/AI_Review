from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.domains.steam import pipeline as steam
from app.domains.cosmetics import pipeline as cosmetics
from app.domains.electronics import pipeline as electronics
from utils.generate_wordcloud_from_db import generate_wordcloud_from_db
from utils.db_connect import get_connection
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/v1")

# ✅ 요청 데이터 구조
class AnalyzeBatchRequest(BaseModel):
    texts: List[str]
    aspect_th: float = 0.35
    margin: float = 0.03

# ✅ 도메인별 파이프라인 매핑
DOMAIN_PIPELINES = {
    "steam": steam,
    "cosmetics": cosmetics,
    "electronics": electronics,
}

# ✅ 카테고리 ID → 도메인 매핑
CATEGORY_TO_DOMAIN = {
    103: "steam",      # 게임
    102: "cosmetics",  # 화장품
    101: "electronics", # 전자기기
}

# ✅ 헬스체크
@router.get("/health")
def health():
    return {"status": "ok", "domain": "steam"}

# ✅ 리뷰 분석 엔드포인트
@router.post("/analyze-batch")
def analyze_batch(req: AnalyzeBatchRequest, domain: str = "steam"):
    try:
        print("🧠 [DEBUG] 요청 들어옴:", len(req.texts), "개 텍스트")
        pipeline = DOMAIN_PIPELINES.get(domain, steam)
        results = [pipeline.analyze_review(t) for t in req.texts]
        return {"items": results, "count": len(results)}
    except Exception as e:
        import traceback
        print("❌ [ERROR] FastAPI 내부 오류 발생:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ✅ 제품 리뷰 전체 분석 파이프라인 엔드포인트
@router.post("/products/{product_id}/reviews/analysis")
def analyze_product_reviews(product_id: int, domain: Optional[str] = None):
    """
    특정 product_id의 리뷰를 전체 분석 파이프라인으로 처리:
    1. DB에서 리뷰 및 제품 정보 조회
    2. 카테고리에 맞는 도메인 모델로 분석
    3. tb_reviewAnalysis에 분석 결과 저장
    3-2. 리뷰와 분석 결과를 가지고 인사이트 요청(NEW)
    4. tb_productDashboard 업데이트 (프로시저 호출)
    5. 워드클라우드 생성
    """
    conn = None
    try:
        # 1️⃣ DB 연결 및 제품 정보 조회
        conn = get_connection()
        cursor = conn.cursor()
        
        # 제품 정보 및 카테고리 조회
        cursor.execute(
            """
            SELECT p.product_id, p.category_id, c.category_name
            FROM tb_product p
            LEFT JOIN tb_productCategory c ON p.category_id = c.category_id
            WHERE p.product_id = %s
            """,
            (product_id,)
        )
        product_info = cursor.fetchone()
        
        if not product_info:
            raise HTTPException(status_code=404, detail=f"제품을 찾을 수 없습니다 (product_id={product_id})")
        
        category_id = product_info[1]
        
        # 도메인 결정 (파라미터가 없으면 카테고리로 자동 결정)
        if domain is None:
            domain = CATEGORY_TO_DOMAIN.get(category_id, "steam")
        
        print(f"📦 제품 {product_id} 분석 시작 (카테고리: {category_id}, 도메인: {domain})")
        
        # 도메인 파이프라인 선택
        pipeline = DOMAIN_PIPELINES.get(domain, steam)
        
        # 2️⃣ 리뷰 불러오기
        cursor.execute(
            "SELECT review_id, review_text FROM tb_review WHERE product_id = %s",
            (product_id,)
        )
        reviews = cursor.fetchall()
        
        if not reviews:
            raise HTTPException(status_code=404, detail="분석할 리뷰가 없습니다")
        
        print(f"📝 리뷰 {len(reviews)}개 발견")
        
        # 3️⃣ 리뷰 분석 수행
        print(f"🧠 {domain} 도메인 모델로 분석 시작...")
        analysis_results = []
        for review_id, review_text in reviews:
            result = pipeline.analyze_review(review_text)
            analysis_results.append({
                "review_id": review_id,
                "result": result
            })
        
        print(f"✅ 분석 완료: {len(analysis_results)}개 리뷰")
        
        # 4️⃣ 키워드 매핑 테이블 조회
        cursor.execute(
            """
            SELECT keyword_id, keyword_text 
            FROM tb_keyword 
            WHERE category_id = %s
            """,
            (category_id,)
        )
        keywords = cursor.fetchall()
        keyword_map = {kw[1]: kw[0] for kw in keywords}
        
        print(f"🔑 키워드 {len(keyword_map)}개 매핑 완료")
        
        # 5️⃣ tb_reviewAnalysis에 분석 결과 저장
        insert_count = 0
        for item in analysis_results:
            review_id = item["review_id"]
            result = item["result"]
            
            for aspect_result in result.get("results", []):
                aspect = aspect_result.get("aspect")
                label = aspect_result.get("label")
                
                # 키워드 매핑
                keyword_id = keyword_map.get(aspect)
                if not keyword_id:
                    print(f"⚠️ 키워드 없음: {aspect}")
                    continue
                
                # sentiment 변환 (긍정/부정만 저장, 중립은 제외)
                if label == "중립":
                    continue
                
                sentiment = "positive" if label == "긍정" else "negative"
                
                # INSERT 또는 UPDATE
                cursor.execute(
                    """
                    INSERT INTO tb_reviewAnalysis (keyword_id, review_id, sentiment, analyzed_at)
                    VALUES (%s, %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE 
                        sentiment = VALUES(sentiment), 
                        analyzed_at = NOW()
                    """,
                    (keyword_id, review_id, sentiment)
                )
                insert_count += 1
        
        conn.commit()
        print(f"💾 tb_reviewAnalysis에 {insert_count}건 저장 완료")
        
        # 6️⃣ 대시보드 업데이트 (프로시저 호출)
        try:
            cursor.execute("CALL sp_update_product_dashboard(%s)", (product_id,))
            conn.commit()
            print(f"📊 대시보드 업데이트 완료 (프로시저 호출)")
        except Exception as proc_err:
            print(f"⚠️ 프로시저 호출 실패: {proc_err}")
            # 프로시저가 없어도 계속 진행
        
        # 7️⃣ 워드클라우드 생성
        wc_path = generate_wordcloud_from_db(product_id, domain)
        
        # 8️⃣ 최종 응답
        return {
            "success": True,
            "product_id": product_id,
            "category_id": category_id,
            "domain": domain,
            "review_count": len(reviews),
            "analyzed_count": len(analysis_results),
            "inserted_count": insert_count,
            "wordcloud_path": wc_path,
            "message": "리뷰 분석 및 대시보드 업데이트 완료"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("❌ [ERROR] 리뷰 분석 파이프라인 오류 발생:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"분석 실패: {str(e)}")
    finally:
        if conn:
            conn.close()
    
