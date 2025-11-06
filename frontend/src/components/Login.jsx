import React, { useState, useEffect, useRef } from 'react';
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
  const [loginSuccess, setLoginSuccess] = useState(false);
  const errorRef = useRef(''); // 에러 상태를 ref로도 저장

  // 에러 상태를 ref에도 동기화
  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  // 로그인 성공 시 대시보드로 이동
  useEffect(() => {
    if (loginSuccess) {
      // 약간의 지연을 두어 상태 업데이트가 완료된 후 이동
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, navigate]);

  // 이미 로그인된 사용자가 로그인 페이지에 접근하면 dashboard로 리다이렉트
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await authService.getMe();
          // 이미 로그인된 상태이면 dashboard로 리다이렉트
          navigate('/dashboard', { replace: true });
        } catch (error) {
          // 토큰이 유효하지 않으면 로그인 페이지에 머무름
          localStorage.removeItem("token");
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    // 로그인 실패 에러는 유지 - 사용자가 다시 로그인 시도할 때만 초기화
  };


  const handleSubmit = async (e) => {
    // 페이지 새로고침 방지 - 최우선으로 처리
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (e && e.stopImmediatePropagation) {
      e.stopImmediatePropagation();
    }
    
    // 이미 로딩 중이면 중복 실행 방지
    if (loading) {
      return;
    }
    
    setLoading(true);
    // 새로운 로그인 시도 시 이전 에러 초기화
    setError('');

    if (!formData.login_id || !formData.password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const result = await authService.login(formData.login_id, formData.password);

      if (result.success) {
        setError(''); // 성공 시 에러 초기화
        setLoading(false);
        // 로그인 성공 상태 설정하여 useEffect에서 navigate 실행
        setLoginSuccess(true);
        return;
      } else {
        // 로그인 실패 시 에러 설정 - 항상 표시되도록
        const errorMessage = result.message || '잘못된 아이디 또는 비밀번호입니다.';
        setLoading(false);
        // 에러를 명시적으로 설정하고 확인
        setError(errorMessage);
        // formData는 유지됨 (로그인 실패 시에도 ID와 비밀번호가 그대로 남아있음)
        // 새로고침 방지
        return false;
      }
    } catch (error) {
      setLoading(false);
      // 에러 설정 - 항상 표시되도록
      const errorMessage = '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
      // 새로고침 방지
      return false;
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

          <form 
            className="login-form" 
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              return false; // 명시적으로 false 반환
            }}
            noValidate
            action="javascript:void(0)"
          >
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
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
            
            {error && <div className="error-message">{error}</div>}

            <button 
              type="button" 
              className="login-button" 
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) {
                  handleSubmit(e);
                }
              }}
            >
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
