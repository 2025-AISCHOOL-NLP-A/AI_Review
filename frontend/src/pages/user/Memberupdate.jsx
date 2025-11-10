// src/pages/user/Memberupdate.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import Sidebar from "../../components/layout/sidebar/Sidebar";
import Footer from "../../components/layout/Footer/Footer";
import "./memberupdate.css";
import "../dashboard/dashboard.css";
import "../../components/layout/sidebar/sidebar.css";
import "../../styles/common.css";

function Memberupdate() {
  const navigate = useNavigate();

  // 프로필 기본값 불러오기
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "", // 아이디 (고정)
    lgin_id: "", // 고정
    current_password: "", // 확인용
    new_password: "", // 변경용
    new_password_confirm: "",

    current_email: "", // 고정
    new_email_prefix: "", // 변경용(아이디 부분)
    email_domain: "gmail.com", // ← 기존 select 유지
    email_code: "", // 인증번호
  });

  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    // 현재 로그인 사용자 정보 조회
    (async () => {
      try {
        const me = await authService.getMe(); // { id, login_id, email }
        if (isMounted) {
          setFormData((p) => ({
            ...p,
            user_id: me?.login_id || "",
            current_email: me?.email || "",
          }));
        }
      } catch (e) {
        if (isMounted) {
          console.error("프로필 정보 불러오기 오류:", e);
          alert("프로필 정보를 불러오지 못했습니다.");
        }
      }
    })();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // -----------------------------
  // ✅ 타이머 복원 (페이지 로드 시)
  // -----------------------------
  useEffect(() => {
    const savedTimerEndTime = localStorage.getItem('emailVerificationTimerEndUpdate');
    if (savedTimerEndTime) {
      const endTime = parseInt(savedTimerEndTime, 10);
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      if (remaining > 0) {
        setTimer(remaining);
        setIsEmailSent(true);
      } else {
        // 타이머가 이미 만료된 경우
        localStorage.removeItem('emailVerificationTimerEndUpdate');
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // 새 비밀번호 유효성 (영문/숫자/특수문자 8~20)
  const pwPattern =
    /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,20}$/;

  // -----------------------------
  // ✅ 타이머 효과
  // -----------------------------
  useEffect(() => {
    if (timer > 0) {
      // localStorage에 타이머 종료 시간 저장
      const endTime = Date.now() + (timer * 1000);
      localStorage.setItem('emailVerificationTimerEndUpdate', endTime.toString());

      timerRef.current = setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);
    } else {
      // 타이머가 0이 되면 localStorage에서 제거
      localStorage.removeItem('emailVerificationTimerEndUpdate');
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

  // 인증코드 발송 (변경할 이메일 기준)
  const handleSendEmailCode = async () => {
    const { new_email_prefix, email_domain } = formData;
    if (!new_email_prefix.trim()) {
      alert("변경할 이메일을 입력해주세요.");
      return;
    }
    const newEmail = `${new_email_prefix}@${email_domain}`;
    try {
      const res = await authService.sendVerification(newEmail);
      if (res.success) {
        alert("인증 메일이 발송되었습니다. 이메일을 확인해주세요.");
        setIsEmailSent(true);
        setIsEmailVerified(false);
        setTimer(60); // 1분 타이머 시작
        // 타이머 종료 시간을 localStorage에 저장
        const endTime = Date.now() + (60 * 1000);
        localStorage.setItem('emailVerificationTimerEndUpdate', endTime.toString());
      } else {
        alert(res.message || "인증 메일 발송에 실패했습니다.");
      }
    } catch {
      alert("인증 메일 발송 중 오류가 발생했습니다.");
    }
  };

  // 이메일 인증번호 확인
  const handleVerifyEmailCode = async () => {
    if (!formData.email_code.trim()) {
      alert("인증번호를 입력해주세요.");
      return;
    }

    if (!formData.new_email_prefix.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    const newEmail = `${formData.new_email_prefix}@${formData.email_domain}`;
    try {
      const result = await authService.verifyCode(newEmail, formData.email_code);
      if (result.success) {
        alert("이메일 인증이 완료되었습니다.");
        setIsEmailVerified(true);
        // 인증 완료 시 타이머 초기화
        setTimer(0);
        localStorage.removeItem('emailVerificationTimerEndUpdate');
      } else {
        alert(result.message || "인증번호가 일치하지 않습니다.");
        setIsEmailVerified(false);
      }
    } catch {
      alert("인증번호 확인 중 오류가 발생했습니다.");
      setIsEmailVerified(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      current_password,
      new_password,
      new_password_confirm,
      current_email,
      new_email_prefix,
      email_domain,
      email_code,
    } = formData;

    if (!current_password) {
      alert("기존 비밀번호를 입력해주세요.");
      return;
    }

    // 비밀번호 변경 요청 시 검증
    if (new_password || new_password_confirm) {
      if (new_password === current_password) {
        alert("새 비밀번호는 기존 비밀번호와 달라야 합니다.");
        return;
      }
      if (!pwPattern.test(new_password)) {
        alert(
          "비밀번호는 영문, 숫자, 특수문자를 포함하여 8~20자로 입력해주세요."
        );
        return;
      }
      if (new_password !== new_password_confirm) {
        alert("새 비밀번호 확인이 일치하지 않습니다.");
        return;
      }
    }

    // 이메일 변경 요청 시 검증
    let newEmail = null;
    if (new_email_prefix.trim()) {
      newEmail = `${new_email_prefix}@${email_domain}`;
      if (newEmail === current_email) {
        alert("변경할 이메일이 기존 이메일과 같습니다.");
        return;
      }
      if (!isEmailSent) {
        alert("변경 이메일 인증을 먼저 진행해주세요.");
        return;
      }
      if (!isEmailVerified) {
        alert("이메일 인증을 완료해주세요.");
        return;
      }
      if (!email_code.trim()) {
        alert("이메일 인증번호를 입력해주세요.");
        return;
      }
    }

    // 변경 대상이 하나도 없으면 막기
    if (!new_password && !newEmail) {
      alert(
        "변경할 항목이 없습니다. 새 비밀번호 또는 변경할 이메일을 입력해주세요."
      );
      return;
    }

    setLoading(true);
    try {
      // 서버에서 current_password 확인 후, 전달된 항목만 업데이트하도록 설계
      const payload = {
        current_password,
        ...(new_password ? { new_password } : {}),
        ...(newEmail ? { new_email: newEmail, email_code } : {}),
      };
      const res = await authService.updateProfile(payload);
      setLoading(false);

      if (res.success) {
        alert("회원정보가 수정되었습니다. 다시 로그인해야 할 수 있어요.");
        authService.logout();
        navigate("/login");
      } else {
        alert(res.message || "수정에 실패했습니다.");
      }
    } catch (err) {
      setLoading(false);
      console.error("회원정보 수정 중 오류:", err);
      const errorMessage = err.response?.data?.message || "수정 중 오류가 발생했습니다.";
      alert(errorMessage);
    }
  };

  return (
    <div className={`dashboard-page sidebar-open`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="dashboard-wrapper">
        <div className="dashboard-content" style={{ padding: "24px" }}>
          <div className="join-container">
            <div className="logo">
              <img src="/images/logo.png" alt="logo" />
            </div>

            <div className="join-card">
        <form className="join-form" onSubmit={handleSubmit}>
          {/* 아이디 (고정) */}
          <div className="form-group">
            <div className="input-with-icon">
              <div className="form-icon">
                <img src="/images/id_icon.png" alt="아이디 아이콘" />
              </div>
              <input
                type="text"
                name="user_id"
                className="form-input"
                value={formData.user_id}
                placeholder="아이디(고정)"
                readOnly
              />
            </div>
          </div>

          {/* 기존 비밀번호 */}
          <div className="form-group">
            <div className="input-with-icon">
              <div className="form-icon">
                <img
                  src="/images/password_icon.png"
                  alt="기존 비밀번호 아이콘"
                />
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="current_password"
                  className="form-input"
                  placeholder="기존 비밀번호"
                  value={formData.current_password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showCurrentPassword ? (
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

          {/* 새 비밀번호 */}
          <div className="form-group">
            <div className="input-with-icon">
              <div className="form-icon">
                <img src="/images/password_icon.png" alt="새 비밀번호 아이콘" />
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="new_password"
                  className="form-input"
                  placeholder="비밀번호 수정"
                  value={formData.new_password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showNewPassword ? (
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

          {/* 새 비밀번호 확인 */}
          <div className="form-group">
            <div className="input-with-icon">
              <div className="form-icon">
                <img
                  src="/images/password_icon.png"
                  alt="비밀번호 확인 아이콘"
                />
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showNewPasswordConfirm ? "text" : "password"}
                  name="new_password_confirm"
                  className="form-input"
                  placeholder="수정된 비밀번호 확인"
                  value={formData.new_password_confirm}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
                  aria-label={showNewPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showNewPasswordConfirm ? (
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
            • 영문, 숫자, 특수문자를 혼합한 8~20자의 비밀번호를 입력해주세요.
          </div>

          {/* 기존 이메일 (고정) */}
          <div className="form-group">
            <div className="input-with-icon">
              <div className="form-icon">
                <img src="/images/email_icon.png" alt="이메일 아이콘" />
              </div>
              <input
                type="text"
                name="current_email"
                className="form-input"
                placeholder="기존 이메일(고정)"
                value={formData.current_email}
                readOnly
              />
            </div>
          </div>

          {/* 변경할 이메일 (입력 가능) — 도메인 select는 기존 코드 유지 */}
          <div className="form-group">
            <div className="email-input-group">
              <div className="input-with-icon email-input-wrapper">
                <div className="form-icon">
                  <img src="/images/email_icon.png" alt="이메일 아이콘" />
                </div>
                <input
                  type="text"
                  name="new_email_prefix"
                  className="form-input email-input"
                  placeholder="변경할 이메일"
                  value={formData.new_email_prefix}
                  onChange={handleChange}
                />
              </div>

              {/* ==== ⬇️ 이 부분은 요청대로 '그대로' 유지합니다 ⬇️ ==== */}
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
              {/* ==== ⬆️ 그대로 유지 끝 ⬆️ ==== */}

              <button
                type="button"
                className="verify-button"
                onClick={handleSendEmailCode}
                disabled={timer > 0}
              >
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

          <button type="submit" className="join-button" disabled={loading}>
            {loading ? "저장 중..." : "저장"}
          </button>
        </form>
            </div>
          </div>
          
          {/* ===================== FOOTER ===================== */}
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Memberupdate;

