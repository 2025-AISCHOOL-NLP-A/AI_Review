# 리뷰 분석 서비스

Node.js Express + Python FastAPI 기반의 AI 리뷰 분석 서비스입니다.

## 아키텍처

- **Backend API Service**: Node.js Express (포트 3000) - REST API 서버
- **Frontend Service**: React (별도 프로젝트) - 웹 클라이언트
- **AI Analysis Service**: Python FastAPI (포트 8000) - AI 분석 엔진
- **Database**: MySQL (리모트 서버)

## API 엔드포인트

### 인증 API (/auth)
- `POST /auth/login` - 사용자 로그인
- `POST /auth/register` - 회원가입
- `POST /auth/find-id` - 아이디 찾기
- `POST /auth/find-password` - 비밀번호 재설정
- `POST /auth/logout` - 로그아웃
- `PUT /auth/update` - 사용자 정보 수정
- `DELETE /auth/delete` - 계정 삭제

### 제품 API (/products)
- `GET /products` - 제품 목록 조회
- `GET /products/{id}/reviews` - 제품 리뷰 데이터 조회
- `GET /products/{id}/insights` - 제품 인사이트 목록 조회
- `DELETE /products/{id}` - 제품 삭제

### 인사이트 API (/insights)
- `GET /insights` - 모든 인사이트 조회
- `GET /insights/{id}` - 인사이트 상세 조회
- `POST /insights/request` - 새로운 인사이트 분석 요청

## 설치 및 실행

### 방법 1: 자동 실행 (Windows)
```bash
# 모든 서비스를 한 번에 시작
start-services.bat
```

### 방법 2: 수동 실행

1. **Backend API 서비스 설치 및 실행**
```bash
npm install
npm start
```

2. **Python AI 서비스 설치 및 실행**
```bash
cd ai-analysis-service
pip install -r requirements.txt
python main.py
```

3. **API 접속**
- Backend API: http://localhost:3000
- AI API 문서: http://localhost:8000/docs
- Health Check: http://localhost:3000/health

### 데이터베이스 설정
- MySQL 서버: project-db-campus.smhrd.com:3312
- 데이터베이스: Insa6_aiNLP_p3_1
- 사용자 테이블이 자동으로 생성됩니다.

## 테스트 계정

- 이메일: admin@example.com
- 비밀번호: password

## 프로젝트 구조

```
├── server.js              # 메인 API 서버 파일
├── package.json           # 프로젝트 설정
├── config/
│   └── database.js        # MySQL 데이터베이스 설정
├── models/
│   └── User.js           # 사용자 모델
└── app/
    └── routes/            # API 라우터 파일들
        ├── authRouter.js     # 인증 API
        ├── productsRouter.js # 제품 API
        └── insightsRouter.js # 인사이트 API
```

## 페이지 설명

### 1. 로그인 페이지 (`/auth/login`)
- 사용자 인증을 위한 로그인 폼
- 세션 기반 인증 구현

### 2. 대시보드 (`/dashboard`)
- 분석 통계 및 현황 표시
- 최근 분석 내역 확인
- 새로운 분석 시작 버튼

### 3. 리포트 페이지 (`/report`)
- GPT 스타일의 채팅 인터페이스
- 사이드바에 이전 분석 기록
- 실시간 리뷰 분석 기능
- 감정 분석, 키워드 추출, 인사이트 제공

## 기술 스택

- **Backend API**: Node.js, Express.js
- **Database**: MySQL (리모트 서버)
- **Session**: express-session (JWT 전환 예정)
- **Authentication**: bcrypt (비밀번호 해싱)
- **CORS**: cors (React 앱과 통신)
- **AI Service**: Python FastAPI

## 향후 개발 예정

- AI 분석 API 연동
- 데이터베이스 연동 (MongoDB/PostgreSQL)
- 파일 업로드 기능
- 실시간 분석 결과 업데이트
- 사용자 관리 시스템
- 분석 결과 내보내기 기능