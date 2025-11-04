const { pool } = require('../config/database');

class AnalysisHistory {
  // 모든 분석 이력 조회
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          ah.history_id,
          ah.user_id,
          ah.review_count,
          ah.status,
          ah.upload_file_name,
          ah.uploaded_at,
          ah.analyzed_at,
          ah.model,
          u.login_id,
          u.email
        FROM tb_analysisHistory ah
        LEFT JOIN tb_user u ON ah.user_id = u.user_id
        ORDER BY ah.uploaded_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('분석 이력 목록 조회 오류:', error);
      throw error;
    }
  }

  // 분석 이력 ID로 조회
  static async findById(historyId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          ah.history_id,
          ah.user_id,
          ah.review_count,
          ah.status,
          ah.upload_file_name,
          ah.uploaded_at,
          ah.analyzed_at,
          ah.model,
          u.login_id,
          u.email
        FROM tb_analysisHistory ah
        LEFT JOIN tb_user u ON ah.user_id = u.user_id
        WHERE ah.history_id = ?
      `, [historyId]);
      return rows[0] || null;
    } catch (error) {
      console.error('분석 이력 조회 오류:', error);
      throw error;
    }
  }

  // 사용자별 분석 이력 조회
  static async findByUserId(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          history_id,
          review_count,
          status,
          upload_file_name,
          uploaded_at,
          analyzed_at,
          model
        FROM tb_analysisHistory
        WHERE user_id = ?
        ORDER BY uploaded_at DESC
      `, [userId]);
      return rows;
    } catch (error) {
      console.error('사용자별 분석 이력 조회 오류:', error);
      throw error;
    }
  }

  // 상태별 분석 이력 조회
  static async findByStatus(status) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          ah.history_id,
          ah.user_id,
          ah.review_count,
          ah.upload_file_name,
          ah.uploaded_at,
          ah.analyzed_at,
          ah.model,
          u.login_id
        FROM tb_analysisHistory ah
        LEFT JOIN tb_user u ON ah.user_id = u.user_id
        WHERE ah.status = ?
        ORDER BY ah.uploaded_at DESC
      `, [status]);
      return rows;
    } catch (error) {
      console.error('상태별 분석 이력 조회 오류:', error);
      throw error;
    }
  }

  // 분석 이력 생성
  static async create(historyData) {
    try {
      const {
        userId,
        reviewCount,
        status = 'process',
        uploadFileName,
        uploadedAt = new Date(),
        model
      } = historyData;
      
      const [result] = await pool.execute(`
        INSERT INTO tb_analysisHistory 
        (user_id, review_count, status, upload_file_name, uploaded_at, model)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, reviewCount, status, uploadFileName, uploadedAt, model]);
      
      return {
        history_id: result.insertId,
        user_id: userId,
        review_count: reviewCount,
        status,
        upload_file_name: uploadFileName,
        uploaded_at: uploadedAt,
        model
      };
    } catch (error) {
      console.error('분석 이력 생성 오류:', error);
      throw error;
    }
  }

  // 분석 상태 업데이트
  static async updateStatus(historyId, status, analyzedAt = null) {
    try {
      let query = 'UPDATE tb_analysisHistory SET status = ?';
      let values = [status];
      
      if (analyzedAt && (status === 'success' || status === 'fail')) {
        query += ', analyzed_at = ?';
        values.push(analyzedAt);
      }
      
      query += ' WHERE history_id = ?';
      values.push(historyId);
      
      const [result] = await pool.execute(query, values);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('분석 상태 업데이트 오류:', error);
      throw error;
    }
  }

  // 분석 이력 삭제
  static async delete(historyId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM tb_analysisHistory WHERE history_id = ?',
        [historyId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('분석 이력 삭제 오류:', error);
      throw error;
    }
  }

  // 사용자별 분석 통계
  static async getUserStats(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as total_analyses,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_analyses,
          COUNT(CASE WHEN status = 'process' THEN 1 END) as processing_analyses,
          COUNT(CASE WHEN status = 'fail' THEN 1 END) as failed_analyses,
          SUM(review_count) as total_reviews_analyzed,
          MAX(uploaded_at) as last_analysis_date
        FROM tb_analysisHistory
        WHERE user_id = ?
      `, [userId]);
      return rows[0] || null;
    } catch (error) {
      console.error('사용자 분석 통계 조회 오류:', error);
      throw error;
    }
  }

  // 전체 분석 통계
  static async getOverallStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as total_analyses,
          COUNT(DISTINCT user_id) as active_users,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_analyses,
          COUNT(CASE WHEN status = 'process' THEN 1 END) as processing_analyses,
          COUNT(CASE WHEN status = 'fail' THEN 1 END) as failed_analyses,
          SUM(review_count) as total_reviews_processed,
          AVG(review_count) as avg_reviews_per_analysis
        FROM tb_analysisHistory
      `);
      return rows[0] || null;
    } catch (error) {
      console.error('전체 분석 통계 조회 오류:', error);
      throw error;
    }
  }

  // 기간별 분석 이력 조회
  static async findByDateRange(startDate, endDate) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          ah.history_id,
          ah.user_id,
          ah.review_count,
          ah.status,
          ah.upload_file_name,
          ah.uploaded_at,
          ah.analyzed_at,
          u.login_id
        FROM tb_analysisHistory ah
        LEFT JOIN tb_user u ON ah.user_id = u.user_id
        WHERE ah.uploaded_at >= ? AND ah.uploaded_at <= ?
        ORDER BY ah.uploaded_at DESC
      `, [startDate, endDate]);
      return rows;
    } catch (error) {
      console.error('기간별 분석 이력 조회 오류:', error);
      throw error;
    }
  }

  // 진행 중인 분석 조회
  static async getProcessingAnalyses() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          ah.history_id,
          ah.user_id,
          ah.review_count,
          ah.upload_file_name,
          ah.uploaded_at,
          ah.model,
          u.login_id
        FROM tb_analysisHistory ah
        LEFT JOIN tb_user u ON ah.user_id = u.user_id
        WHERE ah.status = 'process'
        ORDER BY ah.uploaded_at ASC
      `);
      return rows;
    } catch (error) {
      console.error('진행 중인 분석 조회 오류:', error);
      throw error;
    }
  }
}

module.exports = AnalysisHistory;