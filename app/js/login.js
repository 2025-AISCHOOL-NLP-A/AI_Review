// 로그인 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // 로그인 폼 제출 처리
  const loginForm = document.querySelector('.login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(loginForm);
      const login_id = formData.get('username');
      const password = formData.get('password');
      
      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login_id: login_id,
            password: password
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // 로그인 성공
          console.log('로그인 성공:', data);
          // 성공 후 wp.html로 이동
          window.location.href = 'wp.html';
        } else {
          // 로그인 실패
          console.error('로그인 실패:', data.message || '로그인에 실패했습니다.');
          alert(data.message || '아이디 또는 비밀번호가 올바르지 않습니다.');
        }
      } catch (error) {
        console.error('로그인 요청 중 오류:', error);
        alert('로그인 요청 중 오류가 발생했습니다.');
      }
    });
  }
});

