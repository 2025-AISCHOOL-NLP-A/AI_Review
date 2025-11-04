const { pool } = require('../config/database');

class Review {
  // 제품의 모든 리뷰 조회
  static async findByProductId(productId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          r.review_id,
          r.product_id,
          r.review_text,
          r.rating,
          r.review_date,
          r.source,
          p.product_name
        FROM tb_review r
        LEFT JOIN tb_product p ON r.product_id = p.product_id
        WHERE r.product_id = ?
        ORDER BY r.review_date DESC
      `, [productId]);
      return rows;
    } catch (error) {
      console.error('제품 리뷰 조회 오류:', error);
      throw error;
    }
  }

  // 리뷰 ID로 조회
  static async findById(reviewId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          r.review_id,
          r.product_id,
          r.review_text,
          r.rating,
          r.review_date,
          r.source,
          p.product_name
        FROM tb_review r
        LEFT JOIN tb_product p ON r.product_id = p.product_id
        WHERE r.review_id = ?
      `, [reviewId]);
      return rows[0] || null;
    } catch (error) {
      console.error('리뷰 조회 오류:', error);
      throw error;
    }
  }

  // 리뷰 생성
  static async create(reviewData) {
    try {
      const { productId, reviewText, rating, reviewDate, source } = reviewData;
      
      const [result] = await pool.execute(
        'INSERT INTO tb_review (product_id, review_text, rating, review_date, source) VALUES (?, ?, ?, ?, ?)',
        [productId, reviewText, rating, reviewDate || new Date(), source]
      );
      
      return {
        review_id: result.insertId,
        product_id: productId,
        review_text: reviewText,
        rating,
        review_date: reviewDate,
        source
      };
    } catch (error) {
      console.error('리뷰 생성 오류:', error);
      throw error;
    }
  }

  // 리뷰 삭제
  static async delete(reviewId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM tb_review WHERE review_id = ?',
        [reviewId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('리뷰 삭제 오류:', error);
      throw error;
    }
  }

  // 리뷰의 분석 결과 조회
  static async getAnalysis(reviewId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          ra.keyword_id,
          ra.sentiment,
          ra.analyzed_at,
          k.keyword_text
        FROM tb_reviewAnalysis ra
        JOIN tb_keyword k ON ra.keyword_id = k.keyword_id
        WHERE ra.review_id = ?
        ORDER BY ra.analyzed_at DESC
      `, [reviewId]);
      return rows;
    } catch (error) {
      console.error('리뷰 분석 조회 오류:', error);
      throw error;
    }
  }

  // 리뷰 분석 결과 추가
  static async addAnalysis(reviewId, keywordId, sentiment) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO tb_reviewAnalysis (keyword_id, review_id, sentiment) VALUES (?, ?, ?)',
        [keywordId, reviewId, sentiment]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('리뷰 분석 추가 오류:', error);
      throw error;
    }
  }

  // 제품의 리뷰 통계
  static async getProductReviewStats(productId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as total_count,
          AVG(rating) as avg_rating,
          COUNT(CASE WHEN rating >= 4.0 THEN 1 END) as positive_count,
          COUNT(CASE WHEN rating >= 3.0 AND rating < 4.0 THEN 1 END) as neutral_count,
          COUNT(CASE WHEN rating < 3.0 THEN 1 END) as negative_count,
          MAX(review_date) as latest_review_date,
          MIN(review_date) as earliest_review_date
        FROM tb_review 
        WHERE product_id = ?
      `, [productId]);
      return rows[0] || null;
    } catch (error) {
      console.error('제품 리뷰 통계 조회 오류:', error);
      throw error;
    }
  }

  // 기간별 리뷰 조회
  static async findByDateRange(productId, startDate, endDate) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          review_id,
          review_text,
          rating,
          review_date,
          source
        FROM tb_review
        WHERE product_id = ? 
          AND review_date >= ? 
          AND review_date <= ?
        ORDER BY review_date DESC
      `, [productId, startDate, endDate]);
      return rows;
    } catch (error) {
      console.error('기간별 리뷰 조회 오류:', error);
      throw error;
    }
  }

  // 평점별 리뷰 조회
  static async findByRating(productId, minRating, maxRating) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          review_id,
          review_text,
          rating,
          review_date,
          source
        FROM tb_review
        WHERE product_id = ? 
          AND rating >= ? 
          AND rating <= ?
        ORDER BY review_date DESC
      `, [productId, minRating, maxRating]);
      return rows;
    } catch (error) {
      console.error('평점별 리뷰 조회 오류:', error);
      throw error;
    }
  }

  // 키워드별 리뷰 분석 통계
  static async getKeywordAnalysisStats(productId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          k.keyword_id,
          k.keyword_text,
          COUNT(CASE WHEN ra.sentiment = 'positive' THEN 1 END) as positive_count,
          COUNT(CASE WHEN ra.sentiment = 'negative' THEN 1 END) as negative_count,
          COUNT(*) as total_mentions
        FROM tb_reviewAnalysis ra
        JOIN tb_keyword k ON ra.keyword_id = k.keyword_id
        JOIN tb_review r ON ra.review_id = r.review_id
        WHERE r.product_id = ?
        GROUP BY k.keyword_id, k.keyword_text
        ORDER BY total_mentions DESC
      `, [productId]);
      return rows;
    } catch (error) {
      console.error('키워드별 분석 통계 조회 오류:', error);
      throw error;
    }
  }
}

module.exports = Review;