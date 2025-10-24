const express = require('express');
const router = express.Router();
const User = require('../../models/User');

// 로그인 페이지
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// 로그인 처리
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 입력값 검증
    if (!email || !password) {
      return res.render('login', { error: '이메일과 비밀번호를 모두 입력해주세요.' });
    }

    // 데이터베이스에서 사용자 인증
    const user = await User.authenticate(email, password);
    
    if (user) {
      // 로그인 성공
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name
      };
      console.log(`✅ 로그인 성공: ${user.email}`);
      res.redirect('/dashboard');
    } else {
      // 로그인 실패
      console.log(`❌ 로그인 실패: ${email}`);
      res.render('login', { error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
  } catch (error) {
    console.error('로그인 처리 중 오류:', error);
    res.render('login', { error: '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
  }
});

// 회원가입 페이지 (선택사항)
router.get('/register', (req, res) => {
  res.render('register', { error: null, success: null });
});

// 회원가입 처리 (선택사항)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, confirmPassword } = req.body;
    
    // 입력값 검증
    if (!email || !password || !name || !confirmPassword) {
      return res.render('register', { 
        error: '모든 필드를 입력해주세요.', 
        success: null 
      });
    }

    if (password !== confirmPassword) {
      return res.render('register', { 
        error: '비밀번호가 일치하지 않습니다.', 
        success: null 
      });
    }

    if (password.length < 6) {
      return res.render('register', { 
        error: '비밀번호는 최소 6자 이상이어야 합니다.', 
        success: null 
      });
    }

    // 이메일 중복 확인
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.render('register', { 
        error: '이미 등록된 이메일입니다.', 
        success: null 
      });
    }

    // 사용자 생성
    const newUser = await User.create({ email, password, name });
    console.log(`✅ 회원가입 성공: ${newUser.email}`);
    
    res.render('register', { 
      error: null, 
      success: '회원가입이 완료되었습니다. 로그인해주세요.' 
    });

  } catch (error) {
    console.error('회원가입 처리 중 오류:', error);
    res.render('register', { 
      error: '회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 
      success: null 
    });
  }
});

// 로그아웃
router.get('/logout', (req, res) => {
  const userEmail = req.session.user?.email;
  req.session.destroy((err) => {
    if (err) {
      console.error('로그아웃 중 오류:', err);
    } else {
      console.log(`✅ 로그아웃: ${userEmail}`);
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;