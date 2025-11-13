import os
import json
from datetime import datetime
from dotenv import load_dotenv
from utils.db_connect import get_connection
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

"""
구조:

fetch_review_data() - DB에서 리뷰 데이터 조회
build_analysis_prompt() - 인사이트 분석 프롬프트 생성
generate_insight_with_llm() - LangChain으로 인사이트 생성
save_insight_to_db() - 인사이트 DB 저장
generate_insight_from_db() - 메인 함수 (전체 프로세스 실행)
"""

# ===========================
# 1️⃣ 데이터 조회
# ===========================
def fetch_review_data(product_id: int) -> dict:
    """
    제품의 리뷰 데이터 조회
    - 전체 리뷰 수
    - 키워드별 긍정/부정 집계
    - 샘플 리뷰 (최근 200개)
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # 1. 전체 리뷰 수
        cursor.execute(
            "SELECT COUNT(*) AS total_reviews FROM tb_review WHERE product_id = %s",
            (product_id,)
        )
        total_data = cursor.fetchone()
        total_reviews = int(total_data["total_reviews"]) if total_data else 0
        
        # 2. 키워드별 감성 집계
        cursor.execute(
            """
            SELECT 
                k.keyword_text,
                SUM(CASE WHEN ra.sentiment = 'positive' THEN 1 ELSE 0 END) AS positive,
                SUM(CASE WHEN ra.sentiment = 'negative' THEN 1 ELSE 0 END) AS negative
            FROM tb_reviewAnalysis ra
            JOIN tb_keyword k ON k.keyword_id = ra.keyword_id
            JOIN tb_review r ON r.review_id = ra.review_id
            WHERE r.product_id = %s
            GROUP BY k.keyword_id, k.keyword_text
            ORDER BY (positive + negative) DESC
            """,
            (product_id,)
        )
        sentiment_data = cursor.fetchall()
        
        # 3. 샘플 리뷰 (최근 200개)
        cursor.execute(
            """
            SELECT review_text 
            FROM tb_review 
            WHERE product_id = %s 
            ORDER BY review_date DESC 
            LIMIT 200
            """,
            (product_id,)
        )
        reviews_data = cursor.fetchall()
        
        # 데이터 구조화
        sentiment_summary = {
            item["keyword_text"]: {
                "positive": int(item["positive"]),
                "negative": int(item["negative"])
            }
            for item in sentiment_data
        }
        
        sample_reviews = [r["review_text"] for r in reviews_data]
        
        return {
            "total_reviews": total_reviews,
            "sentiment_summary": sentiment_summary,
            "sample_reviews": sample_reviews
        }
        
    finally:
        conn.close()


# ===========================
# 2️⃣ 프롬프트 생성
# ===========================
def build_analysis_prompt(data: dict) -> str:
    """인사이트 분석 프롬프트 생성"""
    return f"""당신은 고객 리뷰 분석 전문가입니다.
아래 리뷰 데이터를 바탕으로, 먼저 **깊이 있는 내부 분석**을 수행한 뒤,
그 결과를 기반으로 **정제된 간략 요약(summary)**을 함께 작성하세요.

리뷰 데이터:
{json.dumps(data, ensure_ascii=False, indent=2)}

출력은 아래 JSON 구조를 **반드시 따르세요**:
{{
  "summary": {{
    "keywords": {{
      "positive": ["긍정 키워드1", "긍정 키워드2", ...],
      "negative": ["부정 키워드1", "부정 키워드2", ...]
    }},
    "insight_one_liner": "전체 리뷰를 한 줄로 요약한 문장 (짧고 명확하게)",
    "recommendation": "가장 중요한 개선 제안 (간결하게)"
  }},
  "report": {{
    "title": "📊 리뷰 분석 보고서",
    "sentiment_ratio": "긍정: 70%, 부정: 30%",
    "positive_points": ["고객이 높게 평가한 요인들을 문장 중심으로 자세히 설명"],
    "negative_points": ["불만 요인 및 구체적 상황을 상세히 분석"],
    "improvement_suggestions": ["구체적인 개선 방향을 논리적으로 제안"],
    "overall_summary": "전체 여론과 트렌드를 깊이 있게 정리"
  }}
}}

