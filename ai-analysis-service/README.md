# AI 리뷰 분석 서비스

FastAPI 기반의 AI 리뷰 분석 API 서버입니다.

## 주요 기능

- **워드클라우드 생성**: 텍스트 데이터를 시각화
- **감정 분석**: 리뷰의 긍정/부정/중립 감정 분석
- **종합 분석**: 워드클라우드 + 감정 분석 + 인사이트 제공

## 설치 및 실행

1. 가상환경 생성 (권장)
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. 의존성 설치
```bash
pip install -r requirements.txt
```

3. 서버 실행
```bash
python main.py
```

또는

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

4. API 문서 확인
```
http://localhost:8000/docs
```

## API 엔드포인트

### 1. 워드클라우드 생성
```
POST /api/wordcloud
```

**요청 예시:**
```json
{
  "text": "이 카페는 정말 좋아요. 커피도 맛있고 직원들도 친절해요.",
  "width": 800,
  "height": 400,
  "max_words": 100
}
```

**응답 예시:**
```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "keywords": [
    {"word": "카페", "frequency": 5, "weight": 1.0},
    {"word": "좋다", "frequency": 3, "weight": 0.6}
  ],
  "status": "success"
}
```

### 2. 감정 분석
```
POST /api/sentiment
```

**요청 예시:**
```json
{
  "text": "이 제품은 정말 훌륭합니다. 강력히 추천해요!"
}
```

**응답 예시:**
```json
{
  "sentiment": "긍정",
  "confidence": 0.85,
  "positive": 70.0,
  "neutral": 20.0,
  "negative": 10.0
}
```

### 3. 종합 분석
```
POST /api/analyze
```

**요청 예시:**
```json
{
  "reviews": [
    "이 카페는 정말 좋아요. 커피도 맛있고 직원들도 친절해요.",
    "분위기가 좋고 가격도 합리적입니다.",
    "다시 방문하고 싶어요."
  ],
  "title": "카페 리뷰 분석"
}
```

## 기술 스택

- **Framework**: FastAPI
- **언어**: Python 3.8+
- **라이브러리**: 
  - WordCloud (워드클라우드 생성)
  - Matplotlib (이미지 처리)
  - Jieba (한국어 형태소 분석)
  - Pandas, NumPy (데이터 처리)

## 프로젝트 구조

```
ai-analysis-service/
├── main.py                    # FastAPI 메인 애플리케이션
├── requirements.txt           # Python 의존성
├── .env                      # 환경 변수
├── app/
│   ├── __init__.py
│   └── services/
│       ├── __init__.py
│       ├── wordcloud_service.py  # 워드클라우드 서비스
│       └── sentiment_service.py  # 감정 분석 서비스
└── README.md
```

## 환경 변수

`.env` 파일에서 다음 변수들을 설정할 수 있습니다:

- `PORT`: 서버 포트 (기본값: 8000)
- `DEBUG`: 디버그 모드 (기본값: True)

## Node.js 서버와 연동

Node.js Express 서버에서 다음과 같이 호출할 수 있습니다:

```javascript
const response = await fetch('http://localhost:8000/api/wordcloud', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: reviewText,
    width: 800,
    height: 400
  })
});

const result = await response.json();
```