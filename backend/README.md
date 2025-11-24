# 백엔드 프로젝트

Node.js와 Express를 기반으로 구축된 RESTful API 서버입니다. 사용자 인증, 제품 관리, 리뷰 데이터 처리, AI 분석 연동 등의 기능을 제공합니다.

## 기술 스택

- **Node.js** (ES Modules)
- **Express** 5.1.0 - 웹 프레임워크
- **MySQL2** 3.15.3 - 데이터베이스 연결
- **JWT** (jsonwebtoken 9.0.2) - 인증 토큰
- **bcrypt** 6.0.0 - 비밀번호 암호화
- **Multer** 2.0.2 - 파일 업로드 처리
- **XLSX** 0.18.5 - Excel 파일 파싱
- **csv-parser** 3.2.0 - CSV 파일 파싱
- **Nodemailer** 7.0.10 - 이메일 발송
- **Axios** 1.13.2 - HTTP 클라이언트 (AI 서버 연동)
- **dotenv** 17.2.3 - 환경 변수 관리

## 주요 기능

### 인증 시스템
- 회원가입 (아이디 중복 검사, 이메일 인증)
- 로그인 (JWT 토큰 발급)
- 아이디/비밀번호 찾기
- 회원정보 수정
- 회원탈퇴
- JWT 토큰 검증 및 갱신
- 세션 시간 연장 (토큰 갱신)

### 제품 관리
- 제품 생성 (제품명, 브랜드, 카테고리)
- 제품 목록 조회 (사용자별 필터링)
- 제품 정보 수정
- 제품 삭제 (CASCADE)
- 제품 소유권 확인

### 리뷰 관리
- 리뷰 파일 업로드 (CSV, Excel)
- 파일 파싱 및 검증 (매직 넘버 검증)
- 컬럼 매핑 (리뷰, 날짜, 평점)
- 중복 리뷰 체크
- 리뷰 목록 조회 (필터링, 페이지네이션)
- 리뷰 삭제 (단일/일괄)
- 리뷰 데이터 내보내기 (CSV/Excel)
- 스팀 리뷰 형식 지원 (voted_up, weighted_vote_score)

### AI 분석 연동
- 리뷰 분석 요청 (Python AI 서버 연동)
- 비동기 분석 처리
- 분석 진행 상황 추적 (SSE)
- 대시보드 데이터 조회

### 보안
- JWT 토큰 기반 인증 미들웨어
- 비밀번호 bcrypt 해싱
- 사용자별 데이터 분리 (user_id 기반 필터링)
- 파일 업로드 보안 (크기 제한, 확장자 검증, MIME 타입 검증)
- CORS 설정
- 보안 헤더 설정 (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)

## 프로젝트 구조

```
src/
├── app.js                    # Express 앱 설정 및 서버 시작
├── controllers/              # 컨트롤러 (비즈니스 로직)
│   ├── authController.js     # 인증 관련 컨트롤러
│   ├── productController.js  # 제품 관련 컨트롤러
│   ├── reviewController.js   # 리뷰 관련 컨트롤러
│   ├── dashboardController.js # 대시보드 컨트롤러
│   ├── insightController.js  # 인사이트 컨트롤러
│   └── sseController.js      # SSE (Server-Sent Events) 컨트롤러
├── middlewares/              # 미들웨어
│   └── authMiddleware.js     # JWT 인증 미들웨어
├── models/                   # 데이터 모델
│   └── db.js                 # MySQL 연결 풀 설정
├── routes/                    # 라우트 정의
│   ├── authRoutes.js         # 인증 라우트
│   ├── productRoutes.js      # 제품 라우트
│   ├── reviewRoutes.js       # 리뷰 라우트
│   └── insightRoutes.js      # 인사이트 라우트
├── services/                 # 외부 서비스 연동
│   └── absaService.js        # AI 분석 서버 연동 서비스
└── utils/                    # 유틸리티 함수
    ├── backgroundProcessor.js # 백그라운드 작업 처리
    └── taskManager.js        # 작업 관리자
```

## 시작하기

### 필수 요구사항
- Node.js 18.x 이상
- MySQL 8.0 이상
- npm 또는 yarn

### 환경 변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# 서버 설정
PORT=3001

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# JWT 설정
JWT_SECRET=your_jwt_secret_key

# 이메일 설정 (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# CORS 설정
CORS_ORIGIN=http://localhost:5173

