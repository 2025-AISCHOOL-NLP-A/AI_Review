const mysql = require('mysql2/promise');

// 데이터베이스 연결 설정
// const dbConfig = {
//     host: 'project-db-campus.smhrd.com',
//     port: 3312,
//     user: 'Insa6_aiNLP_p3_1',
//     password: 'password',
//     database: 'database',
//     charset: 'utf8mb4',
//     connectionLimit: 10
// };

const dbConfig = {
    host: 'localhost',       // or the IP/domain of your DB server
    port: 3306,              // default MariaDB/MySQL port
    user: 'root',            // your database username
    password: '1234',        // your password
    database: 'testdb',      // the DB you want to use
    charset: 'utf8mb4',      // recommended for full Unicode support
    connectionLimit: 10      // number of pooled connections
};

// 연결 풀 생성
const pool = mysql.createPool(dbConfig);

// 데이터베이스 연결 테스트 함수
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL 데이터베이스 연결 성공');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL 데이터베이스 연결 실패:', error.message);
        return false;
    }
}

// 사용자 테이블 생성 (존재하지 않는 경우)
async function createUserTable() {
    try {
        const createTableQuery = `
        CREATE TABLE User (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) NOT NULL,
            login_id VARCHAR(50) NOT NULL,
            password VARCHAR(255) NOT NULL,
            signup_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (login_id),
            UNIQUE (email)
        );
    `;

        await pool.execute(createTableQuery);
        console.log('✅ User 테이블 확인/생성 완료');

        // 기본 테스트 사용자 추가 (존재하지 않는 경우)
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('password', 10);

        const insertUserQuery = `
      INSERT IGNORE INTO User (email, login_id, password)
      VALUES (?, ?, ?)
    `;

        await pool.execute(insertUserQuery, ['admin@example.com', 'test', hashedPassword]);
        console.log('✅ 기본 테스트 사용자 확인/생성 완료');

    } catch (error) {
        console.error('❌ 테이블 생성 중 오류:', error.message);
    }
}

module.exports = {
    pool,
    testConnection,
    createUserTable
};