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
      navigate('/main');
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
