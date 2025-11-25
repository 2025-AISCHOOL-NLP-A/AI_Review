# AI 리뷰 분석 서비스

마이크로서비스 아키텍처 기반의 AI 리뷰 분석 플랫폼입니다. 사용자가 제품 리뷰를 업로드하면 ABSA(Aspect-Based Sentiment Analysis) 기반 감정 분석을 수행하고, 비즈니스 인사이트와 시각화된 대시보드를 제공합니다.

## 📋 목차

- [아키텍처](#-아키텍처)
- [서비스 구성](#-서비스-구성)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [API 엔드포인트](#-api-엔드포인트)
- [개발 환경](#-개발-환경)
- [프로젝트 구조](#-프로젝트-구조)
- [문서](#-문서)

## 🏗 아키텍처

```
AI_Review/
├── backend/           # Node.js Express API 서버
│   ├── src/
│   │   ├── controllers/    # 비즈니스 로직
│   │   ├── routes/        # API 라우트
│   │   ├── middlewares/   # 인증 미들웨어
│   │   ├── models/        # 데이터베이스 모델
│   │   ├── services/      # 외부 서비스 연동
│   │   └── utils/         # 유틸리티
│   └── README.md
├── frontend/          # React 웹 애플리케이션
│   ├── src/
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── hooks/        # 커스텀 훅
│   │   ├── services/     # API 서비스
│   │   └── utils/        # 유틸리티 함수
│   └── README.md
├── model_server/      # Python FastAPI AI 분석 서버
│   ├── app/
│   │   ├── api/          # API 라우터
│   │   ├── domains/      # 도메인별 파이프라인
│   │   └── models/       # 모델 레지스트리
│   ├── utils/            # 유틸리티 함수
│   └── README.md
├── database/         # 데이터베이스 스키마 및 스크립트
│   ├── schema.sql    # 데이터베이스 스키마
│   ├── seed.sql      # 시드 데이터
│   └── views.sql     # 뷰 정의
├── docs/            # 프로젝트 문서
│   ├── REQUIREMENTS.md           # 요구사항 명세서
│   └── USECASE_SPECIFICATION.md  # 유스케이스 명세서
└── README.md
```

## 🚀 서비스 구성

### Backend Service (Node.js + Express)

**역할**: REST API 서버, 사용자 인증, 데이터 관리, AI 서버 연동

**주요 기능**:
- 사용자 인증 및 권한 관리 (JWT)
- 제품 및 리뷰 데이터 관리
- 파일 업로드 및 파싱 (CSV, Excel)
- AI 분석 서버 연동
- 대시보드 데이터 제공

**기술 스택**: Node.js, Express 5.1.0, MySQL2, JWT, bcrypt, Multer, Nodemailer

**자세한 내용**: [Backend README](./backend/README.md)

### Frontend Service (React + Vite)

**역할**: 웹 사용자 인터페이스, 대시보드 시각화

**주요 기능**:
- 사용자 인증 UI (로그인, 회원가입, 비밀번호 찾기)
- 대시보드 (KPI 카드, 차트, 워드클라우드, AI 인사이트)
- 제품 관리 (워크플레이스)
- 리뷰 관리 및 필터링
- 세션 관리 및 자동 로그아웃

**기술 스택**: React 19.2.0, Vite 7.1.12, React Router DOM, Chart.js, Axios

**자세한 내용**: [Frontend README](./frontend/README.md)

### AI Analysis Service (Python + FastAPI)

**역할**: 리뷰 감정 분석, 인사이트 생성, 워드클라우드 생성

**주요 기능**:
- ABSA 기반 감정 분석 (도메인별 모델)
- 비즈니스 인사이트 생성 (LangChain + OpenAI)
- 워드클라우드 생성
- 대시보드 데이터 업데이트

**기술 스택**: Python 3.8+, FastAPI, PyTorch, Transformers, LangChain, OpenAI, WordCloud

**자세한 내용**: [Model Server README](./model_server/README.md)

## ✨ 주요 기능

### 인증 및 사용자 관리
- 회원가입 (아이디 중복 검사, 이메일 인증)
- 로그인 (JWT 토큰 발급)
- 아이디/비밀번호 찾기
- 회원정보 수정 및 탈퇴
- 세션 관리 (자동 만료, 연장)

### 제품 관리
- 제품 생성 및 수정
- 제품 목록 조회 (검색, 필터링, 정렬)
- 제품 소유권 관리
- 제품 삭제 (CASCADE)

### 리뷰 데이터 수집
- CSV/Excel 파일 업로드 (드래그 앤 드롭)
- 파일 파싱 및 검증 (매직 넘버 검증)
- 컬럼 매핑 (리뷰, 날짜, 평점)
- 중복 리뷰 체크
- 스팀 리뷰 형식 지원

### AI 리뷰 분석
- ABSA 기반 감정 분석 (Steam, Cosmetics, Electronics)
- 키워드별 긍정/부정/중립 분류
- 배치 처리로 대량 리뷰 분석
- 분석 진행 상황 실시간 추적 (SSE)

### 비즈니스 인사이트
- LangChain + OpenAI를 활용한 인사이트 생성
- 리뷰 데이터 종합 분석
- 개선사항 제안

### 대시보드 시각화
- KPI 카드 (전체 리뷰 수, 긍정/부정 비율, 제품 점수)
- 차트 (일별 트렌드, 레이더 차트, 분할 막대 차트, 히트맵)
- 워드클라우드
- AI 인사이트 리포트
- PDF 다운로드

### 리뷰 관리
- 리뷰 목록 조회 (필터링, 페이지네이션)
- 리뷰 삭제 (단일/일괄)
- 리뷰 데이터 내보내기 (CSV/Excel)

## 🛠 기술 스택

### Backend
- **Runtime**: Node.js 18.x 이상
- **Framework**: Express 5.1.0
- **Database**: MySQL 8.0 이상
- **Authentication**: JWT (jsonwebtoken)
- **File Processing**: Multer, XLSX, csv-parser
- **Email**: Nodemailer

### Frontend
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.1.12
- **Routing**: React Router DOM 7.9.5
- **Charts**: Chart.js 4.5.1
- **HTTP Client**: Axios 1.13.1
- **PDF**: html2pdf.js 0.12.1

### AI Analysis
- **Language**: Python 3.8+
- **Framework**: FastAPI 0.104.1
- **Deep Learning**: PyTorch 2.1.2, Transformers 4.55.2
- **LLM**: LangChain, OpenAI API
- **NLP**: KoNLPy, Jieba
- **Visualization**: WordCloud 1.9.2

## 🚀 시작하기

### 필수 요구사항

- **Node.js**: 18.x 이상
- **Python**: 3.8 이상
- **MySQL**: 8.0 이상
- **Java**: KoNLPy 사용 시 필요 (선택사항)
- **OpenAI API Key**: 인사이트 생성 시 필요 (선택사항)

### 1. 저장소 클론

```bash
git clone <repository-url>
cd Final
```

### 2. 데이터베이스 설정

MySQL 데이터베이스를 생성하고 스키마를 적용합니다:

```bash
cd database
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql  # 선택사항
```

### 3. 환경 변수 설정

각 서비스의 `.env` 파일을 생성하고 필요한 환경 변수를 설정합니다.

**Backend** (`.env`):
```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
JWT_SECRET=your_jwt_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CORS_ORIGIN=http://localhost:5173
AI_SERVER_URL=http://localhost:8000
```

**Model Server** (`.env`):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
OPENAI_API_KEY=sk-...  # 인사이트 생성 시 필요
```

### 4. 의존성 설치

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# AI Service
cd ../model_server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 5. 서비스 실행

세 개의 터미널에서 각각 실행합니다:

**터미널 1 - Backend**:
```bash
cd backend
npm run dev
```

**터미널 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**터미널 3 - AI Analysis**:
```bash
cd model_server
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py
```

### 6. 접속

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **AI API 문서**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 📋 API 엔드포인트

### 인증 API (`/auth`)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/auth/join` | 회원가입 |
| POST | `/auth/login` | 로그인 |
| POST | `/auth/check-duplicate` | 아이디 중복 검사 |
| POST | `/auth/send-verification` | 이메일 인증번호 발송 |
| POST | `/auth/verify-code` | 이메일 인증번호 확인 |
| POST | `/auth/find-id` | 아이디 찾기 |
| POST | `/auth/find-password` | 비밀번호 찾기 |
| POST | `/auth/update-profile` | 회원정보 수정 |
| GET | `/auth/verify` | JWT 토큰 검증 |
| POST | `/auth/refresh` | 토큰 갱신 (세션 연장) |
| DELETE | `/auth/withdraw` | 회원 탈퇴 |

### 제품 API (`/products`)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/products` | 제품 목록 조회 |
| POST | `/products` | 제품 생성 |
| PUT | `/products/:id` | 제품 정보 수정 |
| DELETE | `/products/:id` | 제품 삭제 |
| GET | `/products/:id/dashboard` | 제품 대시보드 데이터 |
| POST | `/products/:id/reviews/upload` | 리뷰 파일 업로드 |

### 리뷰 API (`/reviews`)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/reviews` | 리뷰 목록 조회 (필터링, 페이지네이션) |
| DELETE | `/reviews/:id` | 단일 리뷰 삭제 |
| DELETE | `/reviews/batch` | 여러 리뷰 일괄 삭제 |

### AI 분석 API (`/v1`)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/v1/analyze-batch` | 배치 리뷰 분석 |
| POST | `/v1/products/{product_id}/reviews/analysis` | 제품 리뷰 전체 분석 파이프라인 (SSE) |
| POST | `/v1/products/{product_id}/wordcloud` | 워드클라우드 생성 |

**자세한 API 문서**:
- Backend: [Backend README - API 엔드포인트](./backend/README.md#api-엔드포인트)
- AI Analysis: [Model Server README - API 엔드포인트](./model_server/README.md#api-엔드포인트)

## 🔧 개발 환경

### 필수 도구
- **Node.js**: 18.x 이상
- **Python**: 3.8 이상
- **MySQL**: 8.0 이상
- **Git**: 버전 관리

### 개발 도구
- **nodemon**: Backend 자동 재시작
- **Vite**: Frontend 핫 리로드
- **Uvicorn**: AI 서버 핫 리로드

## 📁 프로젝트 구조

```
Final/
├── backend/              # Node.js Express API 서버
│   ├── src/
│   │   ├── controllers/  # 비즈니스 로직
│   │   ├── routes/      # API 라우트
│   │   ├── middlewares/  # 인증 미들웨어
│   │   ├── models/      # 데이터베이스 모델
│   │   ├── services/    # 외부 서비스 연동
│   │   └── utils/       # 유틸리티
│   └── README.md
├── frontend/             # React 웹 애플리케이션
│   ├── src/
│   │   ├── components/  # 재사용 가능한 컴포넌트
│   │   ├── pages/       # 페이지 컴포넌트
│   │   ├── hooks/       # 커스텀 훅
│   │   ├── services/    # API 서비스
│   │   └── utils/       # 유틸리티 함수
│   └── README.md
├── model_server/         # Python FastAPI AI 분석 서버
│   ├── app/
│   │   ├── api/         # API 라우터
│   │   ├── domains/     # 도메인별 파이프라인
│   │   └── models/      # 모델 레지스트리
│   ├── utils/           # 유틸리티 함수
│   └── README.md
├── database/            # 데이터베이스 스키마 및 스크립트
│   ├── schema.sql       # 데이터베이스 스키마
│   ├── seed.sql         # 시드 데이터
│   └── views.sql        # 뷰 정의
├── docs/                # 프로젝트 문서
│   ├── REQUIREMENTS.md           # 요구사항 명세서
│   └── USECASE_SPECIFICATION.md  # 유스케이스 명세서
└── README.md
```

## 📚 문서

### 프로젝트 문서
- [요구사항 명세서](./REQUIREMENTS.md) - 기능 및 비기능 요구사항
- [유스케이스 명세서](./USECASE_SPECIFICATION.md) - 사용자 시나리오 및 이벤트 흐름

### 서비스별 문서
- [Backend Service README](./backend/README.md) - 백엔드 API 서버 상세 문서
- [Frontend Service README](./frontend/README.md) - 프론트엔드 웹 애플리케이션 상세 문서
- [AI Analysis Service README](./model_server/README.md) - AI 분석 서버 상세 문서

각 서비스의 자세한 기능, API 엔드포인트, 설정 방법 등은 해당 서비스의 README를 참고하세요.

## 🔐 보안

- JWT 토큰 기반 인증
- 비밀번호 bcrypt 해싱
- 사용자별 데이터 분리 (user_id 기반 필터링)
- 파일 업로드 보안 (크기 제한, 확장자 검증, MIME 타입 검증)
- CORS 설정
- SQL Injection 방지 (Prepared Statements)

## 📊 데이터베이스

### 주요 테이블
- `tb_user`: 사용자 정보
- `tb_product`: 제품 정보
- `tb_review`: 리뷰 데이터
- `tb_reviewAnalysis`: 분석 결과
- `tb_keyword`: 키워드 정보
- `tb_productInsight`: 인사이트 데이터
- `tb_productDashboard`: 대시보드 집계 데이터

자세한 스키마는 `database/schema.sql`을 참고하세요.

## 🎯 주요 워크플로우

1. **회원가입 및 로그인**
   - 사용자 회원가입 → 이메일 인증 → 로그인 → JWT 토큰 발급

2. **제품 등록**
   - 제품 정보 입력 → 제품 생성 → 워크플레이스에 표시

3. **리뷰 업로드 및 분석**
   - 리뷰 파일 업로드 → 파일 파싱 및 검증 → 중복 체크 → DB 저장
   - 자동 분석 요청 → AI 서버에서 ABSA 분석 → 인사이트 생성 → 워드클라우드 생성 → 대시보드 업데이트

4. **대시보드 조회**
   - 제품 선택 → 대시보드 데이터 조회 → KPI, 차트, 워드클라우드, 인사이트 표시

## 🐛 문제 해결

### 일반적인 문제

1. **포트 충돌**: 다른 서비스가 이미 포트를 사용 중인 경우 포트 번호를 변경하세요.
2. **데이터베이스 연결 실패**: `.env` 파일의 데이터베이스 설정을 확인하세요.
3. **의존성 설치 실패**: Node.js와 Python 버전을 확인하세요.
4. **AI 분석 실패**: OpenAI API Key가 올바르게 설정되었는지 확인하세요.

자세한 문제 해결 방법은 각 서비스의 README를 참고하세요.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 🤝 기여

프로젝트에 기여하고 싶으시다면 이슈를 생성하거나 Pull Request를 보내주세요.
