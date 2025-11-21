.PHONY: help build up down restart logs clean dev-up dev-down prod-up prod-down

# 기본 타겟
help:
	@echo "AI Review Docker 명령어 모음"
	@echo ""
	@echo "개발 환경:"
	@echo "  make dev-up       - 개발 환경 시작 (핫 리로드)"
	@echo "  make dev-down     - 개발 환경 중지"
	@echo "  make dev-logs     - 개발 환경 로그 확인"
	@echo ""
	@echo "프로덕션 환경:"
	@echo "  make prod-up      - 프로덕션 환경 시작"
	@echo "  make prod-down    - 프로덕션 환경 중지"
	@echo "  make prod-logs    - 프로덕션 로그 확인"
	@echo ""
	@echo "공통:"
	@echo "  make build        - 이미지 빌드"
	@echo "  make restart      - 서비스 재시작"
	@echo "  make ps           - 컨테이너 상태 확인"
	@echo "  make clean        - 컨테이너 및 볼륨 정리"
	@echo "  make db-backup    - 데이터베이스 백업"
	@echo "  make db-restore   - 데이터베이스 복원"

# 개발 환경
dev-up:
	docker-compose -f docker-compose.dev.yml up -d

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-build:
	docker-compose -f docker-compose.dev.yml build

# 프로덕션 환경
prod-up:
	docker-compose up -d

prod-down:
	docker-compose down

prod-logs:
	docker-compose logs -f

prod-build:
	docker-compose build

# 공통 명령어
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

ps:
	docker-compose ps

# 정리
clean:
	docker-compose down -v
	docker system prune -f

clean-all:
	docker-compose down -v --rmi all
	docker system prune -af

# 데이터베이스 관리
db-backup:
	@echo "데이터베이스 백업 중..."
	@docker exec ai_review_mysql mysqldump -u root -prootpassword ai_review_db > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "백업 완료: backup_$$(date +%Y%m%d_%H%M%S).sql"

db-restore:
	@echo "복원할 백업 파일명을 입력하세요 (예: backup_20240101_120000.sql):"
	@read filename; \
	docker exec -i ai_review_mysql mysql -u root -prootpassword ai_review_db < $$filename
	@echo "복원 완료"

# 개별 서비스 관리
backend-restart:
	docker-compose restart backend

frontend-restart:
	docker-compose restart frontend

model-restart:
	docker-compose restart model_server

mysql-restart:
	docker-compose restart mysql

# 로그 확인
backend-logs:
	docker-compose logs -f backend

frontend-logs:
	docker-compose logs -f frontend

model-logs:
	docker-compose logs -f model_server

mysql-logs:
	docker-compose logs -f mysql

# 컨테이너 접속
backend-shell:
	docker exec -it ai_review_backend sh

model-shell:
	docker exec -it ai_review_model_server bash

mysql-shell:
	docker exec -it ai_review_mysql mysql -u root -p


