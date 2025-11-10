--SQL테이블 생성
--대시보드 테이블 추가 반영

-- 1) 사용자 (부모)
CREATE TABLE tb_user (
  `user_id`     INT NOT NULL AUTO_INCREMENT,
  `email`       VARCHAR(100) NOT NULL,
  `login_id`    VARCHAR(50)  NOT NULL,
  `password`    VARCHAR(255) NOT NULL,
  `signup_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY uq_user_email (`email`),
  UNIQUE KEY uq_user_login (`login_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) 카테고리 (부모)
CREATE TABLE tb_productCategory (
  `category_id`   INT AUTO_INCREMENT PRIMARY KEY,
  `category_name` VARCHAR(50) NOT NULL,
  UNIQUE KEY uq_category_name (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) 상품 (카테고리 FK)
CREATE TABLE tb_product (
  `product_id`      INT NOT NULL AUTO_INCREMENT,
  `category_id`     INT NOT NULL,
  `product_name`    VARCHAR(100) NOT NULL,
  `brand`           VARCHAR(50),
  `registered_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  KEY idx_product_category (`category_id`),
  CONSTRAINT fk_product_category
    FOREIGN KEY (`category_id`) REFERENCES tb_productCategory(`category_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) 키워드 (카테고리 FK)
CREATE TABLE `tb_keyword` (
  `keyword_id`   INT AUTO_INCREMENT PRIMARY KEY,
  `category_id`  INT NOT NULL,
  `keyword_text` VARCHAR(50) NOT NULL,
  KEY idx_keyword_category (`category_id`),
  CONSTRAINT fk_keyword_category
    FOREIGN KEY (`category_id`) REFERENCES tb_productCategory(`category_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uq_keyword_category_text (`category_id`, `keyword_text`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) 상품-키워드 매핑 (상품/키워드 FK)
CREATE TABLE `tb_productKeyword` (
  `product_id`     INT NOT NULL,
  `keyword_id`     INT NOT NULL,
  `positive_ratio` DECIMAL(5,2),
  `negative_ratio` DECIMAL(5,2),
  PRIMARY KEY (`product_id`, `keyword_id`),
  KEY idx_pk_product (`product_id`),
  KEY idx_pk_keyword (`keyword_id`),
  CONSTRAINT fk_pk_product
    FOREIGN KEY (`product_id`) REFERENCES tb_product(`product_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pk_keyword
    FOREIGN KEY (`keyword_id`) REFERENCES tb_keyword(`keyword_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6) 리뷰 (상품 FK)
CREATE TABLE `tb_review` (
  `review_id`   INT AUTO_INCREMENT PRIMARY KEY,
  `product_id`  INT NOT NULL,
  `review_text` TEXT NOT NULL,
  `rating`      DECIMAL(2,1) NOT NULL CHECK (`rating` BETWEEN 0.0 AND 5.0),
  `review_date` DATETIME NOT NULL,
  `source`      VARCHAR(50),
  KEY idx_review_product (`product_id`),
  CONSTRAINT fk_review_product
    FOREIGN KEY (`product_id`) REFERENCES tb_product(`product_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7) 리뷰분석 (리뷰/키워드 FK)
CREATE TABLE `tb_reviewAnalysis` (
  `keyword_id`  INT NOT NULL,
  `review_id`   INT NOT NULL,
  `sentiment`   ENUM('positive','negative') NOT NULL,
  `analyzed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`keyword_id`, `review_id`),
  KEY idx_ra_review (`review_id`),
  KEY idx_ra_keyword (`keyword_id`),
  CONSTRAINT fk_ra_review
    FOREIGN KEY (`review_id`) REFERENCES tb_review(`review_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ra_keyword
    FOREIGN KEY (`keyword_id`) REFERENCES tb_keyword(`keyword_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8) 제품 인사이트 (상품/사용자 FK)
CREATE TABLE `tb_productInsight` (
  `insight_id`             INT AUTO_INCREMENT PRIMARY KEY,
  `product_id`             INT NOT NULL,
  `user_id`                INT NOT NULL,
  `avg_rating`             DECIMAL(3,2),
  `pos_top_keywords`       VARCHAR(255),
  `neg_top_keywords`       VARCHAR(255),
  `insight_summary`        TEXT,
  `improvement_suggestion` TEXT,
  `created_at`             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pi_product (`product_id`),
  KEY idx_pi_user (`user_id`),
  CONSTRAINT fk_pi_product
    FOREIGN KEY (`product_id`) REFERENCES tb_product(`product_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pi_user
    FOREIGN KEY (`user_id`)  REFERENCES tb_user(`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9) 분석 이력 (사용자 FK)
CREATE TABLE tb_analysisHistory (
  `history_id`       INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`          INT NOT NULL,
  `review_count` INT,
  `status` ENUM('success','process','fail') NOT NULL,  
  `upload_file_name` VARCHAR(100),
  `uploaded_at`      DATETIME,
  `analyzed_at`      DATETIME,
  `model`            VARCHAR(50),
  KEY idx_ah_user (`user_id`),
  CONSTRAINT fk_ah_user
    FOREIGN KEY (`user_id`) REFERENCES tb_user(`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10) 로그 (사용자 FK)
CREATE TABLE tb_log (
  `log_id`       INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`      INT NOT NULL,
  `action_type`  VARCHAR(50) NOT NULL,
  `request_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `details`      TEXT,
  KEY idx_log_user (`user_id`),
  CONSTRAINT fk_log_user
    FOREIGN KEY (`user_id`) REFERENCES tb_user(`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11) 대시보드 카테고리를 명시화한 테이블
CREATE TABLE `tb_productDashboard` (
   `dashboard_id` int NOT NULL AUTO_INCREMENT,
   `product_id` int NOT NULL,
   `total_reviews` int DEFAULT '0',
   `sentiment_distribution` json DEFAULT NULL,
   `product_score` decimal(2,1) DEFAULT '0.0',
   `date_sentimental` json DEFAULT NULL,
   `keyword_summary` json DEFAULT NULL,
   `heatmap` json DEFAULT NULL,
   `wordcloud_path` varchar(255) DEFAULT NULL,
   `insight_id` int DEFAULT NULL,
   `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (`dashboard_id`),
   KEY `product_id` (`product_id`),
   KEY `insight_id` (`insight_id`),
   CONSTRAINT `tb_productDashboard_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `tb_product` (`product_id`),
   CONSTRAINT `tb_productDashboard_ibfk_2` FOREIGN KEY (`insight_id`) REFERENCES `tb_productInsight` (`insight_id`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci