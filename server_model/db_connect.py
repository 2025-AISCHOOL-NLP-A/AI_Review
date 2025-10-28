import pymysql
from dotenv import load_dotenv
import os

# 🔹 .env 파일 로드
load_dotenv()


def get_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "review_insight_system"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )
