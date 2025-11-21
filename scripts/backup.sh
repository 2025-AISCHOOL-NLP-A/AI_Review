#!/bin/bash

# AI Review 데이터베이스 백업 스크립트

set -e

echo "================================================"
echo "데이터베이스 백업"
echo "================================================"

# 컨테이너 확인
if ! docker ps | grep -q ai_review_mysql; then
    echo "❌ MySQL 컨테이너가 실행 중이지 않습니다."
    exit 1
fi

# .env 파일에서 설정 읽기
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD:-rootpassword}
DB_NAME=${DB_NAME:-ai_review_db}

# 백업 디렉토리 생성
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# 백업 파일명 생성
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

echo "백업 중..."
echo "파일명: $BACKUP_FILE"

# 백업 실행
docker exec ai_review_mysql mysqldump \
    -u root \
    -p"${DB_ROOT_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    "${DB_NAME}" > "${BACKUP_FILE}"

# 압축
echo "압축 중..."
gzip "${BACKUP_FILE}"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo ""
echo "✅ 백업 완료: ${BACKUP_FILE}"
echo "파일 크기: $(du -h ${BACKUP_FILE} | cut -f1)"
echo ""

# 오래된 백업 정리 (7일 이상)
echo "오래된 백업 파일 정리 중..."
find ${BACKUP_DIR} -name "backup_*.sql.gz" -mtime +7 -delete
echo "✅ 7일 이상 된 백업 파일이 삭제되었습니다."
echo ""


