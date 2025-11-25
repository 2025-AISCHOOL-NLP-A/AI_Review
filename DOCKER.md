# Docker 실행 가이드

프로젝트 전체를 Docker로 올리는 방법을 정리했습니다. (Backend, Frontend, Model Server)

## 준비물
- Docker Desktop (또는 Docker CLI)
- 현재 작업 디렉터리: `AI_Review` (여기에 `docker-compose.yml` 존재)

## 빌드 & 실행
```bash
cd AI_Review
# 처음 또는 Dockerfile 변경 후
docker compose build

# 컨테이너 실행 (백그라운드)
docker compose up -d

# 상태 확인
docker compose ps

# 로그 보기 (예: 프런트)
docker compose logs -f frontend
```

## 서비스 포트
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Model Server (API docs): http://localhost:8000/docs

## 주요 설정/볼륨
- 환경변수: 각 서비스 `.env` 사용 (`backend/.env`, `frontend/.env`, `model_server/.env`)
- 워드클라우드 PNG 보존/공유: `model_server/static` 폴더가 컨테이너와 호스트 간 볼륨으로 마운트됨  
  - 기존 PNG를 보이게 하려면 `model_server/static/wordclouds`에 넣어둔 뒤 `docker compose up -d`
  - 새로 생성되는 PNG도 동일 경로에 저장됨
- 폰트: Model Server 컨테이너에 나눔/노토 폰트 설치 + `WORDCLOUD_FONT` 환경변수로 경로 지정

## 흔한 작업 명령어
- 특정 서비스만 재시작: `docker compose up -d backend` (또는 `frontend`, `model_server`)
- 특정 서비스만 빌드: `docker compose build frontend`
- 로그 tail: `docker compose logs -f backend`
- 중지: `docker compose down`
- 이미지/캐시까지 초기화 후 빌드(옵션): `docker compose build --no-cache`

## 트러블슈팅 메모
- 프런트가 재시작 루프/빈 화면: `frontend` 로그 확인 (`Node 20+ 필요`). 캐시 깨끗이 하려면 `docker compose build --no-cache frontend`.
- 워드클라우드 미표시: 
  - Model Server 로그에서 글꼴 경고 없는지 확인 (`docker compose logs -f model_server`)
  - 호스트 `model_server/static/wordclouds`에 PNG가 있는지 확인
  - Backend가 볼륨을 통해 `model_server/static`을 읽는지 확인 (`docker compose exec backend ls /app/model_server/static/wordclouds`)
- DB 연결 문제: `.env`의 DB_HOST/DB_PORT/계정 확인. 필요한 경우 컨테이너에서 `ping`/`nc`로 포트 확인.

## 클린업
- 컨테이너/네트워크만 제거: `docker compose down`
- 컨테이너+볼륨까지 제거: `docker compose down -v` (워드클라우드 PNG까지 지워짐 주의)

