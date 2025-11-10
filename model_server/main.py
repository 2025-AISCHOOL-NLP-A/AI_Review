from fastapi import FastAPI
from app.api.v1.routes import router as v1_router

app = FastAPI(title="ABSA Steam Service", version="1.0")
app.include_router(v1_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)