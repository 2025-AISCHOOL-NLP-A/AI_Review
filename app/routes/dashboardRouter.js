const express = require('express');
const router = express.Router();

// 인증 미들웨어
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// 대시보드 메인 페이지
router.get('/', requireAuth, (req, res) => {
  const recentAnalyses = [
    { id: 1, title: '카페 리뷰 분석', date: '2024-10-20', status: '완료' },
    { id: 2, title: '레스토랑 리뷰 분석', date: '2024-10-19', status: '진행중' },
    { id: 3, title: '호텔 리뷰 분석', date: '2024-10-18', status: '완료' }
  ];

  res.render('dashboard', { 
    user: req.session.user,
    recentAnalyses 
  });
});

module.exports = router;