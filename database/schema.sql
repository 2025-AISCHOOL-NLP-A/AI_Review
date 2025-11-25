-- ============================================================================
-- AI Review 데이터베이스 스키마
-- ============================================================================
-- 설명: AI 기반 리뷰 분석 시스템의 데이터베이스 구조
-- 
-- 주요 기능:
--   - 사용자 관리 및 인증
--   - 상품 및 카테고리 관리
--   - 리뷰 수집 및 감성 분석
--   - 키워드 기반 인사이트 생성
--   - 대시보드 데이터 집계
--
-- 테이블 구조:
--   1. tb_user                 : 사용자 정보
--   2. tb_email_verification   : 이메일 인증
--   3. tb_productCategory      : 상품 카테고리
--   4. tb_product              : 상품 정보
--   5. tb_keyword              : 분석 키워드
--   6. tb_productKeyword       : 상품-키워드 매핑 및 감성 비율
--   7. tb_review               : 리뷰 원본 데이터
--   8. tb_reviewAnalysis       : 리뷰 감성 분석 결과
--   9. tb_productInsight       : AI 생성 인사이트
--  10. tb_productDashboard     : 대시보드 집계 데이터
--  11. tb_analysisHistory      : 분석 이력
--  12. tb_log                  : 사용자 활동 로그
-- ============================================================================

