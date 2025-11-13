FROM python:3.10-slim

WORKDIR /app

# 시스템 패키지 업데이트
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 8000

# 환경 변수 설정 (UTF-8 인코딩)
ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=utf-8

# 서버 시작
CMD ["python", "-m", "uvicorn", "model_server.main:app", "--host", "0.0.0.0", "--port", "8000"]
