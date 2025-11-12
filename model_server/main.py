import sys, os

# python -m model_server.main으로 실행할 때를 위한 경로 설정
# __file__은 model_server/main.py의 경로
_model_server_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_model_server_dir)  # AI_Review 디렉토리

# AI_Review를 sys.path에 추가 (python -m 실행 시 필요)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)
# model_server도 sys.path에 추가
if _model_server_dir not in sys.path:
    sys.path.insert(0, _model_server_dir)

print("📂 Current working dir:", os.getcwd())
print("📦 sys.path[0]:", sys.path[0])
print("📦 model_server dir:", _model_server_dir)
print("📦 utils 경로 확인:", os.path.join(_model_server_dir, "utils"))
print("📦 utils 존재 여부:", os.path.exists(os.path.join(_model_server_dir, "utils")))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.v1.routes import router as v1_router

app = FastAPI(title="ABSA Steam Service", version="1.0")

# ✅ 정적 파일 서빙 (절대 경로 사용)
static_dir = os.path.join(_model_server_dir, "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# ✅ API 라우트 등록
app.include_router(v1_router)

@app.get("/")
def root():
    return {"status": "ok", "message": "Model server running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)