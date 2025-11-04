const { pool } = require('../config/database');

class Keyword {
  // 모든 키워드 조회
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          k.keyword_id,
          k.keyword_text,
          k.category_id,
          c.category_name
        FROM tb_keyword k
        LEFT JOIN tb_productCategory c ON k.category_id = c.category_id
        ORDER BY k.keyword_text
      `);
      return rows;
    } catch (error) {
      console.error('키워드 목록 조회 오류:', error);
      throw error;
    }
  }

  // 키워드 ID로 조회
  static async findById(keywordId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          k.keyword_id,
          k.keyword_text,
          k.category_id,
          c.category_name
        FROM tb_keyword k
        LEFT JOIN tb_productCategory c ON k.category_id = c.category_id
        WHERE k.keyword_id = ?
      `, [keywordId]);
      return rows[0] || null;
    } catch (error) {
      console.error('키워드 조회 오류:', error);
      throw error;
    }
  }

  // 카테고리별 키워드 조회
  static async findByCategory(categoryId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          k.keyword_id,
          k.keyword_text,
          c.category_name
        FROM tb_keyword k
        LEFT JOIN tb_productCategory c ON k.category_id = c.category_id
        WHERE k.category_id = ?
        ORDER BY k.keyword_text
      `, [categoryId]);
      return rows;
    } catch (error) {
      console.error('카테고리별 키워드 조회 오류:', error);
      throw error;
    }
  }

  // 키워드 텍스트로 검색
  static async findByText(keywordText) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          k.keyword_id,
          k.keyword_text,
          k.category_id,
          c.category_name
        FROM tb_keyword k
        LEFT JOIN tb_productCategory c ON k.category_id = c.category_id
        WHERE k.keyword_text LIKE ?
        ORDER BY k.keyword_text
      `, [`%${keywordText}%`]);
      return rows;
    } catch (error) {
      console.error('키워드 텍스트 검색 오류:', error);
      throw error;
    }
  }

  // 키워드 생성
  static async create(keywordData) {
    try {
      const { categoryId, keywordText } = keywordData;
      
      const [result] = await pool.execute(
        'INSERT INTO tb_keyword (category_id, keyword_text) VALUES (?, ?)',
        [categoryId, keywordText]
      );
      
      return {
        keyword_id: result.insertId,
        category_id: categoryId,
        keyword_text: keywordText
      };
    } catch (error) {
      console.error('키워드 생성 오류:', error);
      throw error;
    }
  }

  // 키워드 삭제
  static async delete(keywordId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM tb_keyword WHERE keyword_id = ?',
        [keywordId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('키워드 삭제 오류:', error);
      throw error;
    }
  }

  // 키워드 중복 확인
  static async isExists(categoryId, keywordText) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM tb_keyword WHERE category_id = ? AND keyword_text = ?',
        [categoryId, keywordText]
      );
      return rows[0].count > 0;
    } catch (error) {
      console.error('키워드 중복 확인 오류:', error);
      throw error;
    }
  }

  // 제품-키워드 매핑 관련 메서드들
  
  // 제품의 키워드 매핑 조회
  static async getProductKeywords(productId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          pk.product_id,
          pk.keyword_id,
          pk.positive_ratio,
          pk.negative_ratio,
          k.keyword_text,
          c.category_name
        FROM tb_productKeyword pk
        JOIN tb_keyword k ON pk.keyword_id = k.keyword_id
        LEFT JOIN tb_productCategory c ON k.category_id = c.category_id
        WHERE pk.product_id = ?
        ORDER BY (pk.positive_ratio + pk.negative_ratio) DESC
      `, [productId]);
      return rows;
    } catch (error) {
      console.error('제품 키워드 매핑 조회 오류:', error);
      throw error;
    }
  }

  // 제품-키워드 매핑 생성/업데이트
  static async updateProductKeyword(productId, keywordId, positiveRatio, negativeRatio) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO tb_productKeyword (product_id, keyword_id, positive_ratio, negative_ratio)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        positive_ratio = VALUES(positive_ratio),
        negative_ratio = VALUES(negative_ratio)
      `, [productId, keywordId, positiveRatio, negativeRatio]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('제품 키워드 매핑 업데이트 오류:', error);
      throw error;
    }
  }

  // 제품-키워드 매핑 삭제
  static async removeProductKeyword(productId, keywordId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM tb_productKeyword WHERE product_id = ? AND keyword_id = ?',
        [productId, keywordId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('제품 키워드 매핑 삭제 오류:', error);
      throw error;
    }
  }

  // 키워드별 제품 목록 조회
  static async getKeywordProducts(keywordId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          pk.product_id,
          pk.positive_ratio,
          pk.negative_ratio,
          p.product_name,
          p.brand,
          c.category_name
        FROM tb_productKeyword pk
        JOIN tb_product p ON pk.product_id = p.product_id
        LEFT JOIN tb_productCategory c ON p.category_id = c.category_id
        WHERE pk.keyword_id = ?
        ORDER BY (pk.positive_ratio + pk.negative_ratio) DESC
      `, [keywordId]);
      return rows;
    } catch (error) {
      console.error('키워드별 제품 목록 조회 오류:', error);
      throw error;
    }
  }

  // 키워드 사용 통계
  static async getKeywordStats(keywordId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT pk.product_id) as product_count,
          AVG(pk.positive_ratio) as avg_positive_ratio,
          AVG(pk.negative_ratio) as avg_negative_ratio,
          COUNT(DISTINCT ra.review_id) as review_mention_count
        FROM tb_keyword k
        LEFT JOIN tb_productKeyword pk ON k.keyword_id = pk.keyword_id
        LEFT JOIN tb_reviewAnalysis ra ON k.keyword_id = ra.keyword_id
        WHERE k.keyword_id = ?
        GROUP BY k.keyword_id
      `, [keywordId]);
      return rows[0] || null;
    } catch (error) {
      console.error('키워드 통계 조회 오류:', error);
      throw error;
    }
  }
}

module.exports = Keyword;