#!/bin/bash

# AI Review 데이터베이스 복원 스크립트

set -e

echo "================================================"
echo "데이터베이스 복원"
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

# 백업 파일 목록 표시
BACKUP_DIR="./backups"
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR)" ]; then
    echo "❌ 백업 파일이 없습니다."
    exit 1
fi

echo "사용 가능한 백업 파일:"
echo ""
ls -lh ${BACKUP_DIR}/backup_*.sql.gz 2>/dev/null || ls -lh ${BACKUP_DIR}/backup_*.sql 2>/dev/null
echo ""

# 백업 파일 선택
read -p "복원할 백업 파일명을 입력하세요: " BACKUP_FILE

if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    echo "❌ 파일을 찾을 수 없습니다: ${BACKUP_DIR}/${BACKUP_FILE}"
    exit 1
fi

# 경고
echo ""
echo "⚠️  경고: 현재 데이터베이스의 모든 데이터가 삭제되고 백업으로 대체됩니다!"
read -p "계속하시겠습니까? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "취소되었습니다."
    exit 0
fi

# 압축 파일인 경우 압축 해제
TEMP_FILE="${BACKUP_FILE}"
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "압축 해제 중..."
    TEMP_FILE="${BACKUP_DIR}/temp_restore.sql"
    gunzip -c "${BACKUP_DIR}/${BACKUP_FILE}" > "${TEMP_FILE}"
else
    TEMP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

# 복원 실행
echo "복원 중..."
docker exec -i ai_review_mysql mysql \
    -u root \
    -p"${DB_ROOT_PASSWORD}" \
    "${DB_NAME}" < "${TEMP_FILE}"

# 임시 파일 정리
if [[ $BACKUP_FILE == *.gz ]]; then
    rm -f "${TEMP_FILE}"
fi

echo ""
echo "✅ 복원 완료!"
echo ""


