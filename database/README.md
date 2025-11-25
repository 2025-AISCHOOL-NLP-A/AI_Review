# AI Review 데이터베이스 스키마

## 개요
AI 기반 리뷰 분석 시스템의 데이터베이스 구조입니다.

## 주요 기능
- 사용자 관리 및 인증
- 상품 및 카테고리 관리
- 리뷰 수집 및 감성 분석
- 키워드 기반 인사이트 생성
- 대시보드 데이터 집계

---

## 테이블 구조

### 1. 사용자 관리

#### `tb_user` - 사용자 정보
| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `user_id` | INT | 사용자 ID | PK, AUTO_INCREMENT |
| `email` | VARCHAR(100) | 이메일 | NOT NULL, UNIQUE |
| `login_id` | VARCHAR(50) | 로그인 ID | NOT NULL, UNIQUE |
| `password` | VARCHAR(255) | 비밀번호 (암호화) | NOT NULL |
| `signup_date` | DATETIME | 가입일 | DEFAULT CURRENT_TIMESTAMP |

#### `tb_email_verification` - 이메일 인증
| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `verification_id` | INT | 인증 ID | PK, AUTO_INCREMENT |
| `email` | VARCHAR(100) | 인증할 이메일 | NOT NULL |
| `code` | VARCHAR(6) | 인증번호 (6자리) | NOT NULL |
| `verified` | TINYINT(1) | 인증 완료 여부 | DEFAULT 0 |
| `created_at` | DATETIME | 생성 시간 | DEFAULT CURRENT_TIMESTAMP |

**인덱스**: `idx_email` (email)

---

### 2. 상품 관리

#### `tb_productCategory` - 상품 카테고리
| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `category_id` | INT | 카테고리 ID | PK, AUTO_INCREMENT |
| `category_name` | VARCHAR(50) | 카테고리 이름 | NOT NULL, UNIQUE |

#### `tb_product` - 상품 정보
| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `product_id` | INT | 상품 ID | PK, AUTO_INCREMENT |
| `category_id` | INT | 카테고리 ID | NOT NULL, FK |
| `product_name` | VARCHAR(100) | 상품명 | NOT NULL |
| `brand` | VARCHAR(50) | 브랜드 | NULL |
| `registered_date` | DATETIME | 등록일 | DEFAULT CURRENT_TIMESTAMP |
| `user_id` | INT | 등록한 사용자 ID | NOT NULL, FK |

**외래키**:
- `category_id` → `tb_productCategory(category_id)`
- `user_id` → `tb_user(user_id)`

---

### 3. 키워드 관리

#### `tb_keyword` - 분석 키워드
| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `keyword_id` | INT | 키워드 ID | PK, AUTO_INCREMENT |
| `category_id` | INT | 카테고리 ID | NOT NULL, FK |
| `keyword_text` | VARCHAR(50) | 키워드 텍스트 | NOT NULL |

**제약조건**: `UNIQUE(category_id, keyword_text)` - 카테고리별 키워드 중복 방지

**외래키**: `category_id` → `tb_productCategory(category_id)`

#### `tb_productKeyword` - 상품-키워드 매핑 및 감성 비율
| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `product_id` | INT | 상품 ID | PK, FK |
| `keyword_id` | INT | 키워드 ID | PK, FK |
| `positive_ratio` | DECIMAL(5,2) | 긍정 비율 (%) | NULL |
| `negative_ratio` | DECIMAL(5,2) | 부정 비율 (%) | NULL |

**복합 PK**: `(product_id, keyword_id)`

**외래키**:
- `product_id` → `tb_product(product_id)` (CASCADE)
- `keyword_id` → `tb_keyword(keyword_id)` (CASCADE)

---

### 4. 리뷰 및 분석

#### `tb_review` - 리뷰 원본 데이터
| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `review_id` | INT | 리뷰 ID | PK, AUTO_INCREMENT |
| `product_id` | INT | 상품 ID | NOT NULL, FK |
| `review_text` | TEXT | 리뷰 내용 | NOT NULL |
| `rating` | DECIMAL(2,1) | 평점 (0.0~5.0) | NOT NULL, CHECK |
| `review_date` | DATETIME | 리뷰 작성일 | NOT NULL |
| `source` | VARCHAR(50) | 리뷰 출처 | NULL |

**제약조건**: `rating BETWEEN 0.0 AND 5.0`

**외래키**: `product_id` → `tb_product(product_id)` (CASCADE)

#### `tb_reviewAnalysis` - 리뷰 감성 분석 결과
| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `keyword_id` | INT | 키워드 ID | PK, FK |
| `review_id` | INT | 리뷰 ID | PK, FK |
| `sentiment` | ENUM | 감성 ('positive', 'negative') | NOT NULL |
| `analyzed_at` | DATETIME | 분석 시간 | DEFAULT CURRENT_TIMESTAMP |

**복합 PK**: `(keyword_id, review_id)`

**외래키**:
- `keyword_id` → `tb_keyword(keyword_id)` (CASCADE)
- `review_id` → `tb_review(review_id)` (CASCADE)

---

### 5. 인사이트 및 대시보드

