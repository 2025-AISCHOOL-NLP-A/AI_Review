import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import '../../styles/login_join.css';
import '../../styles/common.css';

function LoginJoin() {
  const navigate = useNavigate();

  // -----------------------------
  // ✅ State 정의
  // -----------------------------
  const [formData, setFormData] = useState({
    user_id: '',
    password: '',
    password_confirm: '',
    email_prefix: '',
    email_domain: 'gmail.com',
    email_code: '',
  });

  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
  });

  const [isDuplicateChecked, setIsDuplicateChecked] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // -----------------------------
  // ✅ 타이머 복원 (페이지 로드 시)
  // -----------------------------
  useEffect(() => {
    const savedTimerEndTime = localStorage.getItem('emailVerificationTimerEnd');
    if (savedTimerEndTime) {
      const endTime = parseInt(savedTimerEndTime, 10);
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      if (remaining > 0) {
        setTimer(remaining);
        setIsEmailSent(true);
      } else {
        // 타이머가 이미 만료된 경우
        localStorage.removeItem('emailVerificationTimerEnd');
      }
    }
  }, []);

  // -----------------------------
  // ✅ Input 변경 핸들러
  // -----------------------------
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorMsg('');
  };

  // -----------------------------
  // ✅ 약관 동의 체크박스 핸들러
  // -----------------------------
  const handleCheckboxChange = (name) => {
    if (name === 'all') {
      const newValue = !agreements.all;
      setAgreements({
        all: newValue,
        terms: newValue,
        privacy: newValue,
      });
    } else {
      const newAgreements = {
        ...agreements,
        [name]: !agreements[name],
      };
      newAgreements.all = newAgreements.terms && newAgreements.privacy;
      setAgreements(newAgreements);
    }
  };

  // -----------------------------
  // ✅ 아이디 중복 확인
  // -----------------------------
  const handleCheckDuplicate = async () => {
    if (!formData.user_id.trim()) {
      alert('아이디를 입력해주세요.');
      return;
    }

    const result = await authService.checkDuplicate(formData.user_id);
    if (result.success) {
      if (!result.exists) {
        alert('사용 가능한 아이디입니다.');
        setIsDuplicateChecked(true);
      } else {
        alert('이미 사용 중인 아이디입니다.');
        setIsDuplicateChecked(false);
      }
    } else {
      alert(result.message);
    }
  };

  // -----------------------------
  // ✅ 타이머 효과
  // -----------------------------
  useEffect(() => {
    if (timer > 0) {
      // localStorage에 타이머 종료 시간 저장
      const endTime = Date.now() + (timer * 1000);
      localStorage.setItem('emailVerificationTimerEnd', endTime.toString());

      timerRef.current = setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);
    } else {
      // 타이머가 0이 되면 localStorage에서 제거
      localStorage.removeItem('emailVerificationTimerEnd');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timer]);

  // -----------------------------
  // ✅ 이메일 인증 코드 발송
  // -----------------------------
  const handleSendEmailCode = async () => {
    if (!formData.email_prefix.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }

    const email = `${formData.email_prefix}@${formData.email_domain}`;
    const result = await authService.sendVerification(email);

    if (result.success) {
      alert('인증 메일이 발송되었습니다. 이메일을 확인해주세요.');
      setIsEmailSent(true);
      setIsEmailVerified(false);
      setTimer(60); // 1분 타이머 시작
      // 타이머 종료 시간을 localStorage에 저장
      const endTime = Date.now() + (60 * 1000);
      localStorage.setItem('emailVerificationTimerEnd', endTime.toString());
    } else {
      alert(result.message);
    }
  };

  // -----------------------------
  // ✅ 이메일 인증번호 확인
  // -----------------------------
  const handleVerifyEmailCode = async () => {
    if (!formData.email_code.trim()) {
      alert('인증번호를 입력해주세요.');
      return;
    }

    if (!formData.email_prefix.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }

    const email = `${formData.email_prefix}@${formData.email_domain}`;
    const result = await authService.verifyCode(email, formData.email_code);

    if (result.success) {
      alert('이메일 인증이 완료되었습니다.');
      setIsEmailVerified(true);
      // 인증 완료 시 타이머 초기화
      setTimer(0);
      localStorage.removeItem('emailVerificationTimerEnd');
    } else {
      alert(result.message || '인증번호가 일치하지 않습니다.');
      setIsEmailVerified(false);
    }
  };

  // -----------------------------
  // ✅ 회원가입 제출
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const { user_id, password, password_confirm, email_prefix, email_domain } = formData;

    if (!isDuplicateChecked) {
      alert('아이디 중복 검사를 해주세요.');
      return;
    }

    if (password !== password_confirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    const passwordPattern = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,20}$/;
    if (!passwordPattern.test(password)) {
      alert('비밀번호는 영문, 숫자, 특수문자를 포함하여 8~20자로 입력해주세요.');
      return;
    }

    if (!isEmailVerified) {
      alert('이메일 인증을 완료해주세요.');
      return;
    }

    if (!agreements.terms || !agreements.privacy) {
      alert('[필수] 약관 및 개인정보 이용에 모두 동의해주세요.');
      return;
    }

    setLoading(true);
    const email = `${email_prefix}@${email_domain}`;
    const result = await authService.join(user_id, password, email);
    setLoading(false);

    if (result.success) {
      alert('회원가입이 완료되었습니다.');
      navigate('/login');
    } else {
      alert(result.message || '회원가입에 실패했습니다.');
    }
  };

  // -----------------------------
  // ✅ 렌더링
  // -----------------------------
  return (
    <div className="join-page">
      <div className="left-section"></div>
      <div className="right-section">
        <div className="join-container">
          <div className="logo">
            <img src="/images/logo.png" alt="logo" />
          </div>

          <div className="join-card">
        <form className="join-form" onSubmit={handleSubmit}>
          {/* 🔹 아이디 */}
          <div className="form-group">
            <div className="input-with-button">
              <div className="input-with-icon">
                <div className="form-icon">
                  <img src="/images/id_icon.png" alt="아이디 아이콘" />
                </div>
                <input
                  type="text"
                  name="user_id"
                  className="form-input"
                  placeholder="아이디"
                  value={formData.user_id}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="button" className="check-button" onClick={handleCheckDuplicate}>
                중복 검사
              </button>
            </div>
          </div>

          {/* 🔹 비밀번호 */}
          <div className="form-group">
            <div className="input-with-icon">
              <div className="form-icon">
                <img src="/images/password_icon.png" alt="비밀번호 아이콘" />
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-input"
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 🔹 비밀번호 확인 */}
          <div className="form-group">
            <div className="input-with-icon">
              <div className="form-icon">
                <img src="/images/password_icon.png" alt="비밀번호 확인 아이콘" />
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showPasswordConfirm ? "text" : "password"}
                  name="password_confirm"
                  className="form-input"
                  placeholder="비밀번호 확인"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  aria-label={showPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPasswordConfirm ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="password-hint">
            • 영문, 숫자, 특수문자를 포함한 8~20자 비밀번호를 입력해주세요.
          </div>

          {/* 🔹 이메일 입력 */}
          <div className="form-group">
            <div className="email-input-group">
              <div className="input-with-icon email-input-wrapper">
                <div className="form-icon">
                  <img src="/images/email_icon.png" alt="이메일 아이콘" />
                </div>
                <input
                  type="text"
                  name="email_prefix"
                  className="form-input email-input"
                  placeholder="이메일"
                  value={formData.email_prefix}
                  onChange={handleChange}
                  required
                />
              </div>
              <span className="email-at">@</span>
              <select
                name="email_domain"
                className="form-select"
                value={formData.email_domain}
                onChange={handleChange}
              >
                <option value="gmail.com">gmail.com</option>
                <option value="naver.com">naver.com</option>
                <option value="daum.net">daum.net</option>
                <option value="kakao.com">kakao.com</option>
              </select>
              <button type="button" className="verify-button" onClick={handleSendEmailCode} disabled={timer > 0}>
                인증하기
              </button>
            </div>
            {timer > 0 && (
              <div className="email-timer">
                남은 시간: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
              </div>
            )}
          </div>

          {/* 🔹 인증 코드 입력 */}
          <div className="form-group">
            <div className="input-with-button">
              <div className="input-with-icon">
                <div className="form-icon">
                  <img src="/images/email_icon.png" alt="이메일 코드 아이콘" />
                </div>
                <input
                  type="text"
                  name="email_code"
                  className="form-input"
                  placeholder={isEmailSent ? "이메일 인증번호 입력" : "인증하기 버튼을 먼저 눌러주세요"}
                  value={formData.email_code}
                  onChange={handleChange}
                  disabled={!isEmailSent}
                  style={{
                    backgroundColor: !isEmailSent ? '#f3f4f6' : 'transparent',
                    cursor: !isEmailSent ? 'not-allowed' : 'text'
                  }}
                />
              </div>
              <button 
                type="button" 
                className="check-button" 
                onClick={handleVerifyEmailCode}
                disabled={!isEmailSent || isEmailVerified}
                style={{ 
                  backgroundColor: isEmailVerified ? '#10B981' : (!isEmailSent ? '#9ca3af' : '#3b82f6'),
                  cursor: (!isEmailSent || isEmailVerified) ? 'not-allowed' : 'pointer'
                }}
              >
                {isEmailVerified ? '✓ 인증완료' : '확인'}
              </button>
            </div>
          </div>

          {/* 🔹 약관 동의 */}
          <div className="agreement-section">
            <div className="agreement-item">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="agreeAll"
                  className="checkbox-input"
                  checked={agreements.all}
                  onChange={() => handleCheckboxChange('all')}
                />
                <label htmlFor="agreeAll" className="checkbox-label">전체 동의하기</label>
              </div>
              <p className="agreement-desc">모든 약관 및 개인정보 수집 동의가 포함됩니다.</p>
            </div>

            <div className="agreement-item">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  className="checkbox-input"
                  checked={agreements.terms}
                  onChange={() => handleCheckboxChange('terms')}
                  required
                />
                <label htmlFor="agreeTerms" className="checkbox-label">[필수] 이용약관 동의</label>
              </div>
              <textarea className="terms-textarea" readOnly>
                이용약관 내용이 여기에 표시됩니다.
              </textarea>
            </div>

            <div className="agreement-item">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="agreePrivacy"
                  className="checkbox-input"
                  checked={agreements.privacy}
                  onChange={() => handleCheckboxChange('privacy')}
                  required
                />
                <label htmlFor="agreePrivacy" className="checkbox-label">[필수] 개인정보 수집 및 이용 동의</label>
              </div>
              <textarea className="terms-textarea" readOnly>
                개인정보 수집 및 이용 동의 내용이 여기에 표시됩니다.
              </textarea>
            </div>
          </div>

          {/* 🔹 제출 버튼 */}
          <button type="submit" className="join-button" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
      </div>

      <div className="form-footer">
        <Link to="/login">로그인</Link>
        <Link to="/login/find">아이디 / 비밀번호 찾기</Link>
      </div>
        </div>
      </div>
    </div>
  );
}

export default LoginJoin;

