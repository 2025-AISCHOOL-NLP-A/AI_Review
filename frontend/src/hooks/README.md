# Hooks 폴더 구조

이 폴더는 React 커스텀 훅들을 기능별로 분류하여 관리합니다.

## 폴더 구조

```
hooks/
├── auth/          # 인증 및 세션 관련 훅
├── dashboard/     # 대시보드 관련 훅
├── product/       # 제품 관련 훅
└── ui/            # UI 관련 훅
```

## 각 폴더 설명

### 📁 auth/ - 인증 및 세션 관리
- `useEmailTimer.js` - 이메일 인증 타이머 (회원가입)
- `useEmailTimerUpdate.js` - 이메일 인증 타이머 (회원정보 수정)
- `useExtendSession.js` - 세션 연장
- `useLogoutTimer.js` - 로그아웃 타이머 (세션 만료 추적)

### 📁 dashboard/ - 대시보드 기능
- `useDashboardData.js` - 대시보드 데이터 페칭 및 관리
- `usePDFDownload.js` - 대시보드 PDF 다운로드

### 📁 product/ - 제품 관리
- `useProductData.js` - 제품 데이터 페칭
- `useProductFilter.js` - 제품 필터링 및 페이지네이션
- `useProductSort.js` - 제품 정렬
- `useProductModal.js` - 제품 모달 상태 관리
- `useProductActions.js` - 제품 액션 핸들러 (추가, 수정, 삭제, 다운로드)
- `useDateFilter.js` - 날짜 필터링
- `useDropdownMenu.js` - 드롭다운 메뉴 위치 관리

### 📁 ui/ - UI 상태 관리
- `useSidebar.js` - 사이드바 상태 관리
- `useViewport.js` - 뷰포트 크기 및 스크롤 추적

## 사용 예시

### 개별 import
```javascript
import { useProductFilter } from "../../hooks/product/useProductFilter";
import { useSidebar } from "../../hooks/ui/useSidebar";
```

### index.js를 통한 import (권장)
```javascript
import { useProductFilter, useProductSort } from "../../hooks/product";
import { useSidebar } from "../../hooks/ui";
```

## 참고사항

- 각 폴더에는 `index.js` 파일이 있어서 편리하게 import할 수 있습니다.
- 훅들은 기능별로 분리되어 있어 유지보수가 용이합니다.
- 새로운 훅을 추가할 때는 적절한 폴더에 추가하고 `index.js`에 export를 추가하세요.