-- 1. 사용자 테이블
CREATE TABLE `tb_user` (
  `user_id`     INT NOT NULL AUTO_INCREMENT,
  `email`       VARCHAR(100) NOT NULL,
  `login_id`    VARCHAR(50) NOT NULL,
  `password`    VARCHAR(255) NOT NULL,
  `signup_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_email` (`email`),
  UNIQUE KEY `uq_user_login` (`login_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. 이메일 인증 테이블
CREATE TABLE `tb_email_verification` (
  `verification_id` INT NOT NULL AUTO_INCREMENT,
  `email`           VARCHAR(100) NOT NULL,
  `code`            VARCHAR(6) NOT NULL,
  `verified`        TINYINT(1) DEFAULT '0',
  `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`verification_id`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. 상품 카테고리 테이블
CREATE TABLE `tb_productCategory` (
  `category_id`   INT NOT NULL AUTO_INCREMENT,
  `category_name` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uq_category_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. 상품 테이블
CREATE TABLE `tb_product` (
  `product_id`      INT NOT NULL AUTO_INCREMENT,
  `category_id`     INT NOT NULL,
  `product_name`    VARCHAR(100) NOT NULL,
  `brand`           VARCHAR(50) DEFAULT NULL,
  `registered_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id`         INT NOT NULL,
  PRIMARY KEY (`product_id`),
  KEY `idx_product_category` (`category_id`),
  KEY `fk_product_user` (`user_id`),
  CONSTRAINT `fk_product_category` 
    FOREIGN KEY (`category_id`) REFERENCES `tb_productCategory` (`category_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_product_user` 
    FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. 키워드 테이블
CREATE TABLE `tb_keyword` (
  `keyword_id`   INT NOT NULL AUTO_INCREMENT,
  `category_id`  INT NOT NULL,
  `keyword_text` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`keyword_id`),
  UNIQUE KEY `uq_keyword_category_text` (`category_id`, `keyword_text`),
  KEY `idx_keyword_category` (`category_id`),
  CONSTRAINT `fk_keyword_category` 
    FOREIGN KEY (`category_id`) REFERENCES `tb_productCategory` (`category_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. 상품-키워드 매핑 테이블
CREATE TABLE `tb_productKeyword` (
  `product_id`     INT NOT NULL,
  `keyword_id`     INT NOT NULL,
  `positive_ratio` DECIMAL(5,2) DEFAULT NULL,
  `negative_ratio` DECIMAL(5,2) DEFAULT NULL,
  PRIMARY KEY (`product_id`, `keyword_id`),
  KEY `idx_pk_product` (`product_id`),
  KEY `idx_pk_keyword` (`keyword_id`),
  CONSTRAINT `fk_pk_product` 
    FOREIGN KEY (`product_id`) REFERENCES `tb_product` (`product_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pk_keyword` 
    FOREIGN KEY (`keyword_id`) REFERENCES `tb_keyword` (`keyword_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7. 리뷰 테이블
CREATE TABLE `tb_review` (
  `review_id`   INT NOT NULL AUTO_INCREMENT,
  `product_id`  INT NOT NULL,
  `review_text` TEXT NOT NULL,
  `rating`      DECIMAL(2,1) NOT NULL,
  `review_date` DATETIME NOT NULL,
  `source`      VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`review_id`),
  KEY `idx_review_product` (`product_id`),
  CONSTRAINT `fk_review_product` 
    FOREIGN KEY (`product_id`) REFERENCES `tb_product` (`product_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tb_review_chk_1` CHECK (`rating` BETWEEN 0.0 AND 5.0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8. 리뷰 분석 테이블
CREATE TABLE `tb_reviewAnalysis` (
  `keyword_id`  INT NOT NULL,
  `review_id`   INT NOT NULL,
  `sentiment`   ENUM('positive', 'negative') NOT NULL,
  `analyzed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`keyword_id`, `review_id`),
  KEY `idx_ra_review` (`review_id`),
  KEY `idx_ra_keyword` (`keyword_id`),
  CONSTRAINT `fk_ra_keyword` 
    FOREIGN KEY (`keyword_id`) REFERENCES `tb_keyword` (`keyword_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ra_review` 
    FOREIGN KEY (`review_id`) REFERENCES `tb_review` (`review_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 9. 상품 인사이트 테이블
CREATE TABLE `tb_productInsight` (
  `insight_id`             INT NOT NULL AUTO_INCREMENT,
  `product_id`             INT NOT NULL,
  `user_id`                INT NOT NULL,
  `pos_top_keywords`       VARCHAR(255) DEFAULT NULL,
  `neg_top_keywords`       VARCHAR(255) DEFAULT NULL,
  `insight_summary`        TEXT,
  `improvement_suggestion` TEXT,
  `created_at`             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `content`                TEXT,
  PRIMARY KEY (`insight_id`),
  KEY `idx_pi_product` (`product_id`),
  KEY `idx_pi_user` (`user_id`),
  CONSTRAINT `fk_pi_product` 
    FOREIGN KEY (`product_id`) REFERENCES `tb_product` (`product_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pi_user` 
    FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`user_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 10. 상품 대시보드 테이블
CREATE TABLE `tb_productDashboard` (
  `dashboard_id`           INT NOT NULL AUTO_INCREMENT,
  `product_id`             INT NOT NULL,
  `total_reviews`          INT DEFAULT '0',
  `sentiment_distribution` JSON DEFAULT NULL,
  `product_score`          DECIMAL(4,3) NOT NULL DEFAULT '0.000',
  `date_sentimental`       JSON DEFAULT NULL,
  `keyword_summary`        JSON DEFAULT NULL,
  `heatmap`                JSON DEFAULT NULL,
  `wordcloud_path`         VARCHAR(255) DEFAULT NULL,
  `insight_id`             INT DEFAULT NULL,
  `updated_at`             TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`dashboard_id`),
  UNIQUE KEY `uq_product_id` (`product_id`),
  KEY `insight_id` (`insight_id`),
  CONSTRAINT `tb_productDashboard_ibfk_1` 
    FOREIGN KEY (`product_id`) REFERENCES `tb_product` (`product_id`),
  CONSTRAINT `tb_productDashboard_ibfk_2` 
    FOREIGN KEY (`insight_id`) REFERENCES `tb_productInsight` (`insight_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 11. 분석 이력 테이블
CREATE TABLE `tb_analysisHistory` (
  `history_id`       INT NOT NULL AUTO_INCREMENT,
  `user_id`          INT NOT NULL,
  `review_count`     INT DEFAULT NULL,
  `status`           ENUM('success', 'process', 'fail') NOT NULL,
  `upload_file_name` VARCHAR(100) DEFAULT NULL,
  `uploaded_at`      DATETIME DEFAULT NULL,
  `analyzed_at`      DATETIME DEFAULT NULL,
  `model`            VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`history_id`),
  KEY `idx_ah_user` (`user_id`),
  CONSTRAINT `fk_ah_user` 
    FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`user_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 12. 로그 테이블
CREATE TABLE `tb_log` (
  `log_id`       INT NOT NULL AUTO_INCREMENT,
  `user_id`      INT NOT NULL,
  `action_type`  VARCHAR(50) NOT NULL,
  `request_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `details`      TEXT,
  PRIMARY KEY (`log_id`),
  KEY `idx_log_user` (`user_id`),
  CONSTRAINT `fk_log_user` 
    FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`user_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
