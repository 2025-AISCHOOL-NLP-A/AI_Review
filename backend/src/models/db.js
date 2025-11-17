import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
  // 연결 풀 설정
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 타임아웃 설정
  acquireTimeout: 60000, // 60초
  timeout: 60000, // 60초
  // 재연결 설정
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// 연결 풀 이벤트 리스너
db.on("connection", (connection) => {
  console.log("✅ 새로운 DB 연결 생성");
});

db.on("error", (err) => {
  console.error("❌ DB 연결 풀 오류:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("🔄 DB 연결이 끊어졌습니다. 자동 재연결 시도...");
  }
});

console.log("✅ MySQL 연결 풀 초기화 완료");

export default db;