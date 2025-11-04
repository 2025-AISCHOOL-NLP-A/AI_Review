const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const { testConnection, createUserTable } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정 (React 앱과 통신을 위해)
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'], // React 개발 서버 포트
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 세션 설정 (JWT로 변경 예정이지만 일단 유지)
app.use(session({
  secret: 'review-analysis-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// 라우터 설정
const authRouter = require('./app/routes/authRouter');
const productsRouter = require('./app/routes/productsRouter');
const insightsRouter = require('./app/routes/insightsRouter');

// API 라우트 등록
app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/insights', insightsRouter);

// 기본 API 정보
app.get('/', (req, res) => {
  res.json({
    message: 'Review Analysis API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/auth/*',
      products: '/products/*',
      insights: '/insights/*'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'review-analysis-api'
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 서버 시작 및 데이터베이스 초기화
async function startServer() {
  try {
    // 데이터베이스 연결 테스트
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 데이터베이스 연결 실패로 서버를 시작할 수 없습니다.');
      process.exit(1);
    }

    // 사용자 테이블 생성
    await createUserTable();

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 API 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`📋 API 문서: http://localhost:${PORT}/`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/auth/*`);
      console.log(`📦 Products API: http://localhost:${PORT}/products/*`);
      console.log(`💡 Insights API: http://localhost:${PORT}/insights/*`);
    });

  } catch (error) {
    console.error('❌ 서버 시작 중 오류:', error);
    process.exit(1);
  }
}

startServer();