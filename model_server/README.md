# AI 리뷰 분석 서비스

FastAPI 기반의 AI 리뷰 분석 API 서버입니다.

## 🚀 주요 기능

- **리뷰 분석**: 감정 분석, 키워드 추출, 평점 분석
- **인사이트 생성**: 비즈니스 인사이트 및 개선사항 제안
- **트렌드 분석**: 카테고리별 트렌드 분석
- **제품 비교**: 여러 제품 비교 분석

## 📋 API 엔드포인트

### 분석 API (/v1)
- `POST /v1/analyze-batch` - 배치 리뷰 분석
- `POST /v1/products/{product_id}/reviews/analysis` - 제품 리뷰 전체 분석 파이프라인
- `GET /v1/health` - 헬스체크

## 🛠 설치 및 실행

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

4. **API 문서 확인**
```
http://localhost:8000/docs
```

## 🏗 프로젝트 구조

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

## 🔧 기술 스택

- **Framework**: FastAPI
- **언어**: Python 3.8+
- **AI/ML**: scikit-learn, WordCloud, KoNLPy
- **기타**: Pydantic, Uvicorn

## 🔗 백엔드 연동

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