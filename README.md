# 리뷰 분석 서비스

Node.js Express 기반의 리뷰 분석 서비스입니다. GPT 스타일의 인터페이스로 리뷰 데이터를 분석하고 인사이트를 제공합니다.

## 주요 기능

- **로그인 페이지**: 사용자 인증
- **대시보드**: 분석 현황 및 통계 확인
- **리포트 페이지**: GPT 스타일 인터페이스로 리뷰 분석

## 설치 및 실행

1. 의존성 설치
```bash
npm install
```

2. 데이터베이스 설정
- MySQL 서버: project-db-campus.smhrd.com:3312
- 데이터베이스: Insa6_aiNLP_p3_1
- 사용자 테이블이 자동으로 생성됩니다.

3. 서버 실행
```bash
npm start
```

또는 개발 모드로 실행 (nodemon 사용)
```bash
npm run dev
```

4. 브라우저에서 접속
```
http://localhost:3000
```

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