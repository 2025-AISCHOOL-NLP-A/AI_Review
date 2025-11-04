const { pool } = require('../config/database');

class Log {
  // 모든 로그 조회
  static async findAll(limit = 100) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          l.log_id,
          l.user_id,
          l.action_type,
          l.request_time,
          l.details,
          u.login_id,
          u.email
        FROM tb_log l
        LEFT JOIN tb_user u ON l.user_id = u.user_id
        ORDER BY l.request_time DESC
        LIMIT ?
      `, [limit]);
      return rows;
    } catch (error) {
      console.error('로그 목록 조회 오류:', error);
      throw error;
    }
  }

  // 로그 ID로 조회
  static async findById(logId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          l.log_id,
          l.user_id,
          l.action_type,
          l.request_time,
          l.details,
          u.login_id,
          u.email
        FROM tb_log l
        LEFT JOIN tb_user u ON l.user_id = u.user_id
        WHERE l.log_id = ?
      `, [logId]);
      return rows[0] || null;
    } catch (error) {
      console.error('로그 조회 오류:', error);
      throw error;
    }
  }

  // 사용자별 로그 조회
  static async findByUserId(userId, limit = 50) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          log_id,
          action_type,
          request_time,
          details
        FROM tb_log
        WHERE user_id = ?
        ORDER BY request_time DESC
        LIMIT ?
      `, [userId, limit]);
      return rows;
    } catch (error) {
      console.error('사용자별 로그 조회 오류:', error);
      throw error;
    }
  }

  // 액션 타입별 로그 조회
  static async findByActionType(actionType, limit = 100) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          l.log_id,
          l.user_id,
          l.request_time,
          l.details,
          u.login_id
        FROM tb_log l
        LEFT JOIN tb_user u ON l.user_id = u.user_id
        WHERE l.action_type = ?
        ORDER BY l.request_time DESC
        LIMIT ?
      `, [actionType, limit]);
      return rows;
    } catch (error) {
      console.error('액션 타입별 로그 조회 오류:', error);
      throw error;
    }
  }

  // 로그 생성
  static async create(logData) {
    try {
      const {
        userId,
        actionType,
        requestTime = new Date(),
        details
      } = logData;
      
      const [result] = await pool.execute(`
        INSERT INTO tb_log (user_id, action_type, request_time, details)
        VALUES (?, ?, ?, ?)
      `, [userId, actionType, requestTime, details]);
      
      return {
        log_id: result.insertId,
        user_id: userId,
        action_type: actionType,
        request_time: requestTime,
        details
      };
    } catch (error) {
      console.error('로그 생성 오류:', error);
      throw error;
    }
  }

  // 로그 삭제 (관리자용)
  static async delete(logId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM tb_log WHERE log_id = ?',
        [logId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('로그 삭제 오류:', error);
      throw error;
    }
  }

  // 기간별 로그 조회
  static async findByDateRange(startDate, endDate, limit = 1000) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          l.log_id,
          l.user_id,
          l.action_type,
          l.request_time,
          l.details,
          u.login_id
        FROM tb_log l
        LEFT JOIN tb_user u ON l.user_id = u.user_id
        WHERE l.request_time >= ? AND l.request_time <= ?
        ORDER BY l.request_time DESC
        LIMIT ?
      `, [startDate, endDate, limit]);
      return rows;
    } catch (error) {
      console.error('기간별 로그 조회 오류:', error);
      throw error;
    }
  }

  // 로그 통계
  static async getStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as total_logs,
          COUNT(DISTINCT user_id) as active_users,
          COUNT(DISTINCT action_type) as action_types,
          DATE(MAX(request_time)) as latest_log_date,
          DATE(MIN(request_time)) as earliest_log_date
        FROM tb_log
      `);
      return rows[0] || null;
    } catch (error) {
      console.error('로그 통계 조회 오류:', error);
      throw error;
    }
  }

  // 액션 타입별 통계
  static async getActionTypeStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          action_type,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users,
          DATE(MAX(request_time)) as latest_occurrence
        FROM tb_log
        GROUP BY action_type
        ORDER BY count DESC
      `);
      return rows;
    } catch (error) {
      console.error('액션 타입별 통계 조회 오류:', error);
      throw error;
    }
  }

  // 사용자별 활동 통계
  static async getUserActivityStats(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          action_type,
          COUNT(*) as count,
          DATE(MAX(request_time)) as last_action,
          DATE(MIN(request_time)) as first_action
        FROM tb_log
        WHERE user_id = ?
        GROUP BY action_type
        ORDER BY count DESC
      `, [userId]);
      return rows;
    } catch (error) {
      console.error('사용자 활동 통계 조회 오류:', error);
      throw error;
    }
  }

  // 오래된 로그 정리 (관리자용)
  static async deleteOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const [result] = await pool.execute(
        'DELETE FROM tb_log WHERE request_time < ?',
        [cutoffDate]
      );
      
      return result.affectedRows;
    } catch (error) {
      console.error('오래된 로그 삭제 오류:', error);
      throw error;
    }
  }

  // 최근 활동 로그 조회
  static async getRecentActivity(limit = 20) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          l.action_type,
          l.request_time,
          l.details,
          u.login_id
        FROM tb_log l
        LEFT JOIN tb_user u ON l.user_id = u.user_id
        WHERE l.action_type IN ('login', 'logout', 'analysis_request', 'insight_create')
        ORDER BY l.request_time DESC
        LIMIT ?
      `, [limit]);
      return rows;
    } catch (error) {
      console.error('최근 활동 로그 조회 오류:', error);
      throw error;
    }
  }
}

module.exports = Log;