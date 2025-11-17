# 프런트엔드 프로젝트

React와 Vite를 기반으로 구축된 대시보드 및 제품 관리 웹 애플리케이션입니다.

## 기술 스택

- **React** 19.2.0
- **Vite** 7.1.12
- **React Router DOM** 7.9.5
- **Chart.js** 4.5.1 - 데이터 시각화
- **Axios** 1.13.1 - HTTP 클라이언트
- **PapaParse** 5.5.3 - CSV 파싱
- **XLSX** 0.18.5 - Excel 파일 처리
- **html2pdf.js** 0.12.1 - PDF 생성

## 주요 기능

### 인증 시스템
- 사용자 로그인/회원가입
- 이메일 인증
- 비밀번호 찾기
- 보호된 라우트 (ProtectedRoute)

### 대시보드
- KPI 카드 (주요 지표 표시)
- 다양한 차트 시각화
  - 일일 트렌드 차트
  - 히트맵
  - 레이더 차트
  - 분할 바 차트
- 워드 클라우드
- 리뷰 테이블
- AI 인사이트 리포트
- PDF 다운로드 기능

### 제품 관리 (Workplace)
- 제품 목록 조회 및 필터링
- 제품 등록 및 수정
- 리뷰 추가
- 파일 업로드 (CSV, Excel)
- 제품 정보 미리보기

### 사용자 관리
- 프로필 수정
- 이메일 인증 업데이트
- 회원 탈퇴

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── auth/           # 인증 관련 컴포넌트
│   ├── charts/         # 차트 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   ├── dashboard/      # 대시보드 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트
│   ├── product/        # 제품 관련 컴포넌트
│   └── user/           # 사용자 관련 컴포넌트
├── contexts/           # React Context
├── hooks/              # 커스텀 훅
├── pages/              # 페이지 컴포넌트
│   ├── auth/           # 인증 페이지
│   ├── dashboard/      # 대시보드 페이지
│   ├── main/           # 메인 페이지
│   └── user/           # 사용자 페이지
├── services/           # API 서비스
├── styles/             # 전역 스타일
└── utils/              # 유틸리티 함수
```

## 시작하기

### 필수 요구사항
- Node.js 16.x 이상
- npm 또는 yarn

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버는 [http://localhost:5173](http://localhost:5173)에서 실행됩니다.

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `build` 폴더에 생성됩니다.

### 빌드 미리보기

```bash
npm run preview
```

## 환경 설정

개발 서버는 기본적으로 `http://localhost:5173` 포트에서 실행되며, 백엔드 API는 `http://localhost:3001` 또는 `http://localhost:8000`을 사용합니다.

## 주요 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드 생성
- `npm run preview` - 빌드 결과 미리보기

## 라우팅

- `/` - 메인 페이지
- `/login` - 로그인
- `/login/join` - 회원가입
- `/login/find` - 비밀번호 찾기
- `/dashboard` - 대시보드 (인증 필요)
- `/wp` - 제품 관리 (인증 필요)
- `/pricingsystem` - 가격 시스템 (인증 필요)
- `/memberupdate` - 회원 정보 수정 (인증 필요)
- `/memberdrop` - 회원 탈퇴 (인증 필요)

## 주요 컴포넌트

### 대시보드 컴포넌트
- `DashboardHeader` - 대시보드 헤더 및 날짜 필터
- `KPICards` - 주요 지표 카드
- `DashboardCharts` - 차트 컨테이너
- `WordCloudSection` - 워드 클라우드
- `ReviewTable` - 리뷰 테이블
- `AIInsightReport` - AI 인사이트 리포트

### 차트 컴포넌트
- `DailyTrendChart` - 일일 트렌드 차트
- `Heatmap` - 히트맵
- `RadarChart` - 레이더 차트
- `SplitBarChart` - 분할 바 차트

## 커스텀 훅

- `useDashboardData` - 대시보드 데이터 관리
- `usePDFDownload` - PDF 다운로드 기능
- `useSidebar` - 사이드바 상태 관리
- `useProductFilter` - 제품 필터링
- `useProductSort` - 제품 정렬
- `useEmailTimer` - 이메일 인증 타이머

## 참고사항

- 이 프로젝트는 Vite를 빌드 도구로 사용합니다.
- CSP(Content Security Policy) 헤더가 개발 환경에서 설정되어 있습니다.
- 프로덕션 빌드에서는 소스맵이 비활성화되어 있습니다.
