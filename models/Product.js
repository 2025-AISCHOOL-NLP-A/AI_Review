const { pool } = require('../config/database');

class Product {
  // 모든 제품 조회 (카테고리 정보 포함)
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          p.product_id,
          p.product_name,
          p.brand,
          p.registered_date,
          c.category_id,
          c.category_name
        FROM tb_product p
        LEFT JOIN tb_productCategory c ON p.category_id = c.category_id
        ORDER BY p.registered_date DESC
      `);
      return rows;
    } catch (error) {
      console.error('제품 목록 조회 오류:', error);
      throw error;
    }
  }

  // 제품 ID로 조회
  static async findById(productId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          p.product_id,
          p.product_name,
          p.brand,
          p.registered_date,
          c.category_id,
          c.category_name
        FROM tb_product p
        LEFT JOIN tb_productCategory c ON p.category_id = c.category_id
        WHERE p.product_id = ?
      `, [productId]);
      return rows[0] || null;
    } catch (error) {
      console.error('제품 조회 오류:', error);
      throw error;
    }
  }

  // 카테고리별 제품 조회
  static async findByCategory(categoryId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          p.product_id,
          p.product_name,
          p.brand,
          p.registered_date,
          c.category_name
        FROM tb_product p
        LEFT JOIN tb_productCategory c ON p.category_id = c.category_id
        WHERE p.category_id = ?
        ORDER BY p.registered_date DESC
      `, [categoryId]);
      return rows;
    } catch (error) {
      console.error('카테고리별 제품 조회 오류:', error);
      throw error;
    }
  }

  // 제품 생성
  static async create(productData) {
    try {
      const { categoryId, productName, brand } = productData;
      
      const [result] = await pool.execute(
        'INSERT INTO tb_product (category_id, product_name, brand) VALUES (?, ?, ?)',
        [categoryId, productName, brand]
      );
      
      return {
        product_id: result.insertId,
        category_id: categoryId,
        product_name: productName,
        brand
      };
    } catch (error) {
      console.error('제품 생성 오류:', error);
      throw error;
    }
  }

  // 제품 삭제
  static async delete(productId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM tb_product WHERE product_id = ?',
        [productId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('제품 삭제 오류:', error);
      throw error;
    }
  }

  // 제품의 키워드 조회
  static async getKeywords(productId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          k.keyword_id,
          k.keyword_text,
          pk.positive_ratio,
          pk.negative_ratio
        FROM tb_productKeyword pk
        JOIN tb_keyword k ON pk.keyword_id = k.keyword_id
        WHERE pk.product_id = ?
        ORDER BY (pk.positive_ratio + pk.negative_ratio) DESC
      `, [productId]);
      return rows;
    } catch (error) {
      console.error('제품 키워드 조회 오류:', error);
      throw error;
    }
  }

  // 제품에 키워드 연결
  static async addKeyword(productId, keywordId, positiveRatio = 0, negativeRatio = 0) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO tb_productKeyword (product_id, keyword_id, positive_ratio, negative_ratio) VALUES (?, ?, ?, ?)',
        [productId, keywordId, positiveRatio, negativeRatio]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('제품 키워드 연결 오류:', error);
      throw error;
    }
  }

  // 제품 통계 조회
  static async getStats(productId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(r.review_id) as total_reviews,
          AVG(r.rating) as avg_rating,
          COUNT(CASE WHEN r.rating >= 4.0 THEN 1 END) as positive_reviews,
          COUNT(CASE WHEN r.rating <= 2.0 THEN 1 END) as negative_reviews
        FROM tb_review r
        WHERE r.product_id = ?
      `, [productId]);
      return rows[0] || null;
    } catch (error) {
      console.error('제품 통계 조회 오류:', error);
      throw error;
    }
  }

  // 카테고리 관련 메서드들
  static async getAllCategories() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tb_productCategory ORDER BY category_name'
      );
      return rows;
    } catch (error) {
      console.error('카테고리 목록 조회 오류:', error);
      throw error;
    }
  }

  static async createCategory(categoryName) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO tb_productCategory (category_name) VALUES (?)',
        [categoryName]
      );
      
      return {
        category_id: result.insertId,
        category_name: categoryName
      };
    } catch (error) {
      console.error('카테고리 생성 오류:', error);
      throw error;
    }
  }
}

module.exports = Product;