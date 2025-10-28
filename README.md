# 리뷰 분석 서비스

Node.js Express + Python FastAPI 기반의 AI 리뷰 분석 서비스입니다. GPT 스타일의 인터페이스로 리뷰 데이터를 분석하고 인사이트를 제공합니다.

## 아키텍처

- **Frontend Service**: Node.js Express (포트 3000)
- **AI Analysis Service**: Python FastAPI (포트 8000)
- **Database**: MySQL (리모트 서버)

## 주요 기능

- **로그인 페이지**: MySQL 기반 사용자 인증
- **대시보드**: 분석 현황, 통계, 워드클라우드 미리보기
- **리포트 페이지**: GPT 스타일 인터페이스로 리뷰 분석
- **AI 분석**: 워드클라우드 생성, 감정 분석, 인사이트 제공

## 설치 및 실행

### 방법 1: 자동 실행 (Windows)
```bash
# 모든 서비스를 한 번에 시작
start-services.bat
```

### 방법 2: 수동 실행

1. **Node.js 서비스 설치 및 실행**
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

3. **브라우저에서 접속**
- 웹 서비스: http://localhost:3000
- AI API 문서: http://localhost:8000/docs

### 데이터베이스 설정
- MySQL 서버: project-db-campus.smhrd.com:3312
- 데이터베이스: Insa6_aiNLP_p3_1
- 사용자 테이블이 자동으로 생성됩니다.

## 테스트 계정

- 이메일: admin@example.com
- 비밀번호: password

## 프로젝트 구조

```
├── server.js              # 메인 서버 파일
├── package.json           # 프로젝트 설정
├── config/
│   └── database.js        # MySQL 데이터베이스 설정
├── models/
│   └── User.js           # 사용자 모델
├── app/
│   └── routes/            # 라우터 파일들
│       ├── authRouter.js  # 인증 관련 라우터
│       ├── dashboardRouter.js # 대시보드 라우터
│       └── reportRouter.js    # 리포트 라우터
└── views/                 # EJS 템플릿 파일들
    ├── login.ejs         # 로그인 페이지
    ├── register.ejs      # 회원가입 페이지
    ├── dashboard.ejs     # 대시보드 페이지
    └── report.ejs        # 리포트 페이지
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

- **Backend**: Node.js, Express.js
- **Database**: MySQL (리모트 서버)
- **Template Engine**: EJS
- **Session**: express-session
- **Authentication**: bcrypt (비밀번호 해싱)
- **Frontend**: Bootstrap 5, Font Awesome
- **Styling**: Custom CSS (GPT 스타일)

## 향후 개발 예정

- AI 분석 API 연동
- 데이터베이스 연동 (MongoDB/PostgreSQL)
- 파일 업로드 기능
- 실시간 분석 결과 업데이트
- 사용자 관리 시스템
- 분석 결과 내보내기 기능