#### `tb_productInsight` - AI 생성 인사이트
| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `insight_id` | INT | 인사이트 ID | PK, AUTO_INCREMENT |
| `product_id` | INT | 상품 ID | NOT NULL, FK |
| `user_id` | INT | 사용자 ID | NOT NULL, FK |
| `pos_top_keywords` | VARCHAR(255) | 긍정 상위 키워드 | NULL |
| `neg_top_keywords` | VARCHAR(255) | 부정 상위 키워드 | NULL |
| `insight_summary` | TEXT | 인사이트 요약 | NULL |
| `improvement_suggestion` | TEXT | 개선 제안 | NULL |
| `content` | TEXT | 전체 내용 | NULL |
| `created_at` | DATETIME | 생성 시간 | DEFAULT CURRENT_TIMESTAMP |

**외래키**:
- `product_id` → `tb_product(product_id)` (CASCADE)
- `user_id` → `tb_user(user_id)` (RESTRICT)

#### `tb_productDashboard` - 대시보드 집계 데이터
| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `dashboard_id` | INT | 대시보드 ID | PK, AUTO_INCREMENT |
| `product_id` | INT | 상품 ID | NOT NULL, UNIQUE, FK |
| `total_reviews` | INT | 총 리뷰 수 | DEFAULT 0 |
| `sentiment_distribution` | JSON | 감성 분포 데이터 | NULL |
| `product_score` | DECIMAL(4,3) | 상품 점수 | DEFAULT 0.000 |
| `date_sentimental` | JSON | 날짜별 감성 데이터 | NULL |
| `keyword_summary` | JSON | 키워드 요약 | NULL |
| `heatmap` | JSON | 히트맵 데이터 | NULL |
| `wordcloud_path` | VARCHAR(255) | 워드클라우드 이미지 경로 | NULL |
| `insight_id` | INT | 연결된 인사이트 ID | NULL, FK |
| `updated_at` | TIMESTAMP | 업데이트 시간 | ON UPDATE CURRENT_TIMESTAMP |

**외래키**:
- `product_id` → `tb_product(product_id)`
- `insight_id` → `tb_productInsight(insight_id)`

---

### 6. 이력 및 로그

#### `tb_analysisHistory` - 분석 이력
| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `history_id` | INT | 이력 ID | PK, AUTO_INCREMENT |
| `user_id` | INT | 사용자 ID | NOT NULL, FK |
| `review_count` | INT | 분석된 리뷰 수 | NULL |
| `status` | ENUM | 상태 ('success', 'process', 'fail') | NOT NULL |
| `upload_file_name` | VARCHAR(100) | 업로드 파일명 | NULL |
| `uploaded_at` | DATETIME | 업로드 시간 | NULL |
| `analyzed_at` | DATETIME | 분석 완료 시간 | NULL |
| `model` | VARCHAR(50) | 사용된 모델 | NULL |

**외래키**: `user_id` → `tb_user(user_id)` (RESTRICT)

#### `tb_log` - 사용자 활동 로그
| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `log_id` | INT | 로그 ID | PK, AUTO_INCREMENT |
| `user_id` | INT | 사용자 ID | NOT NULL, FK |
| `action_type` | VARCHAR(50) | 액션 타입 | NOT NULL |
| `request_time` | DATETIME | 요청 시간 | DEFAULT CURRENT_TIMESTAMP |
| `details` | TEXT | 상세 정보 | NULL |

**외래키**: `user_id` → `tb_user(user_id)` (RESTRICT)

---

## 데이터 흐름

```
1. 사용자 등록 및 인증
   tb_user ← tb_email_verification

2. 상품 등록
   tb_user → tb_product ← tb_productCategory
   
3. 리뷰 업로드 및 분석
   tb_product → tb_review → tb_reviewAnalysis
   
4. 키워드 분석
   tb_keyword ← tb_productKeyword → tb_product
   
5. 인사이트 생성
   tb_product + tb_reviewAnalysis → tb_productInsight
   
6. 대시보드 집계
   tb_product + tb_review + tb_reviewAnalysis → tb_productDashboard
   
7. 이력 기록
   tb_user → tb_analysisHistory
   tb_user → tb_log
```

---

## 주요 특징

### 1. 외래키 제약조건
- **CASCADE**: 상품 삭제 시 관련 리뷰, 분석 데이터 자동 삭제
- **RESTRICT**: 사용자 삭제 시 관련 데이터가 있으면 삭제 방지

### 2. JSON 필드 활용
대시보드 테이블에서 복잡한 집계 데이터를 JSON 형태로 저장:
- `sentiment_distribution`: 감성 분포
- `date_sentimental`: 시계열 감성 데이터
- `keyword_summary`: 키워드별 요약
- `heatmap`: 히트맵 시각화 데이터

### 3. 인덱스 최적화
- 외래키 컬럼에 자동 인덱스 생성
- 자주 조회되는 컬럼에 추가 인덱스 설정

---

## 데이터베이스 초기화

```bash
# MySQL 접속
mysql -u [사용자명] -p

# 데이터베이스 생성
CREATE DATABASE ai_review CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

# 스키마 적용
USE ai_review;
SOURCE schema.sql;
```

---

## 엔진 및 문자셋
- **엔진**: InnoDB (트랜잭션 지원, 외래키 제약조건 지원)
- **문자셋**: utf8mb4 (이모지 포함 모든 유니코드 지원)
- **콜레이션**: utf8mb4_0900_ai_ci (대소문자 구분 없음, 악센트 구분 없음)