# AI 서버 설정
AI_SERVER_URL=http://localhost:8000
```

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버는 `nodemon`을 사용하여 파일 변경 시 자동으로 재시작됩니다.

서버는 기본적으로 [http://localhost:3001](http://localhost:3001)에서 실행됩니다.

## API 엔드포인트

### 인증 API (`/auth`)

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|-----------|------|----------|
| POST | `/auth/join` | 회원가입 | ❌ |
| POST | `/auth/login` | 로그인 | ❌ |
| POST | `/auth/check-duplicate` | 아이디 중복 검사 | ❌ |
| POST | `/auth/send-verification` | 이메일 인증번호 발송 | ❌ |
| POST | `/auth/verify-code` | 이메일 인증번호 확인 | ❌ |
| POST | `/auth/find-id` | 아이디 찾기 | ❌ |
| POST | `/auth/find-password` | 비밀번호 찾기 | ❌ |
| POST | `/auth/update-profile` | 회원정보 수정 | ✅ |
| GET | `/auth/verify` | JWT 토큰 검증 | ✅ |
| POST | `/auth/refresh` | 토큰 갱신 (세션 연장) | ✅ |
| DELETE | `/auth/withdraw` | 회원탈퇴 | ✅ |

### 제품 API (`/products`)

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|-----------|------|----------|
| GET | `/products` | 제품 목록 조회 | ✅ |
| POST | `/products` | 제품 생성 | ✅ |
| PUT | `/products/:id` | 제품 정보 수정 | ✅ |
| DELETE | `/products/:id` | 제품 삭제 | ✅ |
| GET | `/products/:id/dashboard` | 대시보드 데이터 조회 | ✅ |
| GET | `/products/:id/reviews` | 제품별 리뷰 조회 | ✅ |
| POST | `/products/:id/reviews/upload` | 리뷰 파일 업로드 | ✅ |
| POST | `/products/:id/reviews/analysis` | 리뷰 분석 요청 | ✅ |
| GET | `/products/:id/reviews/upload/progress/:taskId` | 업로드 진행 상황 (SSE) | ❌ |

### 리뷰 API (`/reviews`)

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|-----------|------|----------|
| GET | `/reviews` | 리뷰 목록 조회 (필터링, 페이지네이션) | ✅ |
| DELETE | `/reviews/:id` | 단일 리뷰 삭제 | ✅ |
| DELETE | `/reviews/batch` | 여러 리뷰 일괄 삭제 | ✅ |

### 인사이트 API (`/insights`)

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|-----------|------|----------|
| GET | `/insights/:productId` | 제품 인사이트 조회 | ✅ |

## 주요 기능 상세

### 인증 플로우

1. **회원가입**
   - 아이디 중복 검사
   - 이메일 인증번호 발송 및 검증
   - 비밀번호 bcrypt 해싱 후 저장

2. **로그인**
   - 아이디/비밀번호 검증
   - JWT 토큰 발급 (2시간 유효)
   - 토큰은 `Authorization: Bearer <token>` 형식으로 전송

3. **토큰 검증**
   - 모든 보호된 라우트는 `verifyAuth` 미들웨어를 통해 토큰 검증
   - 검증된 사용자 정보는 `req.user`에 저장

4. **세션 연장**
   - `/auth/refresh` 엔드포인트를 통해 토큰 갱신
   - 새로운 토큰 발급 (2시간 추가)

### 파일 업로드 처리

1. **파일 검증**
   - 파일 크기 제한 (10MB)
   - 확장자 검증 (.csv, .xlsx, .xls)
   - MIME 타입 검증
   - 매직 넘버 검증

2. **파일 파싱**
   - CSV: `csv-parser` 라이브러리 사용
   - Excel: `XLSX` 라이브러리 사용
   - 다양한 날짜 형식 지원

3. **데이터 검증**
   - 리뷰 텍스트 길이 제한 (10,000자)
   - 필수 필드 검증
   - 중복 리뷰 체크 (product_id, review_text, review_date)

4. **비동기 처리**
   - 대용량 파일은 백그라운드에서 처리
   - SSE를 통한 진행 상황 실시간 전송

### AI 분석 연동

1. **분석 요청**
   - Python AI 서버에 HTTP 요청
   - 제품 ID와 리뷰 데이터 전송

2. **비동기 처리**
   - 분석 작업을 백그라운드에서 실행
   - 사용자 대기 시간 최소화

3. **결과 저장**
   - 분석 결과를 데이터베이스에 저장
   - 대시보드 데이터 자동 업데이트

### 데이터베이스

- **연결 풀**: MySQL2의 connection pool 사용
- **자동 재연결**: 연결 끊김 시 자동 재연결
- **트랜잭션**: 데이터 일관성을 위한 트랜잭션 처리

## 보안 고려사항

1. **인증**
   - 모든 보호된 API는 JWT 토큰 검증 필수
   - 토큰 만료 시 401 에러 반환

2. **데이터 분리**
   - 모든 데이터 조회 시 `user_id` 기반 필터링
   - 타 사용자 데이터 접근 차단

3. **소유권 확인**
   - 제품 수정/삭제 시 소유권 확인
   - 소유자가 아닌 경우 403 에러 반환

4. **파일 업로드 보안**
   - 파일 크기 제한
   - 확장자 및 MIME 타입 검증
   - 매직 넘버 검증으로 파일 변조 방지
   - 파일명 sanitization (경로 탐색 공격 방지)

5. **입력 검증**
   - SQL Injection 방지 (Prepared Statements)
   - XSS 방지 (입력 데이터 sanitization)
   - 리뷰 텍스트 길이 제한 (DoS 공격 방지)

## 에러 처리

- 일관된 에러 응답 형식
- 적절한 HTTP 상태 코드 사용
- 사용자 친화적인 에러 메시지
- 로깅을 통한 에러 추적

## 로깅

- 요청 로깅 (메서드, URL, 타임스탬프)
- 에러 로깅
- 데이터베이스 연결 상태 로깅

## 개발 팁

1. **환경 변수**: `.env` 파일을 사용하여 민감한 정보 관리
2. **nodemon**: 개발 중 파일 변경 시 자동 재시작
3. **에러 디버깅**: 콘솔 로그를 통해 요청/응답 추적
4. **데이터베이스**: MySQL Workbench 또는 다른 도구로 데이터 확인

## 참고사항

- 이 프로젝트는 ES Modules를 사용합니다.
- 모든 API 요청은 JSON 형식으로 주고받습니다.
- 파일 업로드는 `multipart/form-data` 형식을 사용합니다.
- CORS는 환경 변수로 설정된 origin만 허용합니다.
- JWT 토큰은 2시간 유효하며, 갱신 가능합니다.

