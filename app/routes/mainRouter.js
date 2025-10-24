const express = require('express');
const router = express.Router();

// 메인 페이지 리다이렉트
router.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/auth/login');
  }
});

module.exports = router;