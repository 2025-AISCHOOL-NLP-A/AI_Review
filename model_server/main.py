import sys, os
sys.path.append(os.path.dirname(__file__))  # ✅ 반드시 최상단에 위치해야 함
print("📂 Current working dir:", os.getcwd())
print("📦 sys.path[0]:", sys.path[0])

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.v1.routes import router as v1_router

app = FastAPI(title="ABSA Steam Service", version="1.0")

# ✅ 정적 파일 서빙
app.mount("/static", StaticFiles(directory="static"), name="static")

# ✅ API 라우트 등록
app.include_router(v1_router)

@app.get("/")
def root():
    return {"status": "ok", "message": "Model server running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
