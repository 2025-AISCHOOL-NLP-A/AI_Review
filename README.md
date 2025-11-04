# AI 리뷰 분석 서비스

마이크로서비스 아키텍처 기반의 AI 리뷰 분석 플랫폼입니다.

## 🏗 아키텍처

```
AI_Review/
├── backend/           # Node.js Express API 서버
├── frontend/          # React 웹 애플리케이션  
├── model_server/      # Python FastAPI AI 분석 서버
├── config/           # 공통 설정 파일
├── database/         # 데이터베이스 스키마 및 스크립트
└── docs/            # 프로젝트 문서
```

## 🚀 서비스 구성

### Backend Service (Node.js + Express)
- **역할**: REST API 서버, 사용자 인증, 데이터 관리
- **기술스택**: Node.js, Express, MySQL, bcrypt

### Frontend Service (React)
- **역할**: 웹 사용자 인터페이스
- **기술스택**: React, Bootstrap, Axios

### AI Analysis Service (Python + FastAPI)
- **역할**: 리뷰 분석, 워드클라우드 생성, 감정 분석
- **기술스택**: Python, FastAPI, WordCloud, Jieba

## 📊 데이터베이스
- **테이블**: 사용자, 제품, 리뷰, 키워드, 인사이트 등

## 🛠 설치 및 실행

### 전체 서비스 실행

1. **각 서비스 의존성 설치**
```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install

# AI Service
cd ../model_server
pip install -r requirements.txt
```

2. **서비스 실행**
```bash
# Backend API (터미널 1)
cd backend
npm start

# Frontend Web (터미널 2)
cd frontend
npm start

# AI Analysis (터미널 3)
cd model_server
python main.py
```

3. **접속**
- 웹 애플리케이션: http://localhost:3001
- Backend API: http://localhost:3000
- AI API 문서: http://localhost:8000/docs

## 📋 API 엔드포인트

### 인증 API (/auth)
- `POST /auth/login` - 로그인
- `POST /auth/register` - 회원가입
- `POST /auth/logout` - 로그아웃
- `PUT /auth/update` - 사용자 정보 수정
- `DELETE /auth/delete` - 계정 삭제

### 제품 API (/products)
- `GET /products` - 제품 목록
- `GET /products/{product_id}/` - 제품 대시보드
- `GET /products/{product_id}/reviews` - 제품 리뷰(파라미터로 키워드)
- `POST /products/{product_id}/reviews/analysis` - 해당 상품 리뷰 분석 요청(Python API)
- `DELETE /products/{id}` - 제품 삭제

### 인사이트 API (/insights)
- `GET /insights` - 인사이트 목록(파라미터로 제품 id 받으면 그 제품 리스트만)
- `GET /insights/{id}` - 인사이트 상세
- `POST /insights/request` - 분석 요청(파라미터로 제품 id, 기간, 요청사항등)


## 🔧 개발 환경

- **Node.js**: 18.x 이상
- **Python**: 3.8 이상
- **MySQL**: 8.0 이상
- **Git**: 버전 관리

## 📁 폴더별 상세 정보

각 서비스 폴더의 README.md를 참고하세요:
- [Backend Service](./backend/README.md)
- [Frontend Service](./frontend/README.md)  
- [AI Analysis Service](./model_server/README.md)

## 🤝 기여 방법

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.