# Docker 설정 가이드

이 문서는 AI Review 프로젝트를 Docker 환경에서 실행하는 방법을 안내합니다.

## 📋 사전 요구사항

- Docker Engine 20.10 이상
- Docker Compose 2.0 이상
- 최소 4GB RAM (권장 8GB)
- 최소 10GB 디스크 공간

## 🚀 빠른 시작

### 1. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값을 수정합니다:

```bash
cp .env.example .env
```

`.env` 파일에서 다음 항목들을 수정하세요:

```env
# 보안을 위해 반드시 변경해야 할 항목들
DB_ROOT_PASSWORD=your_secure_root_password
DB_PASSWORD=your_secure_db_password
JWT_SECRET=your_very_long_random_jwt_secret_key

# 선택사항 (이메일 인증 기능 사용 시)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# 선택사항 (AI 인사이트 생성 기능 사용 시)
OPENAI_API_KEY=sk-your-openai-api-key
```

### 2. Docker 이미지 빌드 및 실행

전체 스택을 한 번에 시작:

```bash
docker-compose up -d
```

빌드부터 다시 시작:

```bash
docker-compose up -d --build
```

### 3. 서비스 접속

- **Frontend (웹 인터페이스)**: http://localhost:80
- **Backend API**: http://localhost:3001
- **Model Server API 문서**: http://localhost:8000/docs
- **MySQL**: localhost:3306

## 🔧 개별 서비스 관리

### 특정 서비스만 시작

```bash
# MySQL만 시작
docker-compose up -d mysql

# Backend만 시작 (MySQL 자동 시작)
docker-compose up -d backend

# 모든 서비스 시작
docker-compose up -d
```

### 서비스 상태 확인

```bash
# 모든 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 확인
docker-compose logs -f backend
docker-compose logs -f model_server
```

### 서비스 재시작

```bash
# 모든 서비스 재시작
docker-compose restart

# 특정 서비스만 재시작
docker-compose restart backend
```

### 서비스 중지

```bash
# 컨테이너 중지 (볼륨 유지)
docker-compose stop

# 컨테이너 중지 및 제거 (볼륨 유지)
docker-compose down

# 컨테이너, 볼륨 모두 제거 (데이터 삭제됨!)
docker-compose down -v
```

## 🗄️ 데이터베이스 관리

### 초기 데이터베이스 설정

데이터베이스는 컨테이너 시작 시 자동으로 초기화됩니다:
1. `database/AireviewDB.sql` - 스키마 생성
2. `database/seed.sql` - 초기 데이터 (있는 경우)
3. `database/views.sql` - 뷰 생성 (있는 경우)

### 데이터베이스 백업

```bash
# 백업 생성
docker exec ai_review_mysql mysqldump -u root -p'rootpassword' ai_review_db > backup.sql

# 또는 환경 변수 사용
docker exec ai_review_mysql mysqldump -u root -p"${DB_ROOT_PASSWORD}" ${DB_NAME} > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 데이터베이스 복원

```bash
# 백업 복원
docker exec -i ai_review_mysql mysql -u root -p'rootpassword' ai_review_db < backup.sql
```

### 데이터베이스 접속

```bash
# MySQL 컨테이너 접속
docker exec -it ai_review_mysql mysql -u root -p

# 또는 외부에서 접속
mysql -h 127.0.0.1 -P 3306 -u ai_review_user -p
```

## 🐛 문제 해결

### 포트 충돌

다른 서비스가 동일한 포트를 사용 중인 경우, `.env` 파일에서 포트를 변경:

```env
FRONTEND_PORT=8080
BACKEND_PORT=3001
MODEL_SERVER_PORT=8000
DB_PORT=3306
```

### 컨테이너가 시작되지 않을 때

```bash
# 로그 확인
docker-compose logs [service_name]

# 컨테이너 상태 확인
docker-compose ps

# 컨테이너 재빌드
docker-compose up -d --build --force-recreate
```

### 데이터베이스 연결 오류

```bash
# MySQL 컨테이너 헬스체크 확인
docker-compose ps mysql

# MySQL 로그 확인
docker-compose logs mysql

# 데이터베이스가 준비될 때까지 대기 후 재시작
docker-compose restart backend model_server
```

### 메모리 부족

Docker Desktop의 메모리 할당을 늘리거나, 불필요한 컨테이너를 중지:

```bash
# 사용하지 않는 컨테이너 정리
docker system prune -a
```

## 🔒 보안 권장사항

### 프로덕션 환경

1. **강력한 비밀번호 설정**
   - `DB_ROOT_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET` 변경
   - 최소 16자 이상의 무작위 문자열 사용

2. **포트 노출 최소화**
   - MySQL 포트(3306)는 외부에 노출하지 않기
   - `docker-compose.yml`에서 포트 매핑 제거 또는 127.0.0.1:3306:3306으로 변경

3. **네트워크 격리**
   - 프론트엔드는 리버스 프록시(nginx/traefik) 뒤에 배치
   - Backend와 Model Server는 내부 네트워크만 사용

4. **볼륨 권한 설정**
   ```bash
   # 볼륨 디렉토리 권한 확인
   docker exec ai_review_backend ls -la /app
   ```

## 📊 모니터링

### 리소스 사용량 확인

```bash
# 실시간 리소스 사용량
docker stats

# 특정 컨테이너만 확인
docker stats ai_review_backend ai_review_model_server
```

### 헬스체크 상태 확인

```bash
# 헬스체크 상태 확인
docker-compose ps

# 상세 정보 확인
docker inspect --format='{{.State.Health.Status}}' ai_review_backend
```

## 🔄 업데이트 및 배포

### 코드 업데이트 후 재배포

```bash
# 1. 최신 코드 가져오기
git pull

# 2. 이미지 재빌드 및 컨테이너 재시작
docker-compose up -d --build

# 3. 헬스체크 확인
docker-compose ps
```

### 특정 서비스만 업데이트

```bash
# Backend만 재빌드
docker-compose up -d --build backend

# Frontend만 재빌드
docker-compose up -d --build frontend
```

## 🧹 정리

### 개발 중 임시 파일 정리

```bash
# 중지된 컨테이너, 사용하지 않는 이미지, 네트워크 정리
docker system prune

# 볼륨까지 모두 정리 (주의: 데이터 삭제됨!)
docker system prune -a --volumes
```

### 프로젝트 완전 제거

```bash
# 컨테이너, 볼륨, 네트워크 모두 제거
docker-compose down -v

# 이미지까지 제거
docker-compose down -v --rmi all
```

## 📚 추가 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [프로젝트 README](./README.md)

## 🆘 지원

문제가 발생하면 다음을 확인하세요:
1. Docker 버전 확인: `docker --version`
2. Docker Compose 버전 확인: `docker-compose --version`
3. 로그 확인: `docker-compose logs`
4. 헬스체크 상태: `docker-compose ps`


