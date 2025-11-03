// 로그인 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // 로그인 폼 제출 처리
  const loginForm = document.querySelector('.login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      // 로그인 처리 로직을 여기에 추가
      console.log('로그인 시도');
    });
  }
});

