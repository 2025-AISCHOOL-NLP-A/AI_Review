from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

from app.routes import analysis_router, insight_router

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
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(analysis_router.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(insight_router.router, prefix="/api/insights", tags=["Insights"])

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

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True,
        log_level="info"
    )