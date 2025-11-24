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
- **세션 관리**
  - 실시간 세션 만료 시간 표시 (HH:MM:SS 형식)
  - 세션 만료 시 자동 로그아웃 및 로그인 페이지 리다이렉트
  - 세션 시간 연장 기능 (2시간 추가)
  - JWT 토큰 기반 인증 (2시간 유효)

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

### 리뷰 관리
- 리뷰 목록 조회 및 필터링
- 리뷰 상세 정보 확인
- 리뷰 데이터 분석
- 리뷰 일괄 삭제
- 리뷰 데이터 내보내기 (CSV/Excel)

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── auth/           # 인증 관련 컴포넌트
│   │   ├── AgreementSection.jsx
│   │   ├── EmailVerification.jsx
│   │   ├── PasswordInput.jsx
│   │   └── UserIdInput.jsx
│   ├── charts/         # 차트 컴포넌트
│   │   ├── DailyTrendChart.jsx
│   │   ├── Heatmap.jsx
│   │   ├── RadarChart.jsx
│   │   └── SplitBarChart.jsx
│   ├── common/         # 공통 컴포넌트
│   │   ├── FileList.jsx
│   │   ├── FileUploadForm.jsx
│   │   ├── PreviewModal.jsx
│   │   └── ProtectedRoute.jsx
│   ├── dashboard/      # 대시보드 컴포넌트
│   │   ├── AIInsightReport.jsx
│   │   ├── DashboardCharts.jsx
│   │   ├── DashboardHeader.jsx
│   │   ├── InsightsSection.jsx
│   │   ├── KPICards.jsx
│   │   ├── ReviewTable.jsx
│   │   └── WordCloudSection.jsx
│   ├── layout/         # 레이아웃 컴포넌트
│   │   ├── Footer/     # 푸터 컴포넌트
│   │   └── sidebar/    # 사이드바 컴포넌트
│   ├── product/        # 제품 관련 컴포넌트
│   │   ├── AddReviewForm.jsx
│   │   ├── ProductInfoForm.jsx
│   │   ├── ProductModal.jsx
│   │   └── ProductUploadForm.jsx
│   ├── review/         # 리뷰 관련 컴포넌트
│   │   ├── ReviewFilterBar.jsx
│   │   └── ReviewListTable.jsx
│   ├── user/           # 사용자 관련 컴포넌트
│   │   ├── EmailVerificationUpdate.jsx
│   │   └── ProfileUpdateForm.jsx
│   └── workplace/      # 워크플레이스 컴포넌트
│       ├── ProductActionMenu.jsx
│       ├── ProductFilterBar.jsx
│       ├── ProductListTable.jsx
│       └── ProductPagination.jsx
├── constants/          # 상수 정의
│   ├── index.js
│   └── terms.js
├── contexts/           # React Context
│   └── UserContext.jsx
├── hooks/              # 커스텀 훅
│   ├── auth/           # 인증 관련 훅
│   │   ├── useEmailTimer.js
│   │   ├── useEmailTimerUpdate.js
│   │   ├── useExtendSession.js
│   │   └── useLogoutTimer.js
│   ├── dashboard/      # 대시보드 관련 훅
│   │   ├── useDashboardData.js
│   │   └── usePDFDownload.js
│   ├── product/        # 제품 관련 훅
│   │   ├── useDateFilter.js
│   │   ├── useDropdownMenu.js
│   │   ├── useProductActions.js
│   │   ├── useProductData.js
│   │   ├── useProductFilter.js
│   │   ├── useProductModal.js
│   │   └── useProductSort.js
│   └── ui/             # UI 관련 훅
│       ├── useSidebar.js
│       └── useViewport.js
├── pages/              # 페이지 컴포넌트
│   ├── auth/           # 인증 페이지
│   │   ├── Login.jsx
│   │   ├── LoginJoin.jsx
│   │   └── LoginFind.jsx
│   ├── dashboard/      # 대시보드 페이지
│   │   ├── Dashboard.jsx
│   │   ├── PricingSystem.jsx
│   │   └── Workplace.jsx
│   ├── main/           # 메인 페이지
│   │   └── Main.jsx
│   ├── review/         # 리뷰 관리 페이지
│   │   └── ReviewManagement.jsx
│   └── user/           # 사용자 페이지
│       ├── Memberdrop.jsx
│       └── Memberupdate.jsx
├── services/           # API 서비스
│   ├── api.js          # Axios 인스턴스 및 인터셉터
│   ├── authService.js  # 인증 관련 API
│   ├── dashboardDataTransformers.js
│   ├── dashboardResponseProcessor.js
│   ├── dashboardService.js
│   ├── insightService.js
│   └── reviewService.js
├── styles/             # 전역 스타일
│   ├── common.css
│   ├── modal.css
│   └── variables.css
└── utils/              # 유틸리티 함수
    ├── api/            # API 관련
    │   ├── apiHelpers.js   # API 요청 헬퍼
    │   └── errorHandler.js # 에러 처리
    ├── auth/           # 인증 관련
    │   ├── tokenUtils.js   # JWT 토큰 관련 유틸리티
    │   └── storage.js      # 세션 스토리지 관리
    ├── data/           # 데이터 처리
    │   ├── dashboardDateFilter.js # 대시보드 날짜 필터
    │   ├── dataParsing.js   # 데이터 파싱
    │   ├── processDailyTrendData.js
    │   ├── processHeatmapData.js
    │   ├── processRadarData.js
    │   ├── processSplitBarData.js
    │   └── productFilters.js # 제품 필터링
    ├── file/           # 파일 처리
    │   ├── fileParser.js   # 파일 파싱 (CSV, Excel)
    │   └── fileValidation.js # 파일 검증
    ├── format/         # 포맷팅 관련
    │   ├── chartColors.js   # 차트 색상
    │   ├── dateUtils.js     # 날짜 유틸리티
    │   ├── inputSanitizer.js # 입력 정리 (XSS 방지)
    │   └── numberUtils.js   # 숫자 유틸리티
    └── ui/             # UI 관련
        └── viewportUtils.js  # 뷰포트 유틸리티 (PDF 등)
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
- `/reviews` - 리뷰 관리 (인증 필요)
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
- `InsightsSection` - 인사이트 섹션

