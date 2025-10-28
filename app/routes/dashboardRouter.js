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

// 워드클라우드 생성 API
router.post('/api/wordcloud', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: '텍스트가 필요합니다.' });
    }

    // Python AI 서비스 호출
    const response = await fetch('http://localhost:8000/api/wordcloud', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        width: 800,
        height: 400,
        max_words: 50
      })
    });

    if (!response.ok) {
      throw new Error(`AI 서비스 오류: ${response.status}`);
    }

    const result = await response.json();
    res.json(result);

  } catch (error) {
    console.error('워드클라우드 생성 오류:', error);
    res.status(500).json({ 
      error: 'AI 분석 서비스에 연결할 수 없습니다. Python 서버가 실행 중인지 확인해주세요.',
      details: error.message 
    });
  }
});

// 감정 분석 API
router.post('/api/sentiment', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: '텍스트가 필요합니다.' });
    }

    // Python AI 서비스 호출
    const response = await fetch('http://localhost:8000/api/sentiment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text })
    });

    if (!response.ok) {
      throw new Error(`AI 서비스 오류: ${response.status}`);
    }

    const result = await response.json();
    res.json(result);

  } catch (error) {
    console.error('감정 분석 오류:', error);
    res.status(500).json({ 
      error: 'AI 분석 서비스에 연결할 수 없습니다. Python 서버가 실행 중인지 확인해주세요.',
      details: error.message 
    });
  }
});

module.exports = router;