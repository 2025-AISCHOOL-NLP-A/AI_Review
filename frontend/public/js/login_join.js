// 회원가입 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
  const joinForm = document.getElementById('joinForm');
  const checkDuplicateBtn = document.getElementById('checkDuplicateBtn');
  const verifyEmailBtn = document.getElementById('verifyEmailBtn');
  const emailCodeGroup = document.getElementById('emailCodeGroup');
  const agreeAll = document.getElementById('agreeAll');
  const agreeTerms = document.getElementById('agreeTerms');
  const agreePrivacy = document.getElementById('agreePrivacy');
  const passwordInput = document.getElementById('password');
  const passwordConfirmInput = document.getElementById('password_confirm');

  let isDuplicateChecked = false;
  let isEmailVerified = false;

  // 아이디 중복 검사
  if (checkDuplicateBtn) {
    checkDuplicateBtn.addEventListener('click', async function() {
      const userId = document.getElementById('user_id').value.trim();
      
      if (!userId) {
        alert('아이디를 입력해주세요.');
        return;
      }

      try {
        const response = await fetch('/auth/check-duplicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId
          })
        });

        const data = await response.json();

        if (response.ok && !data.exists) {
          alert('사용 가능한 아이디입니다.');
          isDuplicateChecked = true;
        } else {
          alert('이미 사용 중인 아이디입니다.');
          isDuplicateChecked = false;
        }
      } catch (error) {
        console.error('중복 검사 중 오류:', error);
        alert('중복 검사 중 오류가 발생했습니다.');
      }
    });
  }

  // 이메일 인증하기
  if (verifyEmailBtn) {
    verifyEmailBtn.addEventListener('click', async function() {
      const emailPrefix = document.getElementById('email_prefix').value.trim();
      const emailDomain = document.getElementById('email_domain').value;
      const email = `${emailPrefix}@${emailDomain}`;

      if (!emailPrefix) {
        alert('이메일을 입력해주세요.');
        return;
      }

      try {
        const response = await fetch('/auth/send-verification', {
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
          alert('인증번호가 이메일로 발송되었습니다.');
          emailCodeGroup.style.display = 'block';
          isEmailVerified = false;
        } else {
          alert(data.message || '이메일 발송 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('이메일 인증 요청 중 오류:', error);
        alert('이메일 인증 요청 중 오류가 발생했습니다.');
      }
    });
  }

  // 전체 동의 체크박스
  if (agreeAll) {
    agreeAll.addEventListener('change', function() {
      agreeTerms.checked = this.checked;
      agreePrivacy.checked = this.checked;
    });
  }

  // 개별 체크박스 변경 시 전체 동의 업데이트
  [agreeTerms, agreePrivacy].forEach(checkbox => {
    if (checkbox) {
      checkbox.addEventListener('change', function() {
        if (agreeAll) {
          agreeAll.checked = agreeTerms.checked && agreePrivacy.checked;
        }
      });
    }
  });

  // 비밀번호 확인 검증
  if (passwordConfirmInput && passwordInput) {
    passwordConfirmInput.addEventListener('input', function() {
      if (this.value && this.value !== passwordInput.value) {
        this.setCustomValidity('비밀번호가 일치하지 않습니다.');
      } else {
        this.setCustomValidity('');
      }
    });
  }

  // 회원가입 폼 제출
  if (joinForm) {
    joinForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      // 중복 검사 확인
      if (!isDuplicateChecked) {
        alert('아이디 중복 검사를 해주세요.');
        return;
      }

      // 비밀번호 일치 확인
      if (passwordInput.value !== passwordConfirmInput.value) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }

      // 비밀번호 유효성 검사
      const passwordPattern = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/;
      if (!passwordPattern.test(passwordInput.value)) {
        alert('비밀번호는 영문, 숫자, 특수문자를 혼합하여 8~20자로 입력해주세요.');
        return;
      }

      // 필수 동의 확인 (체크박스 미동의 시 회원가입 방지)
      if (!agreeTerms.checked) {
        alert('[필수] 이용약관 동의에 체크해주세요.');
        agreeTerms.focus();
        return;
      }

      if (!agreePrivacy.checked) {
        alert('[필수] 개인정보 수집 및 이용 동의에 체크해주세요.');
        agreePrivacy.focus();
        return;
      }

      const formData = new FormData(joinForm);
      const emailPrefix = document.getElementById('email_prefix').value.trim();
      const emailDomain = document.getElementById('email_domain').value;
      const email = `${emailPrefix}@${emailDomain}`;

      const joinData = {
        user_id: formData.get('user_id'),
        password: formData.get('password'),
        email: email,
        email_code: formData.get('email_code') || ''
      };

      try {
        const response = await fetch('/auth/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(joinData)
        });

        const data = await response.json();

        if (response.ok) {
          alert('회원가입이 완료되었습니다.');
          window.location.href = 'login.html';
        } else {
          alert(data.message || '회원가입에 실패했습니다.');
        }
      } catch (error) {
        console.error('회원가입 요청 중 오류:', error);
        alert('회원가입 요청 중 오류가 발생했습니다.');
      }
    });
  }
});

