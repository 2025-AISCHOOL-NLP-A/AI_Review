import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/login_join.css';
import '../styles/common.css';

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
    } else {
      alert(result.message);
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
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="비밀번호"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* 🔹 비밀번호 확인 */}
          <div className="form-group">
            <div className="input-with-icon">
              <div className="form-icon">
                <img src="/images/password_icon.png" alt="비밀번호 확인 아이콘" />
              </div>
              <input
                type="password"
                name="password_confirm"
                className="form-input"
                placeholder="비밀번호 확인"
                value={formData.password_confirm}
                onChange={handleChange}
                required
              />
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
              <button type="button" className="verify-button" onClick={handleSendEmailCode}>
                인증하기
              </button>
            </div>
          </div>

          {/* 🔹 인증 코드 입력 */}
          {isEmailSent && (
            <div className="form-group">
              <div className="input-with-icon">
                <div className="form-icon">
                  <img src="/images/email_icon.png" alt="이메일 코드 아이콘" />
                </div>
                <input
                  type="text"
                  name="email_code"
                  className="form-input"
                  placeholder="이메일 인증번호 입력"
                  value={formData.email_code}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

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
    </div>
  );
}

export default LoginJoin;