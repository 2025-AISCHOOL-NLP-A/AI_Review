# Docker 개념 정리

## 핵심 질문: 로컬에 설치되나요?

**답: 아니요! 컨테이너 안에 설치됩니다.**

## 어디에 뭐가 설치되는가?

### 로컬 (내 컴퓨터)
```
AI_Review/
├── frontend/
│   ├── src/           ← 코드 (마운트됨)
│   └── package.json   ← 패키지 목록
├── backend/
│   ├── src/           ← 코드 (마운트됨)
│   └── package.json   ← 패키지 목록
└── model_server/
    ├── app/           ← 코드 (마운트됨)
    ├── models/        ← 모델 파일 (마운트됨)
    └── requirements.txt ← 패키지 목록
```

### Docker 이미지 (빌드 시 생성)
```
frontend 이미지
├── Node.js 18
├── npm packages (react, vite 등)
└── /app/node_modules/

backend 이미지
├── Node.js 18
├── npm packages (express 등)
└── /app/node_modules/

model-server 이미지
├── Python 3.10
├── pip packages (torch, transformers 등)
└── /usr/local/lib/python3.10/site-packages/
```

### Docker 컨테이너 (실행 시)
```
컨테이너 = 이미지 + 마운트된 로컬 폴더

frontend 컨테이너
├── [이미지] Node.js + packages
└── [마운트] ./frontend → /app (코드)

backend 컨테이너
├── [이미지] Node.js + packages
└── [마운트] ./backend → /app (코드)

model-server 컨테이너
├── [이미지] Python + packages
└── [마운트] ./model_server → /app (코드 + 모델)
```

## 동작 방식

### 1. 빌드 (처음 한 번)
```bash
docker-compose -f docker-compose.dev.yml up --build
```

**무슨 일이 일어나나?**
1. Dockerfile.dev 읽기
2. 기본 이미지 다운로드 (Python 3.10, Node 18)
3. requirements.txt / package.json 복사
4. **패키지 설치 → 이미지에 저장**
5. 이미지 생성 완료

**결과:**
- 로컬: 변화 없음 (패키지 설치 안 됨)
- 이미지: 패키지 설치됨
- 시간: 5-10분

### 2. 실행 (두 번째부터)
```bash
docker-compose -f docker-compose.dev.yml up
```

**무슨 일이 일어나나?**
1. 이미지에서 컨테이너 생성
2. 로컬 폴더를 컨테이너에 마운트
3. 서버 시작

**결과:**
- 로컬: 변화 없음
- 컨테이너: 이미지의 패키지 + 로컬 코드 사용
- 시간: 10초

### 3. 코드 수정
```bash
# 아무 명령어 필요 없음
```

**무슨 일이 일어나나?**
1. 로컬 파일 수정
2. 마운트로 연결되어 있어서 컨테이너에 즉시 반영
3. nodemon/uvicorn --reload가 자동 재시작

**결과:**
- 빌드 불필요
- 즉시 반영
- 시간: 0초

### 4. 패키지 추가
```bash
# requirements.txt 또는 package.json 수정 후
docker-compose -f docker-compose.dev.yml up --build
```

**무슨 일이 일어나나?**
1. 이미지 재빌드
2. 새로운 패키지 설치
3. 새 이미지로 컨테이너 재시작

**결과:**
- 이미지 업데이트
- 시간: 패키지 설치 시간만큼

## 비유로 이해하기

### 이미지 = 설치 CD
```
- 운영체제 (Python, Node.js)
- 프로그램들 (패키지)
- 한 번 만들면 계속 사용
```

### 컨테이너 = 실행 중인 컴퓨터
```
- CD로 부팅한 컴퓨터
- 외장 하드(로컬 폴더)를 연결해서 사용
- 끄고 켜도 외장 하드 내용은 그대로
```

### 볼륨 마운트 = 외장 하드 연결
```
- 로컬 폴더를 컨테이너에 연결
- 양쪽에서 같은 파일 보임
- 한쪽에서 수정하면 다른 쪽에도 반영
```

## 실제 예시

### Frontend 코드 수정
```javascript
// 로컬: frontend/src/App.jsx 수정
function App() {
  return <h1>Hello Docker!</h1>  // 수정
}
```

**흐름:**
1. 로컬 파일 저장
2. 볼륨 마운트로 컨테이너에 즉시 반영
3. Vite HMR이 감지하고 브라우저 새로고침
4. 빌드 불필요!

### 패키지 추가
```bash
# 로컬: frontend/package.json에 axios 추가
{
  "dependencies": {
    "axios": "^1.6.0"  // 추가
  }
}
```

**흐름:**
1. package.json 수정
2. `docker-compose -f docker-compose.dev.yml up --build` 실행
3. 이미지 재빌드 (axios 설치)
4. 새 이미지로 컨테이너 재시작

## 장점 정리

### 로컬에 설치 안 함
- 아나콘다 가상환경 불필요
- Node.js 버전 충돌 없음
- 깨끗한 로컬 환경

### 이미지에 패키지 저장
- 한 번 빌드하면 계속 사용
- 빠른 시작 (두 번째부터)
- 팀원들과 동일한 환경

### 코드는 로컬에서 마운트
- 즉시 반영
- 빌드 불필요
- 익숙한 에디터 사용

## 자주 묻는 질문

### Q: 로컬에 Python/Node.js 설치 필요한가요?
**A: 아니요!** Docker만 있으면 됩니다.

### Q: 패키지가 로컬에 설치되나요?
**A: 아니요!** 이미지 안에 설치됩니다.

### Q: 모델 파일은 어디에?
**A: 로컬에 그대로!** 마운트로 연결만 합니다.

### Q: 코드 수정하면 빌드해야 하나요?
**A: 아니요!** 즉시 반영됩니다.

### Q: 패키지 추가하면 빌드해야 하나요?
**A: 네!** 이미지를 재빌드해야 합니다.

### Q: 빌드 시간이 오래 걸리나요?
**A: 처음만!** 두 번째부터는 캐시 사용으로 빠릅니다.

## 결론

**개발용 Docker 설정:**
- 패키지 → 이미지에 (한 번 빌드)
- 코드 → 로컬에서 마운트 (즉시 반영)
- 로컬 환경 → 깨끗하게 유지
- 배포 → 똑같은 환경으로 쉽게
