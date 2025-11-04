# AI 리뷰 분석 서비스

FastAPI 기반의 AI 리뷰 분석 API 서버입니다.

## 🚀 주요 기능

- **리뷰 분석**: 감정 분석, 키워드 추출, 평점 분석
- **인사이트 생성**: 비즈니스 인사이트 및 개선사항 제안
- **트렌드 분석**: 카테고리별 트렌드 분석
- **제품 비교**: 여러 제품 비교 분석

## 📋 API 엔드포인트

### 분석 API (/api/analysis)
- `POST /api/analysis/products/{product_id}/reviews` - 제품 리뷰 분석
- `GET /api/analysis/products/{product_id}/reviews/status` - 분석 상태 확인

### 인사이트 API (/api/insights)
- `POST /api/insights/generate` - 인사이트 생성
- `POST /api/insights/compare` - 제품 비교 분석
- `GET /api/insights/trends/{category_id}` - 카테고리 트렌드

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
│   ├── routes/               # API 라우터
│   │   ├── analysis_router.py
│   │   └── insight_router.py
│   └── services/             # 비즈니스 로직
│       ├── analysis_service.py
│       └── insight_service.py
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
const response = await fetch('http://localhost:8000/api/analysis/products/1/reviews', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    product_id: 1,
    reviews: [
      {review_id: 1, review_text: "좋은 제품입니다", rating: 4.5}
    ]
  })
});
```