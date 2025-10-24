const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { testConnection, createUserTable } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// 세션 설정
app.use(session({
  secret: 'review-analysis-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// EJS 템플릿 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 라우터 설정
const authRouter = require('./app/routes/authRouter');
const dashboardRouter = require('./app/routes/dashboardRouter');
const reportRouter = require('./app/routes/reportRouter');

app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/report', reportRouter);

// 메인 페이지 리다이렉트
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/auth/login');
  }
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
      console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`📱 로그인 페이지: http://localhost:${PORT}/auth/login`);
      console.log(`📊 대시보드: http://localhost:${PORT}/dashboard`);
    });

  } catch (error) {
    console.error('❌ 서버 시작 중 오류:', error);
    process.exit(1);
  }
}

startServer();