# AI 분석 서버 프로젝트

FastAPI 기반의 AI 리뷰 분석 API 서버입니다. ABSA(Aspect-Based Sentiment Analysis) 기반 감정 분석, 비즈니스 인사이트 생성, 워드클라우드 생성 등의 기능을 제공합니다.

## 기술 스택

- **FastAPI** 0.104.1 - 웹 프레임워크
- **Python** 3.8+ - 프로그래밍 언어
- **PyTorch** 2.1.2 - 딥러닝 프레임워크
- **Transformers** 4.55.2 - 사전 학습 모델
- **LangChain** (langchain-openai 1.0.3) - LLM 연동
- **OpenAI** 2.8.1 - GPT 모델 API
- **WordCloud** 1.9.2 - 워드클라우드 생성
- **KoNLPy** 0.6.0 - 한국어 자연어 처리
- **Jieba** 0.42.1 - 중국어 형태소 분석
- **scikit-learn** 1.3.2 - 머신러닝 유틸리티
- **Pandas** 2.1.4 - 데이터 처리
- **PyMySQL** 1.1.0 - MySQL 연결
- **Uvicorn** 0.24.0 - ASGI 서버

## 주요 기능

### 감정 분석 (ABSA)
- **도메인별 모델 지원**: Steam(게임), Cosmetics(화장품), Electronics(전자기기)
- **측면 기반 감정 분석**: 리뷰 텍스트에서 키워드별 긍정/부정/중립 감정 분석
- **배치 처리**: 대량 리뷰를 효율적으로 처리
- **키워드 부스팅**: 도메인별 키워드 가중치 적용

### 인사이트 생성
- **LangChain + OpenAI**: GPT 모델을 활용한 비즈니스 인사이트 생성
- **데이터 기반 분석**: 리뷰 데이터를 종합하여 개선사항 제안
- **자동 저장**: 생성된 인사이트를 데이터베이스에 자동 저장

### 워드클라우드 생성
- **도메인별 불용어 처리**: 카테고리별 맞춤형 불용어 필터링
- **기간 필터링**: 특정 기간의 리뷰만 선택하여 워드클라우드 생성
- **정적 파일 서빙**: 생성된 워드클라우드를 `/static` 경로로 제공

### 대시보드 데이터 업데이트
- **프로시저 호출**: 저장 프로시저를 통한 대시보드 데이터 집계
- **실시간 업데이트**: 분석 완료 후 자동으로 대시보드 데이터 갱신

### 진행 상황 추적 (SSE)
- **Server-Sent Events**: 분석 진행 상황을 실시간으로 스트리밍
- **단계별 진행률**: 각 처리 단계별 진행률 표시

## 프로젝트 구조

```
model_server/
├── main.py                    # FastAPI 메인 애플리케이션
├── requirements.txt           # Python 의존성
├── .env                      # 환경 변수 설정
├── app/
│   ├── __init__.py
│   ├── api/                   # API 라우터
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── routes.py     # API 엔드포인트 정의
│   ├── domains/              # 도메인별 파이프라인
│   │   ├── __init__.py
│   │   ├── steam/            # 게임 리뷰 분석
│   │   │   ├── pipeline.py   # 분석 파이프라인
│   │   │   ├── keywords.py   # 키워드 정의
│   │   │   └── config.json   # 설정 파일
│   │   ├── cosmetics/        # 화장품 리뷰 분석
│   │   │   ├── pipeline.py
│   │   │   ├── keywords.py
│   │   │   └── config.json
│   │   └── electronics/      # 전자기기 리뷰 분석
│   │       ├── pipeline.py
│   │       ├── keywords.py
│   │       └── config.json
│   └── models/               # 모델 레지스트리
│       ├── __init__.py
│       └── registry.py       # 모델 로딩 및 관리
├── utils/                     # 유틸리티 함수
│   ├── __init__.py
│   ├── db_connect.py          # 데이터베이스 연결 풀
│   ├── generate_insight.py   # 인사이트 생성
│   ├── generate_wordcloud_from_db.py # 워드클라우드 생성
│   └── stopwords/            # 불용어 사전
│       ├── base.txt          # 기본 불용어
│       ├── steam.txt         # 게임 도메인 불용어
│       ├── cosmetics.txt     # 화장품 도메인 불용어
│       └── electronics.txt   # 전자기기 도메인 불용어
├── static/                    # 정적 파일
│   └── wordclouds/           # 생성된 워드클라우드 이미지
└── README.md
```

## 시작하기

### 필수 요구사항
- Python 3.8 이상
- Java (KoNLPy 사용 시 필요)
- MySQL 8.0 이상
- OpenAI API Key (인사이트 생성 시 필요)

### Java 설치 (KoNLPy 사용 시)

KoNLPy를 사용하려면 Java가 필요합니다. 자세한 설치 방법은 `JAVA_SETUP.md`를 참고하세요.

### 가상환경 생성 (권장)

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 의존성 설치

```bash
pip install -r requirements.txt
```

### 환경 변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# OpenAI API (인사이트 생성 시 필요)
OPENAI_API_KEY=sk-...

