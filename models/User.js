const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // 비밀번호 해싱
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  // 비밀번호 검증
  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // 이메일로 사용자 찾기
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tb_user WHERE email = ?',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('사용자 이메일 조회 오류:', error);
      throw error;
    }
  }

  // 로그인 ID로 사용자 찾기
  static async findByLoginId(loginId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tb_user WHERE login_id = ?',
        [loginId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('사용자 로그인ID 조회 오류:', error);
      throw error;
    }
  }

  // 사용자 ID로 찾기
  static async findById(userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT user_id, email, login_id, signup_date FROM tb_user WHERE user_id = ?',
        [userId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('사용자 ID 조회 오류:', error);
      throw error;
    }
  }

  // 사용자 생성
  static async create(userData) {
    try {
      const { email, loginId, password } = userData;
      const hashedPassword = await this.hashPassword(password);
      
      const [result] = await pool.execute(
        'INSERT INTO tb_user (email, login_id, password) VALUES (?, ?, ?)',
        [email, loginId, hashedPassword]
      );
      
      return {
        user_id: result.insertId,
        email,
        login_id: loginId
      };
    } catch (error) {
      console.error('사용자 생성 오류:', error);
      throw error;
    }
  }

  // 사용자 정보 수정
  static async update(userId, updateData) {
    try {
      const fields = [];
      const values = [];
      
      if (updateData.email) {
        fields.push('email = ?');
        values.push(updateData.email);
      }
      
      if (updateData.password) {
        fields.push('password = ?');
        values.push(await this.hashPassword(updateData.password));
      }
      
      if (fields.length === 0) {
        throw new Error('수정할 데이터가 없습니다.');
      }
      
      values.push(userId);
      
      const [result] = await pool.execute(
        `UPDATE tb_user SET ${fields.join(', ')} WHERE user_id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('사용자 정보 수정 오류:', error);
      throw error;
    }
  }

  // 사용자 삭제
  static async delete(userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM tb_user WHERE user_id = ?',
        [userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      throw error;
    }
  }

  // 이메일 중복 확인
  static async isEmailExists(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM tb_user WHERE email = ?',
        [email]
      );
      return rows[0].count > 0;
    } catch (error) {
      console.error('이메일 중복 확인 오류:', error);
      throw error;
    }
  }

  // 로그인 ID 중복 확인
  static async isLoginIdExists(loginId) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM tb_user WHERE login_id = ?',
        [loginId]
      );
      return rows[0].count > 0;
    } catch (error) {
      console.error('로그인ID 중복 확인 오류:', error);
      throw error;
    }
  }
}

module.exports = User;