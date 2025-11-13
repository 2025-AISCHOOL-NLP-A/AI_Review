# Docker 빠른 가이드 (개발용)

## 핵심 포인트

**개발할 때는 `docker-compose.dev.yml` 사용!**
- **패키지는 이미지에 설치** (한 번만 빌드)
- **코드는 로컬에서 마운트** (변경사항 즉시 반영)
- 파일 저장하면 **즉시 반영**
- 모델 파일은 로컬에 그대로 두고 마운트만
- **Frontend + Backend + Model Server 모두 한 번에 실행**

## 사용법

### 1. 처음 시작 (딱 한 번만)
```bash
# .env 파일 생성
copy .env.example .env

# .env 파일 열어서 OPENAI_API_KEY 등 설정
notepad .env

# 이미지 빌드 + 개발 서버 시작 (처음 한 번만)
docker-compose -f docker-compose.dev.yml up --build

# 다음부터는 빌드 없이
docker-compose -f docker-compose.dev.yml up
```

### 2. 평소 사용
```bash
# 서버 시작 (백그라운드)
docker-compose -f docker-compose.dev.yml up -d

# 로그 보기
docker-compose -f docker-compose.dev.yml logs -f

# 서버 중지
docker-compose -f docker-compose.dev.yml down
```

### 3. 코드 수정 후
```bash
# 아무것도 안 해도 됨!
# 파일 저장하면 자동으로 반영됨

# Frontend: Vite HMR로 즉시 반영
# Backend: nodemon이 자동 재시작
# Model Server: uvicorn --reload가 자동 재시작
```

### 4. 브라우저에서 확인
```
Frontend: http://localhost:5173
Backend API: http://localhost:3001
Model Server: http://localhost:8000
```

## 장점

✅ **패키지는 이미지에** - 한 번 빌드하면 계속 사용
✅ **코드는 즉시 반영** - 파일 저장하면 바로 적용
✅ **모델 파일 안전** - 로컬에 그대로 유지
✅ **빠른 시작** - 두 번째부터는 빌드 없이 바로 실행
✅ **한 번에 실행** - Frontend, Backend, Model Server 모두 한 명령어로
✅ **로컬 패키지 불필요** - 아나콘다 가상환경 필요 없음

## 주의사항

⚠️ **처음 실행 시 빌드 필요** (5-10분)
```bash
# 처음 한 번만
docker-compose -f docker-compose.dev.yml up --build
```

⚠️ **의존성 변경 시 재빌드 필요** (package.json, requirements.txt)
```bash
# 패키지 추가/변경 후
docker-compose -f docker-compose.dev.yml up --build
```

⚠️ **코드 변경은 빌드 불필요**
- Python, JavaScript 파일 수정 → 즉시 반영
- 빌드 없이 바로 사용

## 프로덕션 배포할 때만

```bash
# 이때만 빌드 사용
docker-compose up --build -d
```

## 자주 쓰는 명령어

```bash
# 시작
docker-compose -f docker-compose.dev.yml up -d

# 중지
docker-compose -f docker-compose.dev.yml down

# 재시작
docker-compose -f docker-compose.dev.yml restart

# 로그
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f model-server

# 상태 확인
docker-compose -f docker-compose.dev.yml ps

# 특정 서비스만 재시작
docker-compose -f docker-compose.dev.yml restart frontend
```

## 문제 해결

### 의존성 에러 발생 시
```bash
# 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart model-server
```

### 완전히 새로 시작
```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### 포트 충돌
```bash
# 기존 프로세스 종료
netstat -ano | findstr :8000
taskkill /PID [프로세스ID] /F
```

## 개발 vs 프로덕션

| 구분 | 개발 (dev) | 프로덕션 (prod) |
|------|-----------|----------------|
| 파일 | docker-compose.dev.yml | docker-compose.yml |
| 빌드 | 불필요 | 필요 |
| 코드 반영 | 즉시 | 재빌드 필요 |
| 속도 | 빠름 | 느림 |
| 안정성 | 낮음 | 높음 |

## 결론

**개발할 때**: `docker-compose.dev.yml` 사용 → 빠르고 편함
**배포할 때**: `docker-compose.yml` 사용 → 안정적
