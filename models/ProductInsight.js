const { pool } = require('../config/database');

class ProductInsight {
  // 모든 인사이트 조회
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          pi.insight_id,
          pi.product_id,
          pi.user_id,
          pi.avg_rating,
          pi.pos_top_keywords,
          pi.neg_top_keywords,
          pi.insight_summary,
          pi.improvement_suggestion,
          pi.created_at,
          p.product_name,
          p.brand,
          u.login_id as creator_login_id
        FROM tb_productInsight pi
        LEFT JOIN tb_product p ON pi.product_id = p.product_id
        LEFT JOIN tb_user u ON pi.user_id = u.user_id
        ORDER BY pi.created_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('인사이트 목록 조회 오류:', error);
      throw error;
    }
  }

  // 인사이트 ID로 조회
  static async findById(insightId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          pi.insight_id,
          pi.product_id,
          pi.user_id,
          pi.avg_rating,
          pi.pos_top_keywords,
          pi.neg_top_keywords,
          pi.insight_summary,
          pi.improvement_suggestion,
          pi.created_at,
          p.product_name,
          p.brand,
          c.category_name,
          u.login_id as creator_login_id
        FROM tb_productInsight pi
        LEFT JOIN tb_product p ON pi.product_id = p.product_id
        LEFT JOIN tb_productCategory c ON p.category_id = c.category_id
        LEFT JOIN tb_user u ON pi.user_id = u.user_id
        WHERE pi.insight_id = ?
      `, [insightId]);
      return rows[0] || null;
    } catch (error) {
      console.error('인사이트 조회 오류:', error);
      throw error;
    }
  }

  // 제품별 인사이트 조회
  static async findByProductId(productId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          pi.insight_id,
          pi.avg_rating,
          pi.pos_top_keywords,
          pi.neg_top_keywords,
          pi.insight_summary,
          pi.improvement_suggestion,
          pi.created_at,
          u.login_id as creator_login_id
        FROM tb_productInsight pi
        LEFT JOIN tb_user u ON pi.user_id = u.user_id
        WHERE pi.product_id = ?
        ORDER BY pi.created_at DESC
      `, [productId]);
      return rows;
    } catch (error) {
      console.error('제품별 인사이트 조회 오류:', error);
      throw error;
    }
  }

  // 사용자별 인사이트 조회
  static async findByUserId(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          pi.insight_id,
          pi.product_id,
          pi.avg_rating,
          pi.pos_top_keywords,
          pi.neg_top_keywords,
          pi.insight_summary,
          pi.improvement_suggestion,
          pi.created_at,
          p.product_name,
          p.brand
        FROM tb_productInsight pi
        LEFT JOIN tb_product p ON pi.product_id = p.product_id
        WHERE pi.user_id = ?
        ORDER BY pi.created_at DESC
      `, [userId]);
      return rows;
    } catch (error) {
      console.error('사용자별 인사이트 조회 오류:', error);
      throw error;
    }
  }

  // 인사이트 생성
  static async create(insightData) {
    try {
      const {
        productId,
        userId,
        avgRating,
        posTopKeywords,
        negTopKeywords,
        insightSummary,
        improvementSuggestion
      } = insightData;
      
      const [result] = await pool.execute(`
        INSERT INTO tb_productInsight 
        (product_id, user_id, avg_rating, pos_top_keywords, neg_top_keywords, insight_summary, improvement_suggestion)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [productId, userId, avgRating, posTopKeywords, negTopKeywords, insightSummary, improvementSuggestion]);
      
      return {
        insight_id: result.insertId,
        product_id: productId,
        user_id: userId,
        avg_rating: avgRating,
        pos_top_keywords: posTopKeywords,
        neg_top_keywords: negTopKeywords,
        insight_summary: insightSummary,
        improvement_suggestion: improvementSuggestion
      };
    } catch (error) {
      console.error('인사이트 생성 오류:', error);
      throw error;
    }
  }

  // 인사이트 수정
  static async update(insightId, updateData) {
    try {
      const fields = [];
      const values = [];
      
      if (updateData.avgRating !== undefined) {
        fields.push('avg_rating = ?');
        values.push(updateData.avgRating);
      }
      
      if (updateData.posTopKeywords !== undefined) {
        fields.push('pos_top_keywords = ?');
        values.push(updateData.posTopKeywords);
      }
      
      if (updateData.negTopKeywords !== undefined) {
        fields.push('neg_top_keywords = ?');
        values.push(updateData.negTopKeywords);
      }
      
      if (updateData.insightSummary !== undefined) {
        fields.push('insight_summary = ?');
        values.push(updateData.insightSummary);
      }
      
      if (updateData.improvementSuggestion !== undefined) {
        fields.push('improvement_suggestion = ?');
        values.push(updateData.improvementSuggestion);
      }
      
      if (fields.length === 0) {
        throw new Error('수정할 데이터가 없습니다.');
      }
      
      values.push(insightId);
      
      const [result] = await pool.execute(
        `UPDATE tb_productInsight SET ${fields.join(', ')} WHERE insight_id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('인사이트 수정 오류:', error);
      throw error;
    }
  }

  // 인사이트 삭제
  static async delete(insightId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM tb_productInsight WHERE insight_id = ?',
        [insightId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('인사이트 삭제 오류:', error);
      throw error;
    }
  }

  // 최신 인사이트 조회 (제품별)
  static async getLatestByProduct(productId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          pi.insight_id,
          pi.avg_rating,
          pi.pos_top_keywords,
          pi.neg_top_keywords,
          pi.insight_summary,
          pi.improvement_suggestion,
          pi.created_at,
          u.login_id as creator_login_id
        FROM tb_productInsight pi
        LEFT JOIN tb_user u ON pi.user_id = u.user_id
        WHERE pi.product_id = ?
        ORDER BY pi.created_at DESC
        LIMIT 1
      `, [productId]);
      return rows[0] || null;
    } catch (error) {
      console.error('최신 인사이트 조회 오류:', error);
      throw error;
    }
  }

  // 인사이트 통계
  static async getStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as total_insights,
          COUNT(DISTINCT product_id) as products_with_insights,
          COUNT(DISTINCT user_id) as active_analysts,
          AVG(avg_rating) as overall_avg_rating,
          DATE(MAX(created_at)) as latest_insight_date
        FROM tb_productInsight
      `);
      return rows[0] || null;
    } catch (error) {
      console.error('인사이트 통계 조회 오류:', error);
      throw error;
    }
  }

  // 기간별 인사이트 조회
  static async findByDateRange(startDate, endDate) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          pi.insight_id,
          pi.product_id,
          pi.avg_rating,
          pi.insight_summary,
          pi.created_at,
          p.product_name,
          u.login_id as creator_login_id
        FROM tb_productInsight pi
        LEFT JOIN tb_product p ON pi.product_id = p.product_id
        LEFT JOIN tb_user u ON pi.user_id = u.user_id
        WHERE pi.created_at >= ? AND pi.created_at <= ?
        ORDER BY pi.created_at DESC
      `, [startDate, endDate]);
      return rows;
    } catch (error) {
      console.error('기간별 인사이트 조회 오류:', error);
      throw error;
    }
  }
}

module.exports = ProductInsight;