작성 단계 지침:
1️⃣ 내부적으로 충분히 생각하고, 상세한 인사이트를 도출하세요.
2️⃣ `report`는 분석 중심으로 길게, 논리적이고 근거 있는 설명을 포함하세요.
3️⃣ `summary`는 report의 요점을 압축해 간결한 표현으로 정리하세요.
4️⃣ 출력은 반드시 JSON 형식으로만 하세요."""


# ===========================
# 3️⃣ LLM 호출
# ===========================
def generate_insight_with_llm(prompt: str) -> dict:
    """LangChain으로 인사이트 생성"""
    try:
        # OpenAI API 키 확인
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")
        
        # LLM 초기화
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            max_tokens=10000
        )
        
        # 메시지 구성
        messages = [
            SystemMessage(content="당신은 데이터 인사이트 분석가입니다. 리뷰 데이터를 기반으로 통찰력 있는 보고서를 작성하세요."),
            HumanMessage(content=prompt)
        ]
        
        # LLM 호출
        print("🤖 LLM 인사이트 생성 중...")
        response = llm.invoke(messages)
        
        # 응답 내용 정리 (마크다운 코드 블록 제거)
        content = response.content.strip()
        
        # ```json ... ``` 형태로 감싸져 있으면 제거
        if content.startswith("```json"):
            content = content[7:]  # ```json 제거
        elif content.startswith("```"):
            content = content[3:]  # ``` 제거
        
        if content.endswith("```"):
            content = content[:-3]  # ``` 제거
        
        content = content.strip()
        
        # JSON 파싱
        result = json.loads(content)
        print("✅ 인사이트 생성 완료")
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON 파싱 오류: {e}")
        print(f"응답 내용: {response.content}")
        raise
    except Exception as e:
        print(f"❌ LLM 호출 오류: {e}")
        raise


# ===========================
# 4️⃣ DB 저장
# ===========================
def save_insight_to_db(product_id: int, user_id: int, insight_data: dict) -> int:
    """
    인사이트 데이터를 DB에 저장
    Returns: insight_id
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # 데이터 추출
        summary = insight_data.get("summary", {})
        pos_keywords = ", ".join(summary.get("keywords", {}).get("positive", []))
        neg_keywords = ", ".join(summary.get("keywords", {}).get("negative", []))
        insight_summary = summary.get("insight_one_liner", "")
        improvement_suggestion = summary.get("recommendation", "")
        content_json = json.dumps(insight_data.get("report", {}), ensure_ascii=False)
        
        # INSERT 쿼리
        cursor.execute(
            """
            INSERT INTO tb_productInsight (
                product_id,
                user_id,
                pos_top_keywords,
                neg_top_keywords,
                insight_summary,
                improvement_suggestion,
                content,
                created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                product_id,
                user_id,
                pos_keywords,
                neg_keywords,
                insight_summary,
                improvement_suggestion,
                content_json,
                datetime.now()
            )
        )
        
        # insight_id 가져오기
        insight_id = cursor.lastrowid
        
        print(f"✅ tb_productInsight에 저장 완료 (insight_id={insight_id})")
        
        return insight_id
        
    finally:
        conn.close()


# ===========================
# 🎯 메인 함수
# ===========================
def generate_insight_from_db(product_id: int, user_id: int = None) -> int:
    """
    제품 리뷰 인사이트 생성 메인 함수
    
    Args:
        product_id: 제품 ID
        user_id: 사용자 ID (선택, 없으면 None)
    
    Returns:
        insight_id: 생성된 인사이트 ID
    """
    try:
        print(f"🔍 인사이트 생성 시작 (product_id={product_id})")
        
        # 1. 데이터 조회
        print("📊 리뷰 데이터 조회 중...")
        data = fetch_review_data(product_id)
        
        if data["total_reviews"] == 0:
            print("⚠️ 리뷰 데이터가 없습니다.")
            return None
        
        print(f"✅ 리뷰 {data['total_reviews']}개 조회 완료")
        
        # 2. 프롬프트 생성
        prompt = build_analysis_prompt(data)
        
        # 3. LLM 호출
        insight = generate_insight_with_llm(prompt)
        
        # 4. DB 저장
        insight_id = save_insight_to_db(product_id, user_id, insight)
        
        print(f"🎉 인사이트 생성 완료 (insight_id={insight_id})")
        
        return insight_id
        
    except Exception as e:
        print(f"❌ 인사이트 생성 실패: {e}")
        import traceback
        traceback.print_exc()
        return None


# ===========================
# 🧪 테스트 실행
# ===========================
if __name__ == "__main__":
    from utils.db_connect import init_db_pool, close_db_pool
    
    # 테스트용
    product_id = 1012
    user_id = 10001
    
    try:
        # DB Pool 초기화
        print("🔧 DB Connection Pool 초기화 중...")
        init_db_pool()
        
        # 인사이트 생성
        insight_id = generate_insight_from_db(product_id, user_id)
        
        if insight_id:
            print(f"\n✅ 테스트 성공! insight_id={insight_id}")
        else:
            print("\n❌ 테스트 실패")
    
    finally:
        # DB Pool 정리
        print("\n🧹 DB Connection Pool 정리 중...")
        close_db_pool()