### 차트 컴포넌트
- `DailyTrendChart` - 일일 트렌드 차트
- `Heatmap` - 히트맵
- `RadarChart` - 레이더 차트
- `SplitBarChart` - 분할 바 차트

### 레이아웃 컴포넌트
- `Sidebar` - 메인 사이드바 (네비게이션, 사용자 프로필, 세션 관리)
- `SidebarHeader` - 사이드바 헤더
- `SidebarNavigation` - 사이드바 네비게이션 메뉴
- `SidebarUserProfile` - 사용자 프로필 섹션
- `SidebarSettings` - 설정 섹션
- `SidebarFooter` - 사이드바 푸터 (세션 타이머)
- `Footer` - 페이지 푸터

### 제품 관리 컴포넌트
- `ProductInfoForm` - 제품 정보 입력 폼
- `ProductUploadForm` - 제품 업로드 폼
- `ProductModal` - 제품 모달
- `AddReviewForm` - 리뷰 추가 폼

### 워크플레이스 컴포넌트
- `ProductListTable` - 제품 목록 테이블
- `ProductFilterBar` - 제품 필터 바
- `ProductActionMenu` - 제품 액션 메뉴
- `ProductPagination` - 제품 페이지네이션

### 리뷰 관리 컴포넌트
- `ReviewListTable` - 리뷰 목록 테이블
- `ReviewFilterBar` - 리뷰 필터 바

### 공통 컴포넌트
- `ProtectedRoute` - 인증이 필요한 라우트 보호
- `FileUploadForm` - 파일 업로드 폼
- `FileList` - 업로드된 파일 목록
- `PreviewModal` - 파일 미리보기 모달

## 커스텀 훅

### 인증 관련 훅
- `useEmailTimer` - 이메일 인증 타이머
- `useEmailTimerUpdate` - 이메일 인증 타이머 업데이트 (회원정보 수정용)
- `useExtendSession` - 세션 시간 연장
- **`useLogoutTimer`** - 세션 만료 시간 실시간 추적 및 자동 로그아웃 처리
  - 1초마다 토큰 만료 여부 확인
  - 만료 시 자동 로그아웃 및 리다이렉트
  - 남은 시간 포맷팅 (HH:MM:SS)

### 대시보드 관련 훅
- `useDashboardData` - 대시보드 데이터 관리
- `usePDFDownload` - PDF 다운로드 기능

### 제품 관련 훅
- `useProductData` - 제품 데이터 관리
- `useProductFilter` - 제품 필터링
- `useProductSort` - 제품 정렬
- `useProductModal` - 제품 모달 상태 관리
- `useProductActions` - 제품 액션 (추가, 수정, 삭제)
- `useDateFilter` - 날짜 필터링
- `useDropdownMenu` - 드롭다운 메뉴 관리

### UI 관련 훅
- `useSidebar` - 사이드바 상태 관리
- `useViewport` - 뷰포트 크기 및 반응형 관리

## 주요 기능 상세

### 세션 관리 시스템

프로젝트는 JWT 토큰 기반 세션 관리를 구현하고 있습니다:

1. **세션 만료 시간 표시**
   - 사이드바 하단에 실시간으로 남은 세션 시간 표시
   - 형식: HH:MM:SS
   - 1초마다 자동 업데이트
   - 만료 임박 시 빨간색으로 표시

2. **자동 로그아웃**
   - 세션 만료 시 자동으로 로그아웃 처리
   - 로그인 페이지로 자동 리다이렉트
   - 만료 안내 메시지 표시

3. **세션 시간 연장**
   - "시간 연장하기" 버튼을 통해 세션을 2시간 연장
   - 토큰 갱신 API를 통한 안전한 연장
   - 연장 성공 시 자동으로 타이머 업데이트

### 인증 플로우

1. 로그인 시 JWT 토큰 발급 (2시간 유효)
2. 모든 API 요청에 토큰 자동 첨부
3. 토큰 만료 시 자동 감지 및 로그아웃
4. 세션 연장을 통해 작업 시간 확보 가능

## 참고사항

- 이 프로젝트는 Vite를 빌드 도구로 사용합니다.
- CSP(Content Security Policy) 헤더가 개발 환경에서 설정되어 있습니다.
- 프로덕션 빌드에서는 소스맵이 비활성화되어 있습니다.
- JWT 토큰은 `sessionStorage`에 저장되어 브라우저 탭을 닫으면 자동으로 삭제됩니다.
- API 요청 시 토큰 만료 체크가 자동으로 수행됩니다.
