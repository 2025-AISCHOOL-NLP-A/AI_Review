// src/components/Memberupdate.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "../styles/memberupdate.css";
import "../styles/common.css";

function Memberupdate() {
  const navigate = useNavigate();

  // 프로필 기본값 불러오기
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "", // 고정
    current_password: "", // 확인용
    new_password: "", // 변경용
    new_password_confirm: "",

    current_email: "", // 고정
    new_email_prefix: "", // 변경용(아이디 부분)
    email_domain: "gmail.com", // ← 기존 select 유지
    email_code: "", // 인증번호
  });

  const [isEmailSent, setIsEmailSent] = useState(false);

  useEffect(() => {
    // 현재 로그인 사용자 정보 조회
    (async () => {
      try {
        const me = await authService.getMe(); // { user_id, email }
        setFormData((p) => ({
          ...p,
          user_id: me?.user_id || "",
          current_email: me?.email || "",
        }));
      } catch (e) {
        alert("프로필 정보를 불러오지 못했습니다.");
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // 새 비밀번호 유효성 (영문/숫자/특수문자 8~20)
  const pwPattern =
    /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,20}$/;

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
      } else {
        alert(res.message || "인증 메일 발송에 실패했습니다.");
      }
    } catch {
      alert("인증 메일 발송 중 오류가 발생했습니다.");
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
        navigate("/login");
      } else {
        alert(res.message || "수정에 실패했습니다.");
      }
    } catch (err) {
      setLoading(false);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  return (
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
              <input
                type="password"
                name="current_password"
                className="form-input"
                placeholder="기존 비밀번호"
                value={formData.current_password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* 새 비밀번호 */}
          <div className="form-group">
            <div className="input-with-icon">
              <div className="form-icon">
                <img src="/images/password_icon.png" alt="새 비밀번호 아이콘" />
              </div>
              <input
                type="password"
                name="new_password"
                className="form-input"
                placeholder="비밀번호 수정"
                value={formData.new_password}
                onChange={handleChange}
              />
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
              <input
                type="password"
                name="new_password_confirm"
                className="form-input"
                placeholder="수정된 비밀번호 확인"
                value={formData.new_password_confirm}
                onChange={handleChange}
              />
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
              >
                인증하기
              </button>
            </div>
          </div>

          {/* 이메일 인증번호 입력 (발송 후 표시) */}
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
                  placeholder="이메일 인증번호"
                  value={formData.email_code}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <button type="submit" className="join-button" disabled={loading}>
            {loading ? "저장 중..." : "저장"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Memberupdate;

