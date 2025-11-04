import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/login_find.css';
import '../styles/common.css';

function LoginFind() {
  const [findIdData, setFindIdData] = useState({ email: '' });
  const [findPasswordData, setFindPasswordData] = useState({ login_id: '', email: '' });
  const [findIdResult, setFindIdResult] = useState(null);
  const [findPasswordResult, setFindPasswordResult] = useState(null);
  const [loading, setLoading] = useState({ findId: false, findPassword: false });

  const handleFindIdChange = (e) => {
    setFindIdData({ email: e.target.value });
    setFindIdResult(null);
  };

  const handleFindPasswordChange = (e) => {
    setFindPasswordData({
      ...findPasswordData,
      [e.target.name]: e.target.value
    });
    setFindPasswordResult(null);
  };

  const handleFindId = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, findId: true });

    const result = await authService.findId(findIdData.email);

    setLoading({ ...loading, findId: false });

    if (result.success) {
      setFindIdResult({ success: true, loginId: result.loginId, message: result.message });
    } else {
      setFindIdResult({ success: false, message: result.message });
    }
  };

  const handleFindPassword = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, findPassword: true });

    const result = await authService.findPassword(findPasswordData.login_id, findPasswordData.email);

    setLoading({ ...loading, findPassword: false });

    if (result.success) {
      setFindPasswordResult({ success: true, message: result.message });
    } else {
      setFindPasswordResult({ success: false, message: result.message });
    }
  };

  return (
    <div className="find-container">
      <div className="logo">
        <img src="/images/logo.png" alt="logo" />
      </div>

      <div className="find-card">
        <h2 className="card-title">아이디 찾기</h2>
        <form className="find-form" onSubmit={handleFindId}>
          <div className="form-group">
            <div className="form-icon">
              <img src="/images/email_icon.png" alt="이메일 아이콘" />
            </div>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="이메일 입력"
              value={findIdData.email}
              onChange={handleFindIdChange}
              required
            />
          </div>
          <button type="submit" className="find-button" disabled={loading.findId}>
            {loading.findId ? '찾는 중...' : '아이디 찾기'}
          </button>
          {findIdResult && (
            <div className={`result-message ${findIdResult.success ? 'success' : 'error'}`}>
              {findIdResult.success ? (
                <div>
                  <p>{findIdResult.message}</p>
                  {findIdResult.loginId && <p><strong>아이디: {findIdResult.loginId}</strong></p>}
                </div>
              ) : (
                <p>{findIdResult.message}</p>
              )}
            </div>
          )}
        </form>
      </div>

      <div className="divider"></div>

      <div className="find-card">
        <h2 className="card-title">비밀번호 찾기</h2>
        <form className="find-form" onSubmit={handleFindPassword}>
          <div className="form-group">
            <div className="form-icon">
              <img src="/images/id_icon.png" alt="아이디 아이콘" />
            </div>
            <input
              type="text"
              name="login_id"
              className="form-input"
              placeholder="아이디 입력"
              value={findPasswordData.login_id}
              onChange={handleFindPasswordChange}
              required
            />
          </div>
          <div className="form-group">
            <div className="form-icon">
              <img src="/images/email_icon.png" alt="이메일 아이콘" />
            </div>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="이메일 입력"
              value={findPasswordData.email}
              onChange={handleFindPasswordChange}
              required
            />
          </div>
          <button type="submit" className="find-button" disabled={loading.findPassword}>
            {loading.findPassword ? '찾는 중...' : '비밀번호 찾기'}
          </button>
          {findPasswordResult && (
            <div className={`result-message ${findPasswordResult.success ? 'success' : 'error'}`}>
              <p>{findPasswordResult.message}</p>
            </div>
          )}
        </form>
      </div>

      <div className="form-footer">
        <Link to="/login/join">회원가입</Link>
      </div>
    </div>
  );
}

export default LoginFind;

