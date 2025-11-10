import React, { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../../services/authService";
import Footer from "../../components/layout/Footer/Footer";
import "./login_find.css";
import "../../styles/common.css";

function LoginFind() {
  const [findIdData, setFindIdData] = useState({ email: "" });
  const [findPasswordData, setFindPasswordData] = useState({
    login_id: "",
    email: "",
  });

  const [findIdResult, setFindIdResult] = useState(null);
  const [findPasswordResult, setFindPasswordResult] = useState(null);
  const [loading, setLoading] = useState({
    findId: false,
    findPassword: false,
  });

  const handleFindIdChange = (e) => {
    setFindIdData({ email: e.target.value });
    setFindIdResult(null);
  };

  const handleFindPasswordChange = (e) => {
    setFindPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setFindPasswordResult(null);
  };

  const handleFindId = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, findId: true }));

    try {
      const result = await authService.findId(findIdData.email);
      if (result.success) {
        setFindIdResult({
          success: true,
          loginId: result.loginId,
          message: result.message,
        });
      } else {
        setFindIdResult({ success: false, message: result.message });
      }
    } catch (err) {
      setFindIdResult({
        success: false,
        message: "요청 중 오류가 발생했습니다.",
      });
    } finally {
      setLoading((prev) => ({ ...prev, findId: false }));
    }
  };

  const handleFindPassword = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, findPassword: true }));

    try {
      const result = await authService.findPassword(
        findPasswordData.login_id,
        findPasswordData.email
      );

      if (result.success) {
        setFindPasswordResult({
          success: true,
          message: result.message,
        });
      } else {
        setFindPasswordResult({
          success: false,
          message: result.message,
        });
      }
    } catch (err) {
      setFindPasswordResult({
        success: false,
        message: "요청 중 오류가 발생했습니다.",
      });
    } finally {
      setLoading((prev) => ({ ...prev, findPassword: false }));
    }
  };

  return (
    <div className="find-page">
      <div className="left-section"></div>
      <div className="right-section">
        <div className="find-container">
          <Link to="/" className="logo">
            <img src="/images/logo.png" alt="logo" />
          </Link>

          {/* 아이디 찾기 */}
          <div className="find-card">
            <h2 className="card-title">아이디 찾기</h2>
            <form className="find-form" onSubmit={handleFindId}>
              <div className="form-group">
                <div className="input-with-icon">
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
              </div>

              <button
                type="submit"
                className="find-button"
                disabled={loading.findId}
              >
                {loading.findId ? "찾는 중..." : "아이디 찾기"}
              </button>

              {findIdResult && (
                <div
                  className={`result-message ${
                    findIdResult.success ? "success" : "error"
                  }`}
                >
                  {findIdResult.success ? (
                    <>
                      <p>{findIdResult.message}</p>
                      {findIdResult.loginId && (
                        <p>
                          <strong>아이디: {findIdResult.loginId}</strong>
                        </p>
                      )}
                    </>
                  ) : (
                    <p>{findIdResult.message}</p>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="divider"></div>

          {/* 비밀번호 찾기 */}
          <div className="find-card">
            <h2 className="card-title">비밀번호 찾기</h2>
            <form className="find-form" onSubmit={handleFindPassword}>
              <div className="form-group">
                <div className="input-with-icon">
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
              </div>

              <div className="form-group">
                <div className="input-with-icon">
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
              </div>

              <button
                type="submit"
                className="find-button"
                disabled={loading.findPassword}
              >
                {loading.findPassword ? "찾는 중..." : "비밀번호 찾기"}
              </button>

              {findPasswordResult && (
                <div
                  className={`result-message ${
                    findPasswordResult.success ? "success" : "error"
                  }`}
                >
                  <p>{findPasswordResult.message}</p>
                </div>
              )}
            </form>
          </div>

          <div className="form-footer">
            <Link to="/login">로그인</Link>
            <Link to="/login/join">회원가입</Link>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default LoginFind;