# 모델 설정 (선택사항)
PHASE1_MODEL=your_phase1_model_name
PHASE2_MODEL=your_phase2_model_name
```

**주의**: 인사이트 생성을 사용하지 않을 경우 `OPENAI_API_KEY`가 없어도 서버는 동작하지만, `/v1/products/{product_id}/reviews/analysis` 내 인사이트 생성 단계에서 실패할 수 있습니다.

### 서버 실행

```bash
# 방법 1: main.py 직접 실행
python main.py

# 방법 2: uvicorn 직접 실행 (핫리로드 포함)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 방법 3: 모듈 실행
python -m model_server.main
```

서버는 기본적으로 [http://localhost:8000](http://localhost:8000)에서 실행됩니다.

### API 문서 확인

FastAPI 자동 생성 문서:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## API 엔드포인트

### 기본 엔드포인트

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|-----------|------|----------|
| GET | `/` | 서버 상태 확인 | ❌ |
| GET | `/v1/health` | 헬스체크 | ❌ |

### 분석 API (`/v1`)

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|-----------|------|----------|
| POST | `/v1/analyze-batch` | 배치 리뷰 분석 | ❌ |
| POST | `/v1/products/{product_id}/reviews/analysis` | 제품 리뷰 전체 분석 파이프라인 (SSE) | ❌ |
| POST | `/v1/products/{product_id}/wordcloud` | 워드클라우드 생성 | ❌ |

## API 엔드포인트 상세

### 1. 배치 리뷰 분석

**엔드포인트**: `POST /v1/analyze-batch?domain=steam|cosmetics|electronics`

**요청 예시**:
```json
{
  "texts": ["리뷰 텍스트1", "리뷰 텍스트2"],
  "aspect_th": 0.35,
  "margin": 0.03
}
```

**응답 예시**:
```json
{
  "items": [
    {
      "text": "리뷰 텍스트1",
      "results": [
        {
          "aspect": "키워드명",
          "label": "긍정|부정|중립",
          "confidence": 0.95
        }
      ]
    }
  ],
  "count": 2
}
```

**파라미터**:
- `domain` (쿼리): 분석할 도메인 (steam, cosmetics, electronics)
- `texts` (body): 분석할 리뷰 텍스트 배열
- `aspect_th` (body, 선택): 측면 감지 임계값 (기본값: 0.35)
- `margin` (body, 선택): 마진 값 (기본값: 0.03)

### 2. 제품 리뷰 전체 분석 파이프라인

**엔드포인트**: `POST /v1/products/{product_id}/reviews/analysis?domain=steam|cosmetics|electronics`

**처리 단계**:
1. DB에서 제품 정보 및 리뷰 조회
2. 도메인 모델로 리뷰 분석 (ABSA)
3. 분석 결과를 `tb_reviewAnalysis`에 저장
4. AI 인사이트 생성 (LangChain + OpenAI)
5. 인사이트를 `tb_productInsight`에 저장
6. 대시보드 데이터 업데이트 (프로시저 호출)
7. 워드클라우드 생성

**응답 형식** (SSE 스트리밍):
```
data: {"step": "start", "progress": 0, "message": "분석 시작"}

data: {"step": "analysis", "progress": 30, "message": "분석 중..."}

data: {"step": "result", "progress": 100, "data": {...}}
```

**최종 응답 예시**:
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
  "wordcloud_path": "/static/wordclouds/product_123_electronics.png",
  "message": "리뷰 분석, 인사이트 생성 및 대시보드 업데이트 완료"
}
```

**파라미터**:
- `product_id` (path): 분석할 제품 ID
- `domain` (쿼리, 선택): 도메인 지정 (미지정 시 제품 카테고리로 자동 결정)

### 3. 워드클라우드 생성

**엔드포인트**: `POST /v1/products/{product_id}/wordcloud?domain=steam&start_date=2024-01-01&end_date=2024-12-31`

**응답 예시**:
```json
{
  "success": true,
  "wordcloud": "base64_encoded_image_string"
}
```

**파라미터**:
- `product_id` (path): 제품 ID
- `domain` (쿼리, 선택): 도메인 지정
- `start_date` (쿼리, 선택): 시작 날짜 (YYYY-MM-DD)
- `end_date` (쿼리, 선택): 종료 날짜 (YYYY-MM-DD)

## 도메인별 분석

### 지원 도메인

1. **Steam (게임)**
   - 카테고리 ID: 103
   - 키워드: 게임플레이, 그래픽, 사운드, 스토리 등

2. **Cosmetics (화장품)**
   - 카테고리 ID: 102
   - 키워드: 피부, 색상, 지속력, 향 등

3. **Electronics (전자기기)**
   - 카테고리 ID: 101
   - 키워드: 성능, 배터리, 디자인, 가격 등

### 도메인 자동 결정

제품의 `category_id`에 따라 자동으로 도메인이 결정됩니다:
- `category_id = 103` → `steam`
- `category_id = 102` → `cosmetics`
- `category_id = 101` → `electronics`

