import os
import pymysql
from dotenv import load_dotenv
from dbutils.pooled_db import PooledDB

load_dotenv()

# DB Connection Pool
db_pool = None


def init_db_pool():
    """모델 서버 시작 시 Connection Pool 초기화"""
    global db_pool
    db_pool = PooledDB(
        creator=pymysql,
        maxconnections=10,      # 최대 동시 연결
        mincached=0,            # 시작 시 미리 만드는 연결 없음
        maxcached=5,            # 캐시되는 최대 연결
        blocking=True,          # 여유 없으면 대기
        ping=1,                 # 사용 전 ping으로 검증
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=int(os.getenv("DB_PORT", 3306)),
        charset="utf8mb4",
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
        # 시간 여유: 대량 리뷰 분석 고려
        connect_timeout=60,
        read_timeout=3600,
        write_timeout=3600,
    )
    print("[OK] DB Connection Pool 초기화 완료")


def get_connection():
    """Pool에서 연결 가져오기"""
    if db_pool is None:
        raise Exception("DB Pool이 초기화되지 않았습니다. init_db_pool()를 먼저 호출하세요.")
    return db_pool.connection()


def close_db_pool():
    """종료 시 Pool 정리"""
    global db_pool
    if db_pool:
        db_pool.close()
        db_pool = None
        print("[OK] DB Connection Pool 종료 완료")
