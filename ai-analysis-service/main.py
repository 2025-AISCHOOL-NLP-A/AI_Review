from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv

from app.services.wordcloud_service import WordCloudService
from app.services.sentiment_service import SentimentService

# 환경 변수 로드
load_dotenv()

app = FastAPI(
    title="AI 리뷰 분석 서비스",
    description="리뷰 데이터 분석을 위한 AI API 서버",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 서비스 인스턴스
wordcloud_service = WordCloudService()
sentiment_service = SentimentService()

# 요청 모델
class ReviewAnalysisRequest(BaseModel):
    reviews: List[str]
    title: Optional[str] = "리뷰 분석"

class WordCloudRequest(BaseModel):
    text: str
    width: Optional[int] = 800
    height: Optional[int] = 400
    max_words: Optional[int] = 100

class SentimentRequest(BaseModel):
    text: str

# 응답 모델
class WordCloudResponse(BaseModel):
    image_base64: str
    keywords: List[dict]
    status: str

class SentimentResponse(BaseModel):
    sentiment: str
    confidence: float
    positive: float
    neutral: float
    negative: float

class AnalysisResponse(BaseModel):
    wordcloud: WordCloudResponse
    sentiment: SentimentResponse
    summary: str
    insights: List[str]

@app.get("/")
async def root():
    return {
        "message": "AI 리뷰 분석 서비스 API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-analysis-service"}

@app.post("/api/wordcloud", response_model=WordCloudResponse)
async def generate_wordcloud(request: WordCloudRequest):
    """워드클라우드 생성 API"""
    try:
        result = await wordcloud_service.generate_wordcloud(
            text=request.text,
            width=request.width,
            height=request.height,
            max_words=request.max_words
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"워드클라우드 생성 실패: {str(e)}")

@app.post("/api/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """감정 분석 API"""
    try:
        result = await sentiment_service.analyze_sentiment(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"감정 분석 실패: {str(e)}")

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_reviews(request: ReviewAnalysisRequest):
    """종합 리뷰 분석 API"""
    try:
        # 리뷰 텍스트 합치기
        combined_text = " ".join(request.reviews)
        
        # 워드클라우드 생성
        wordcloud_result = await wordcloud_service.generate_wordcloud(
            text=combined_text,
            width=800,
            height=400,
            max_words=50
        )
        
        # 감정 분석
        sentiment_result = await sentiment_service.analyze_sentiment(combined_text)
        
        # 인사이트 생성
        insights = await sentiment_service.generate_insights(
            sentiment_result, 
            wordcloud_result.keywords
        )
        
        # 요약 생성
        summary = f"총 {len(request.reviews)}개의 리뷰를 분석했습니다. " \
                 f"전체적으로 {sentiment_result.sentiment} 감정이 {sentiment_result.confidence:.1%} 확률로 나타났습니다."
        
        return AnalysisResponse(
            wordcloud=wordcloud_result,
            sentiment=sentiment_result,
            summary=summary,
            insights=insights
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"리뷰 분석 실패: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True,
        log_level="info"
    )