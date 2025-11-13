import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let db;

async function connectDB() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: "utf8mb4",
      connectTimeout: 10000,
      authPlugins: {
        mysql_native_password: () => () => Buffer.alloc(0)
      }
    });
    
    console.log("[DB] MySQL connected successfully");
    return db;
  } catch (error) {
    console.error("[DB] Connection failed:", error.message);
    console.error("[DB] Server will start without database connection");
    console.error("[DB] Please check:");
    console.error("  - DB server is running");
    console.error("  - Network/VPN connection");
    console.error("  - Credentials in .env file");
    return null;
  }
}

// DB 연결 시도 (실패해도 서버는 시작됨)
db = await connectDB();

export default db;