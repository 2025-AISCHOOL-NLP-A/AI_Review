import pymysql
import os
from dotenv import load_dotenv
from dbutils.pooled_db import PooledDB

load_dotenv()

# 전역 Connection Pool
db_pool = None


def init_db_pool():
    """앱 시작 시 Connection Pool 초기화"""
    global db_pool
    db_pool = PooledDB(
        creator=pymysql,
        maxconnections=10,      # 최대 연결 수
        mincached=2,            # 최소 유지 연결 수
        maxcached=5,            # 최대 캐시 연결 수
        blocking=True,          # 연결 풀이 가득 찼을 때 대기
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=int(os.getenv("DB_PORT", 3306)),
        charset="utf8mb4",
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
        # 타임아웃 설정 (대량 리뷰 분석 시 긴 처리 시간 고려)
        connect_timeout=60,     # 연결 타임아웃 (60초)
        read_timeout=3600,      # 읽기 타임아웃 (60분 - 대량 리뷰 분석 고려)
        write_timeout=3600,     # 쓰기 타임아웃 (60분 - 대량 리뷰 분석 고려)
    )
    print("✅ DB Connection Pool 초기화 완료")


def get_connection():
    """Pool에서 연결 가져오기"""
    if db_pool is None:
        raise Exception("DB Pool이 초기화되지 않았습니다. init_db_pool()을 먼저 호출하세요.")
    return db_pool.connection()


def close_db_pool():
    """앱 종료 시 Pool 정리"""
    global db_pool
    if db_pool:
        db_pool.close()
        db_pool = None
        print("✅ DB Connection Pool 종료 완료")
