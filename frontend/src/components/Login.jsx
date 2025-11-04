import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/login.css';
import '../styles/common.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    login_id: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.login_id || !formData.password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      setLoading(false);
      return;
    }

    const result = await authService.login(formData.login_id, formData.password);

    setLoading(false);

    if (result.success) {
      console.log('로그인 성공:', result.data);
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-page">
      <div className="left-section"></div>
      <div className="right-section">
        <div className="login-container">
          <div className="logo">
            <img src="/images/logo.png" alt="logo" />
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <div className="form-icon">
                <img src="/images/id_icon.png" alt="아이디 아이콘" />
              </div>
              <input
                type="text"
                name="login_id"
                className="form-input"
                placeholder="아이디"
                value={formData.login_id}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
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

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <div className="form-footer">
              <Link to="/login/find">아이디 / 비밀번호 찾기</Link>
              <Link to="/login/join">회원가입</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
