# AI 리뷰 분석 서비스

FastAPI 기반의 AI 리뷰 분석 API 서버입니다.

## 주요 기능

- **리뷰 분석**: 감정 분석, 키워드 추출, 평점 분석
- **인사이트 생성**: 비즈니스 인사이트 및 개선사항 제안
- **트렌드 분석**: 카테고리별 트렌드 분석
- **제품 비교**: 여러 제품 비교 분석

## API 엔드포인트

### 분석 API (/v1)
- `POST /v1/analyze-batch` - 배치 리뷰 분석
- `POST /v1/products/{product_id}/reviews/analysis` - 제품 리뷰 전체 분석 파이프라인
- `GET /v1/health` - 헬스체크
- `GET /` - 루트 상태 확인 (status ok)

## 설치 및 실행

1. **가상환경 생성 (권장)**
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. **의존성 설치**
```bash
pip install -r requirements.txt
```

3. **서버 실행**
```bash
python main.py
```

또는 아래와 같이 실행할 수 있습니다.

```bash
# uvicorn 직접 실행 (핫리로드 포함)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 모듈 실행 (sys.path 설정을 활용)
python -m model_server.main
```

4. **API 문서 확인**
```
http://localhost:8000/docs
```

## 환경 변수 (.env)

다음 환경 변수를 설정하세요.

```
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_db

# OpenAI (인사이트 생성 시 필요)
OPENAI_API_KEY=sk-...
```

주의: 인사이트 생성을 사용하지 않을 경우 `OPENAI_API_KEY`가 없어도 서버는 동작하지만, `/v1/products/{product_id}/reviews/analysis` 내 인사이트 생성 단계에서 실패할 수 있습니다.

## 프로젝트 구조

```
model_server/
├── main.py                    # FastAPI 메인 애플리케이션
├── requirements.txt           # Python 의존성
├── .env                      # 환경 변수
├── app/
│   ├── __init__.py
│   ├── api/
│   │   └── v1/
│   │       └── routes.py     # API 라우터
│   ├── domains/              # 도메인별 파이프라인
│   │   ├── steam/
│   │   ├── cosmetics/
│   │   └── electronics/
│   └── models/               # 모델 레지스트리
├── utils/                     # 유틸리티 함수
│   ├── db_connect.py
│   ├── generate_insight.py
│   └── generate_wordcloud_from_db.py
└── README.md
```

## 기술 스택

- **Framework**: FastAPI
- **언어**: Python 3.8+
- **AI/ML**: scikit-learn, WordCloud, KoNLPy
- **기타**: Pydantic, Uvicorn

## 백엔드 연동

Node.js 백엔드에서 다음과 같이 호출:

```javascript
// 제품 리뷰 전체 분석 파이프라인
const response = await fetch('http://localhost:8000/v1/products/1/reviews/analysis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
});

// 배치 리뷰 분석
const batchResponse = await fetch('http://localhost:8000/v1/analyze-batch?domain=steam', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    texts: ["좋은 제품입니다", "별로네요"]
  })
});
```

## 엔드포인트 상세

- `GET /` → `{ "status": "ok", "message": "Model server running" }`
- `GET /v1/health` → `{ "status": "ok", "domain": "steam" }`

- `POST /v1/analyze-batch?domain=steam|cosmetics|electronics`
  - Request(JSON):
    ```json
    {
      "texts": ["리뷰 텍스트1", "리뷰 텍스트2"],
      "aspect_th": 0.35,
      "margin": 0.03
    }
    ```
  - Response(JSON):
    ```json
    {
      "items": [ { /* 각 리뷰 분석 결과 */ } ],
      "count": 2
    }
    ```

- `POST /v1/products/{product_id}/reviews/analysis?domain=steam|cosmetics|electronics`
  - domain 미지정 시 제품 카테고리로 자동 결정됩니다.
  - 처리 내용: 리뷰 조회 → 도메인 모델 분석 → tb_reviewAnalysis 저장 → 인사이트 생성 → 대시보드 업데이트(프로시저) → 워드클라우드 생성
  - 성공 시 주요 필드 예:
    ```json
    {
      "success": true,
      "product_id": 123,
      "category_id": 101,
      "domain": "electronics",
      "review_count": 250,
      "analyzed_count": 250,
      "inserted_count": 800,
      "insight_id": 456,
      "wordcloud_path": "/static/wordclouds/123_electronics.png",
      "message": "리뷰 분석, 인사이트 생성 및 대시보드 업데이트 완료"
    }
    ```

## 정적 파일

- 서버는 `model_server/static` 폴더를 `/static` 경로로 서빙합니다.
- 응답의 `wordcloud_path`는 `/static/...` 형태이며 브라우저에서 직접 접근 가능합니다.

## 성능/시간 및 타임아웃 안내

## LLM/모델 주의

- 인사이트 생성은 OpenAI API를 사용합니다. `OPENAI_API_KEY`가 필요합니다.
- 코드 디폴트 모델명이 환경에 따라 유효하지 않을 수 있으므로, 운영 시 실제 사용 가능한 모델로 설정해 주세요. (예: `gpt-4o-mini` 등)