const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // 이메일로 사용자 찾기
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM User WHERE email = ?',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('사용자 조회 오류:', error);
      throw error;
    }
  }

  // 사용자 생성
  static async create(userData) {
    try {
      const { email, password, name } = userData;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, login_id) VALUES (?, ?, ?)',
        [email, hashedPassword, name]
      );
    
      return {
        id: result.insertId,
        email,
        name
      };
    } catch (error) {
      console.error('사용자 생성 오류:', error);
      throw error;
    }
  }

  // 비밀번호 검증
  static async validatePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('비밀번호 검증 오류:', error);
      return false;
    }
  }

  // 로그인 인증
  static async authenticate(email, password) {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        return null;
      }

      const isValidPassword = await this.validatePassword(password, user.password);
      if (!isValidPassword) {
        return null;
      }

      // 비밀번호 제외하고 반환
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('인증 오류:', error);
      throw error;
    }
  }

  // 모든 사용자 조회 (관리자용)
  static async findAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT id, email, name, created_at FROM users ORDER BY created_at DESC'
      );
      return rows;
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      throw error;
    }
  }
}

module.exports = User;