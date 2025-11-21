# Product Hooks

제품 관리와 관련된 커스텀 훅들을 모아놓은 폴더입니다.

## 파일 구조

### 데이터 관리
- **useProductData.js** - 제품 데이터 페칭 및 관리
  - `allProducts`: 전체 제품 목록
  - `loading`: 로딩 상태

### 필터링 및 정렬
- **useProductFilter.js** - 제품 필터링 및 페이지네이션
  - 검색어, 카테고리, 날짜 필터 적용
  - 페이지네이션 처리
  - 카테고리 목록 추출

- **useProductSort.js** - 제품 정렬 관리
  - 정렬 필드 및 방향 관리
  - 정렬 핸들러 제공

- **useDateFilter.js** - 날짜 필터링 관리
  - 등록일 최소/최대값 계산
  - 날짜 범위 설정 및 검증

### UI 상태 관리
- **useProductModal.js** - 제품 모달 상태 관리
  - 모달 단계 관리 (info, upload, edit, addReview)
  - 제품 폼 데이터 관리
  - 업로드 상태 관리

- **useDropdownMenu.js** - 드롭다운 메뉴 위치 관리
  - 메뉴 열림/닫힘 상태
  - 드롭다운 위치 자동 계산
  - 외부 클릭 감지

### 액션 핸들러
- **useProductActions.js** - 제품 액션 핸들러들
  - PDF 다운로드
  - 제품 삭제 (단일/다중)
  - 제품 수정
  - 제품 추가 콜백
  - 리뷰 추가 콜백

## 사용 예시

```javascript
import {
  useProductData,
  useProductFilter,
  useProductSort,
  useDateFilter,
  useProductModal,
  useDropdownMenu,
  useProductActions,
} from '../../hooks/product';
```

## 의존성

- `react` - React 훅
- `react-router-dom` - 네비게이션
- `../../services/dashboardService` - API 서비스
- `../../utils/data/productFilters` - 필터링 유틸리티
- `../../utils/format/dateUtils` - 날짜 유틸리티

