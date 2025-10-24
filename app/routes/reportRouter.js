const express = require('express');
const router = express.Router();

// 인증 미들웨어
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// 리포트 메인 페이지
router.get('/', requireAuth, (req, res) => {
  const analysisHistory = [
    { id: 1, title: '카페 리뷰 분석', date: '2024-10-20' },
    { id: 2, title: '레스토랑 리뷰 분석', date: '2024-10-19' },
    { id: 3, title: '호텔 리뷰 분석', date: '2024-10-18' }
  ];

  res.render('report', { 
    user: req.session.user,
    analysisHistory,
    currentAnalysis: null
  });
});

// 특정 분석 리포트 보기
router.get('/:id', requireAuth, (req, res) => {
  const analysisId = req.params.id;
  
  const analysisHistory = [
    { id: 1, title: '카페 리뷰 분석', date: '2024-10-20' },
    { id: 2, title: '레스토랑 리뷰 분석', date: '2024-10-19' },
    { id: 3, title: '호텔 리뷰 분석', date: '2024-10-18' }
  ];

  // 샘플 분석 결과
  const currentAnalysis = {
    id: analysisId,
    title: `분석 리포트 #${analysisId}`,
    summary: '전체적으로 긍정적인 리뷰가 많으며, 서비스 품질에 대한 만족도가 높습니다.',
    sentiment: { positive: 65, neutral: 25, negative: 10 },
    keywords: ['친절한 서비스', '맛있는 음식', '깨끗한 환경', '합리적인 가격'],
    insights: [
      '고객들은 특히 직원의 친절함을 높이 평가합니다.',
      '음식 품질에 대한 만족도가 매우 높습니다.',
      '청결도 관리가 잘 되어 있다는 평가가 많습니다.'
    ]
  };

  res.render('report', { 
    user: req.session.user,
    analysisHistory,
    currentAnalysis
  });
});

// 새로운 분석 요청
router.post('/analyze', requireAuth, (req, res) => {
  const { reviewText } = req.body;
  
  // 실제로는 AI 분석 API 호출
  // 여기서는 샘플 응답 반환
  const analysisResult = {
    id: Date.now(),
    title: '새로운 리뷰 분석',
    summary: 'AI 분석이 완료되었습니다.',
    sentiment: { positive: 70, neutral: 20, negative: 10 },
    keywords: ['좋은 서비스', '만족', '추천'],
    insights: ['전반적으로 긍정적인 반응을 보입니다.']
  };

  res.json(analysisResult);
});

module.exports = router;