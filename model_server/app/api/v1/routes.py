from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio
from typing import List, Optional
from app.domains.steam import pipeline as steam
from app.domains.cosmetics import pipeline as cosmetics
from app.domains.electronics import pipeline as electronics
from utils.generate_wordcloud_from_db import generate_wordcloud_from_db
from utils.generate_insight import generate_insight_from_db
from utils.db_connect import get_connection
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/v1")

# 요청 데이터 구조
class AnalyzeBatchRequest(BaseModel):
    texts: List[str]
    aspect_th: float = 0.35
    margin: float = 0.03

# 도메인별 파이프라인 매핑
DOMAIN_PIPELINES = {
    "steam": steam,
    "cosmetics": cosmetics,
    "electronics": electronics,
}

# 카테고리 ID → 도메인 매핑
CATEGORY_TO_DOMAIN = {
    103: "steam",      # 게임
    102: "cosmetics",  # 화장품
    101: "electronics", # 전자기기
}

# 헬스체크
@router.get("/health")
def health():
    return {"status": "ok", "domain": "steam"}

# 리뷰 분석 엔드포인트
@router.post("/analyze-batch")
def analyze_batch(req: AnalyzeBatchRequest, domain: str = "steam"):
    try:
        pipeline = DOMAIN_PIPELINES.get(domain, steam)
        
        # 배치 함수가 있으면 사용, 없으면 순차 처리
        if hasattr(pipeline, 'analyze_reviews'):
            print(f"⚡ 배치 처리 모드 사용 (도메인: {domain})")
            results = pipeline.analyze_reviews(req.texts, debug=False, batch_size=16)
        else:
            print(f"⚡ 순차 처리 모드 사용 (도메인: {domain})")
            results = [pipeline.analyze_review(t) for t in req.texts]
        
        return {"items": results, "count": len(results)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# 제품 리뷰 전체 분석 파이프라인 엔드포인트 (SSE 스트리밍)
@router.post("/products/{product_id}/reviews/analysis")
async def analyze_product_reviews(product_id: int, domain: Optional[str] = None):
    """
    특정 product_id의 리뷰를 전체 분석 파이프라인으로 처리 (SSE 스트리밍):
    1. DB에서 리뷰 및 제품 정보 조회
    2. 카테고리에 맞는 도메인 모델로 분석
    3. tb_reviewAnalysis에 분석 결과 저장
    4. 인사이트 생성 (LangChain + OpenAI)
    5. tb_productDashboard 업데이트 (프로시저 호출)
    6. 워드클라우드 생성
    """
    
    async def generate_progress():
        """진행 상황을 SSE 형식으로 스트리밍"""
        conn = None
        try:
            # 진행률 전송 헬퍼 함수
            def send_progress(step: str, progress: int, message: str):
                data = json.dumps({
                    "step": step,
                    "progress": progress,
                    "message": message
                })
                return f"data: {data}\n\n"
            
            # 0% - 시작
            yield send_progress("start", 0, "분석 시작")
            await asyncio.sleep(0.1)
            
            # 1️⃣ DB 연결 및 제품 정보 조회
            yield send_progress("init", 5, "DB 연결 중...")
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                """
                SELECT p.product_id, p.category_id, p.user_id, c.category_name
                FROM tb_product p
                LEFT JOIN tb_productCategory c ON p.category_id = c.category_id
                WHERE p.product_id = %s
                """,
                (product_id,)
            )
            product_info = cursor.fetchone()
            
            if not product_info:
                yield send_progress("error", 0, f"제품을 찾을 수 없습니다 (product_id={product_id})")
                return
            
            category_id = product_info["category_id"]
            user_id = product_info["user_id"]
            
            # 도메인 결정 (외부 파라미터 domain 사용)
            domain_name = domain if domain is not None else CATEGORY_TO_DOMAIN.get(category_id, "steam")
            
            yield send_progress("init", 10, f"제품 정보 조회 완료 (도메인: {domain_name})")
            print(f"📦 제품 {product_id} 분석 시작 (카테고리: {category_id}, 도메인: {domain_name})")
            
            # 도메인 파이프라인 선택
            pipeline = DOMAIN_PIPELINES.get(domain_name, steam)
            
            # 2️⃣ 리뷰 불러오기 (분석되지 않은 리뷰만)
            cursor.execute(
                """
                SELECT DISTINCT r.review_id, r.review_text 
                FROM tb_review r
                LEFT JOIN tb_reviewAnalysis ra ON r.review_id = ra.review_id
                WHERE r.product_id = %s AND ra.review_id IS NULL
                """,
                (product_id,)
            )
            reviews = cursor.fetchall()
            
            if not reviews:
                # 분석되지 않은 리뷰가 없는 경우
                yield send_progress("info", 100, "분석할 새로운 리뷰가 없습니다")
                
                # 기존 분석 결과 반환
                final_result = {
                    "success": True,
                    "product_id": product_id,
                    "category_id": category_id,
                    "domain": domain,
                    "review_count": 0,
                    "analyzed_count": 0,
                    "inserted_count": 0,
                    "insight_id": None,
                    "wordcloud_path": None,
                    "message": "분석할 새로운 리뷰가 없습니다"
                }
                yield f"data: {json.dumps({'step': 'result', 'progress': 100, 'data': final_result})}\n\n"
                return
            
            review_count = len(reviews)
            yield send_progress("loading", 15, f"분석할 리뷰 {review_count}개 발견")
            print(f"📝 분석할 리뷰 {review_count}개 발견")
            
            # 3️⃣ 리뷰 분석 수행
            yield send_progress("analysis", 20, f"{domain_name} 도메인 모델로 분석 시작...")
            print(f"🧠 {domain_name} 도메인 모델로 분석 시작...")
            
            analysis_results = []
            
            # 배치 함수가 있으면 사용, 없으면 순차 처리
            if hasattr(pipeline, 'analyze_reviews'):
                batch_size = 8
                print(f"⚡ 배치 처리 모드 사용 (배치 크기: {batch_size})")
                
                # 리뷰 텍스트만 추출
                review_texts = [r["review_text"] for r in reviews]
                
                # 배치 분석 수행 (진행률 업데이트)
                total_batches = (len(review_texts) + batch_size - 1) // batch_size
                
                for batch_idx in range(0, len(review_texts), batch_size):
                    batch = review_texts[batch_idx:batch_idx + batch_size]
                    batch_results = pipeline.analyze_reviews(batch, debug=False, batch_size=batch_size)
                    
                    # 결과 매핑
                    for i, result in enumerate(batch_results):
                        review_idx = batch_idx + i
                        if review_idx < len(reviews):
                            analysis_results.append({
                                "review_id": reviews[review_idx]["review_id"],
                                "result": result
                            })
                    
                    # 진행률 계산 (20% ~ 50%)
                    current_batch = (batch_idx // batch_size) + 1
                    progress = 20 + int((current_batch / total_batches) * 30)
                    yield send_progress("analysis", progress, f"분석 중... ({current_batch}/{total_batches} 배치)")
                    await asyncio.sleep(0.1)
            else:
                print(f"⚡ 순차 처리 모드 사용")
                for idx, review in enumerate(reviews):
                    review_id = review["review_id"]
                    review_text = review["review_text"]
                    result = pipeline.analyze_review(review_text)
                    analysis_results.append({
                        "review_id": review_id,
                        "result": result
                    })
                    
                    # 진행률 계산 (20% ~ 50%)
                    if (idx + 1) % 10 == 0 or idx == len(reviews) - 1:
                        progress = 20 + int(((idx + 1) / len(reviews)) * 30)
                        yield send_progress("analysis", progress, f"분석 중... ({idx + 1}/{len(reviews)} 리뷰)")
                        await asyncio.sleep(0.1)
            
            yield send_progress("analysis", 50, f"분석 완료: {len(analysis_results)}개 리뷰")
            print(f"✅ 분석 완료: {len(analysis_results)}개 리뷰")
            
            # 3-1️⃣ DB 연결 상태 확인 및 재연결
            try:
                cursor.execute("SELECT 1")
                cursor.fetchone()
                print("✅ DB 연결 상태 정상")
            except Exception as conn_check_err:
                yield send_progress("reconnect", 52, "DB 재연결 중...")
                print(f"⚠️ DB 연결 끊어짐 감지, 재연결 시도... ({conn_check_err})")
                try:
                    cursor.close()
                except:
                    pass
                try:
                    conn.close()
                except:
                    pass
                conn = get_connection()
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT p.product_id, p.category_id, p.user_id, c.category_name
                    FROM tb_product p
                    LEFT JOIN tb_productCategory c ON p.category_id = c.category_id
                    WHERE p.product_id = %s
                    """,
                    (product_id,)
                )
                product_info = cursor.fetchone()
                category_id = product_info["category_id"]
                user_id = product_info["user_id"]
                print("✅ DB 재연결 완료")
            
            # 4️⃣ 키워드 매핑
            yield send_progress("mapping", 55, "키워드 매핑 중...")
            max_retries = 3
            keywords = None
            for retry in range(max_retries):
                try:
                    cursor.execute(
                        """
                        SELECT keyword_id, keyword_text 
                        FROM tb_keyword 
                        WHERE category_id = %s
                        """,
                        (category_id,)
                    )
                    keywords = cursor.fetchall()
                    break
                except Exception as kw_err:
                    if retry < max_retries - 1:
                        print(f"⚠️ 키워드 조회 실패 (재시도 {retry + 1}/{max_retries}): {kw_err}")
                        try:
                            cursor.close()
                            conn.close()
                        except:
                            pass
                        conn = get_connection()
                        cursor = conn.cursor()
                    else:
                        raise
            
            keyword_map = {kw["keyword_text"]: kw["keyword_id"] for kw in keywords}
            yield send_progress("mapping", 58, f"키워드 {len(keyword_map)}개 매핑 완료")
            print(f"🔑 키워드 {len(keyword_map)}개 매핑 완료")
            
            # 5️⃣ tb_reviewAnalysis에 분석 결과 저장
            yield send_progress("saving", 60, "분석 결과 저장 중...")
            insert_count = 0
            for item in analysis_results:
                review_id = item["review_id"]
                result = item["result"]
                
                for aspect_result in result.get("results", []):
                    aspect = aspect_result.get("aspect")
                    label = aspect_result.get("label")
                    
                    keyword_id = keyword_map.get(aspect)
                    if not keyword_id:
                        print(f"⚠️ 키워드 없음: {aspect}")
                        continue
                    
                    if label == "중립":
                        continue
                    
                    sentiment = "positive" if label == "긍정" else "negative"
                    
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
            yield send_progress("saving", 65, f"tb_reviewAnalysis에 {insert_count}건 저장 완료")
            print(f"💾 tb_reviewAnalysis에 {insert_count}건 저장 완료")
            
            # 6️⃣ 인사이트 생성
            yield send_progress("insight", 70, "AI 인사이트 생성 중...")
            print(f"💡 인사이트 생성 시작...")
            insight_id = None
            try:
                insight_id = generate_insight_from_db(product_id, user_id=user_id)
                if insight_id:
                    yield send_progress("insight", 80, f"인사이트 생성 완료")
                    print(f"✅ 인사이트 생성 완료 (insight_id={insight_id})")
                else:
                    yield send_progress("insight", 80, "인사이트 생성 실패 (리뷰 데이터 부족)")
                    print(f"⚠️ 인사이트 생성 실패 (리뷰 데이터 부족 또는 오류)")
            except Exception as insight_err:
                yield send_progress("insight", 80, f"인사이트 생성 오류: {str(insight_err)}")
                print(f"⚠️ 인사이트 생성 오류: {insight_err}")
            
            # 7️⃣ 대시보드 업데이트
            yield send_progress("dashboard", 85, "대시보드 업데이트 중...")
            try:
                cursor.execute("CALL sp_update_product_dashboard(%s)", (product_id,))
                conn.commit()
                yield send_progress("dashboard", 88, "대시보드 업데이트 완료")
                print(f"📊 대시보드 업데이트 완료 (프로시저 호출)")
            except Exception as proc_err:
                print(f"⚠️ 프로시저 호출 실패: {proc_err}")
            
            # 8️⃣ 워드클라우드 생성
            yield send_progress("wordcloud", 90, "워드클라우드 생성 중...")
            print(f"🌈 워드클라우드 생성 시작...")
            wc_path = generate_wordcloud_from_db(product_id, domain_name)
            
            if wc_path:
                yield send_progress("wordcloud", 98, "워드클라우드 생성 완료")
            else:
                yield send_progress("wordcloud", 98, "워드클라우드 생성 실패")
                print(f"⚠️ 워드클라우드 생성 실패")
            
            # 9️⃣ 완료
            final_result = {
                "success": True,
                "product_id": product_id,
                "category_id": category_id,
                "domain": domain_name,
                "review_count": review_count,
                "analyzed_count": len(analysis_results),
                "inserted_count": insert_count,
                "insight_id": insight_id,
                "wordcloud_path": wc_path,
                "message": "리뷰 분석, 인사이트 생성 및 대시보드 업데이트 완료"
            }
            
            yield send_progress("complete", 100, "분석 완료!")
            # 최종 결과도 함께 전송
            yield f"data: {json.dumps({'step': 'result', 'progress': 100, 'data': final_result})}\n\n"
            
        except HTTPException as he:
            error_data = json.dumps({
                "step": "error",
                "progress": 0,
                "message": he.detail
            })
            yield f"data: {error_data}\n\n"
        except Exception as e:
            import traceback
            print("❌ [ERROR] 리뷰 분석 파이프라인 오류 발생:")
            traceback.print_exc()
            error_data = json.dumps({
                "step": "error",
                "progress": 0,
                "message": f"분석 실패: {str(e)}"
            })
            yield f"data: {error_data}\n\n"
        finally:
            if conn:
                conn.close()
    
    return StreamingResponse(generate_progress(), media_type="text/event-stream")