쿼리 파라미터로 `domain`을 지정하면 해당 도메인을 우선 사용합니다.

## 주요 기능 상세

### ABSA (Aspect-Based Sentiment Analysis)

1. **Phase-1: 측면 감지**
   - 리뷰 텍스트에서 관련 키워드(측면) 감지
   - Transformer 모델 사용

2. **Phase-2: 감정 분류**
   - 감지된 측면에 대한 감정 분류 (긍정/부정/중립)
   - 별도의 분류 모델 사용

3. **키워드 부스팅**
   - 도메인별 중요 키워드에 가중치 적용
   - 정확도 향상

### 인사이트 생성 프로세스

1. **데이터 수집**
   - 제품의 전체 리뷰 수
   - 키워드별 긍정/부정 집계
   - 샘플 리뷰 (최근 200개)

2. **프롬프트 생성**
   - 수집된 데이터를 기반으로 분석 프롬프트 생성
   - 도메인별 맞춤형 프롬프트

3. **LLM 호출**
   - LangChain을 통한 OpenAI API 호출
   - GPT 모델을 사용한 인사이트 생성

4. **결과 저장**
   - 생성된 인사이트를 `tb_productInsight`에 저장

### 워드클라우드 생성

1. **리뷰 데이터 조회**
   - 제품의 리뷰 텍스트 조회
   - 기간 필터링 (선택사항)

2. **전처리**
   - 도메인별 불용어 제거
   - 형태소 분석 (KoNLPy 또는 Jieba)

3. **워드클라우드 생성**
   - WordCloud 라이브러리 사용
   - 이미지 파일로 저장 또는 base64 인코딩

4. **정적 파일 서빙**
   - 생성된 이미지를 `/static/wordclouds/` 경로에 저장
   - FastAPI StaticFiles를 통한 서빙

## 백엔드 연동

Node.js 백엔드에서 다음과 같이 호출할 수 있습니다:

```javascript
// 제품 리뷰 전체 분석 파이프라인
const response = await fetch('http://localhost:8000/v1/products/1/reviews/analysis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
});

// SSE 스트리밍 응답 처리
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log('Progress:', data.progress, data.message);
    }
  }
}
```

```javascript
// 배치 리뷰 분석
const batchResponse = await fetch('http://localhost:8000/v1/analyze-batch?domain=steam', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    texts: ["좋은 제품입니다", "별로네요"],
    aspect_th: 0.35,
    margin: 0.03
  })
});

const result = await batchResponse.json();
console.log(result);
```

## 데이터베이스

### 사용 테이블

- `tb_product`: 제품 정보
- `tb_review`: 리뷰 데이터
- `tb_reviewAnalysis`: 분석 결과
- `tb_keyword`: 키워드 정보
- `tb_productInsight`: 인사이트 데이터
- `tb_productDashboard`: 대시보드 집계 데이터

### 저장 프로시저

- `sp_update_product_dashboard`: 대시보드 데이터 업데이트

## 성능 및 최적화

### 배치 처리
- 대량 리뷰 분석 시 배치 처리로 성능 향상
- 기본 배치 크기: 8-16개

### 모델 캐싱
- ModelRegistry를 통한 모델 재사용
- 메모리 효율적인 모델 로딩

### 데이터베이스 연결 풀
- DBUtils를 사용한 연결 풀 관리
- 자동 재연결 기능

## 주의사항

### LLM/모델 설정
- 인사이트 생성은 OpenAI API를 사용합니다. `OPENAI_API_KEY`가 필요합니다.
- 코드 디폴트 모델명이 환경에 따라 유효하지 않을 수 있으므로, 운영 시 실제 사용 가능한 모델로 설정해 주세요. (예: `gpt-4o-mini`, `gpt-3.5-turbo` 등)

### Java 설치 (KoNLPy)
- KoNLPy를 사용하려면 Java가 필요합니다.
- 자세한 설치 방법은 `JAVA_SETUP.md`를 참고하세요.

### 메모리 사용량
- Transformer 모델은 메모리를 많이 사용합니다.
- 대량 리뷰 분석 시 메모리 모니터링이 필요합니다.

### 타임아웃
- 대량 리뷰 분석은 시간이 오래 걸릴 수 있습니다.
- 클라이언트 측에서 적절한 타임아웃 설정이 필요합니다.

## 개발 팁

1. **환경 변수**: `.env` 파일을 사용하여 민감한 정보 관리
2. **핫리로드**: `--reload` 옵션으로 개발 중 자동 재시작
3. **API 문서**: FastAPI 자동 생성 문서 활용
4. **로깅**: 콘솔 로그를 통해 분석 진행 상황 추적

## 참고사항

- 이 프로젝트는 FastAPI를 사용합니다.
- 모든 API 요청은 JSON 형식으로 주고받습니다.
- SSE(Server-Sent Events)를 사용하여 진행 상황을 실시간으로 전송합니다.
- 정적 파일은 `/static` 경로로 서빙됩니다.
- 워드클라우드 이미지는 `static/wordclouds/` 폴더에 저장됩니다.
