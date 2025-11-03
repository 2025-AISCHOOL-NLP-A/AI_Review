// 아이디/비밀번호 찾기 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // 아이디 찾기 폼 처리
  const findIdForm = document.getElementById('findIdForm');
  
  if (findIdForm) {
    findIdForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(findIdForm);
      const email = formData.get('email');
      
      try {
        const response = await fetch('/auth/find-id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          console.log('아이디 찾기 성공:', data);
          alert(data.message || '아이디를 찾았습니다: ' + data.login_id);
        } else {
          console.error('아이디 찾기 실패:', data.message || '아이디 찾기에 실패했습니다.');
          alert(data.message || '일치하는 정보를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('아이디 찾기 요청 중 오류:', error);
        alert('요청 중 오류가 발생했습니다.');
      }
    });
  }

  // 비밀번호 찾기 폼 처리
  const findPasswordForm = document.getElementById('findPasswordForm');
  
  if (findPasswordForm) {
    findPasswordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(findPasswordForm);
      const login_id = formData.get('login_id');
      const email = formData.get('email');
      
      try {
        const response = await fetch('/auth/find-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login_id: login_id,
            email: email
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          console.log('비밀번호 찾기 성공:', data);
          alert(data.message || '비밀번호 재설정 링크를 이메일로 발송했습니다.');
        } else {
          console.error('비밀번호 찾기 실패:', data.message || '비밀번호 찾기에 실패했습니다.');
          alert(data.message || '일치하는 정보를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('비밀번호 찾기 요청 중 오류:', error);
        alert('요청 중 오류가 발생했습니다.');
      }
    });
  }
});

