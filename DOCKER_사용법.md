# Docker 사용 가이드

## 사전 준비

### 1. Docker 설치
- Windows: [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- 설치 후 Docker Desktop 실행 확인

### 2. 환경 변수 설정
```bash
# 루트 디렉토리에 .env 파일 생성
copy .env.example .env

# .env 파일을 열어서 실제 값으로 수정
# 특히 OPENAI_API_KEY는 반드시 설정해야 함
```

## 기본 명령어

### 서버 시작 (처음 실행 또는 코드 변경 후)
```bash
# 이미지 빌드 + 컨테이너 시작
docker-compose up --build

# 백그라운드로 실행
docker-compose up --build -d
```

### 서버 시작 (이미지가 이미 빌드된 경우)
```bash
# 빠른 시작
docker-compose up

# 백그라운드로 실행
docker-compose up -d
```

### 서버 중지
```bash
# 컨테이너 중지
docker-compose stop

# 컨테이너 중지 + 삭제
docker-compose down

# 컨테이너 + 볼륨 + 네트워크 모두 삭제
docker-compose down -v
```

### 서버 재시작
```bash
# 모든 서비스 재시작
docker-compose restart

# 특정 서비스만 재시작
docker-compose restart backend
docker-compose restart model-server
```

## 로그 확인

### 실시간 로그 보기
```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그만
docker-compose logs -f backend
docker-compose logs -f model-server

# 최근 100줄만 보기
docker-compose logs --tail=100 backend
```

### 에러 로그 확인
```bash
# 컨테이너 상태 확인
docker-compose ps

# 특정 컨테이너 로그
docker logs ai-review-backend
docker logs ai-review-model-server
```

## 상태 확인

### 컨테이너 상태
```bash
# Docker Compose로 관리되는 컨테이너 확인
docker-compose ps

# 모든 컨테이너 확인
docker ps

# 중지된 컨테이너 포함
docker ps -a
```

### Health Check 확인
```bash
# 컨테이너 상세 정보 (health 상태 포함)
docker inspect ai-review-backend
docker inspect ai-review-model-server
```

## 개발 중 유용한 명령어

### 컨테이너 내부 접속
```bash
# Backend 컨테이너 접속
docker exec -it ai-review-backend sh

# Model Server 컨테이너 접속
docker exec -it ai-review-model-server bash

# 접속 후 나가기
exit
```

### 특정 서비스만 재빌드
```bash
# Backend만 재빌드
docker-compose up --build backend

# Model Server만 재빌드
docker-compose up --build model-server
```

### 이미지 관리
```bash
# 사용하지 않는 이미지 삭제
docker image prune

# 모든 중지된 컨테이너, 사용하지 않는 네트워크, 이미지 삭제
docker system prune

# 볼륨까지 모두 삭제 (주의!)
docker system prune -a --volumes
```

## 문제 해결

### 1. 포트가 이미 사용 중인 경우
```bash
# 포트 사용 중인 프로세스 확인 (Windows)
netstat -ano | findstr :3001
netstat -ano | findstr :8000

# 프로세스 종료
taskkill /PID [프로세스ID] /F

# 또는 docker-compose.yml에서 포트 변경
ports:
  - "3002:3001"  # 호스트:컨테이너
```

### 2. 컨테이너가 계속 재시작되는 경우
```bash
# 로그 확인
docker-compose logs backend

# 에러 원인 파악 후 코드 수정
# 수정 후 재빌드
docker-compose up --build
```

### 3. DB 연결 실패
```bash
# 환경 변수 확인
docker-compose config

# .env 파일 확인
# DB_HOST, DB_PORT 등이 올바른지 확인

# 네트워크 확인
docker network ls
docker network inspect ai_review_app-network
```

### 4. 이미지 빌드 실패
```bash
# 캐시 없이 처음부터 빌드
docker-compose build --no-cache

# 특정 서비스만
docker-compose build --no-cache backend
```

### 5. 디스크 공간 부족
```bash
# 사용하지 않는 리소스 정리
docker system prune -a

# 볼륨 정리
docker volume prune
```

## Docker의 장점

### 1. 자동 재시작
- `restart: always` 설정으로 에러 발생 시 자동 재시작
- 컴퓨터 재부팅 시에도 자동으로 시작

### 2. Health Check
- 주기적으로 서버 상태 확인
- 문제 발생 시 자동으로 컨테이너 재시작

### 3. 격리된 환경
- 각 서비스가 독립적인 컨테이너에서 실행
- 의존성 충돌 없음

### 4. 이식성
- 어떤 환경에서도 동일하게 실행
- 팀원들과 동일한 환경 공유

### 5. 네트워크
- 서비스 간 자동 DNS 해석
- backend에서 `http://model-server:8000`로 접근 가능

## 프로덕션 배포

### AWS EC2 배포 예시
```bash
# EC2 인스턴스에 Docker 설치
sudo yum update -y
sudo yum install docker -y
sudo service docker start

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 코드 클론
git clone [your-repo]
cd [your-repo]

# .env 파일 설정
nano .env

# 서버 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

## 개발 vs 프로덕션

### 개발 중에는
```bash
# 로그를 보면서 실행
docker-compose up

# 코드 변경 시 재빌드
docker-compose up --build
```

### 프로덕션에서는
```bash
# 백그라운드 실행
docker-compose up -d

# 로그는 필요할 때만
docker-compose logs -f
```

## 주의사항

1. **환경 변수**: .env 파일은 절대 Git에 커밋하지 말 것
2. **볼륨**: 데이터베이스를 Docker로 운영할 경우 볼륨 백업 필수
3. **메모리**: Docker Desktop 설정에서 충분한 메모리 할당
4. **포트**: 호스트의 3001, 8000 포트가 비어있어야 함
5. **빌드 시간**: 처음 빌드는 시간이 걸릴 수 있음 (의존성 다운로드)

## 유용한 팁

### 빠른 재시작
```bash
# 코드만 변경하고 의존성은 그대로인 경우
docker-compose restart
```

### 로그 파일로 저장
```bash
docker-compose logs > logs.txt
```

### 리소스 사용량 확인
```bash
docker stats
```

### 특정 컨테이너만 중지
```bash
docker-compose stop backend
docker-compose start backend
```
