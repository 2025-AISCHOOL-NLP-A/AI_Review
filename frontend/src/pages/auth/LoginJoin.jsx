import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../services/authService";
import Footer from "../../components/layout/Footer/Footer";
import UserIdInput from "../../components/auth/UserIdInput";
import PasswordInput from "../../components/auth/PasswordInput";
import EmailVerification from "../../components/auth/EmailVerification";
import AgreementSection from "../../components/auth/AgreementSection";
import "./login_join.css";
import "../../styles/common.css";

function LoginJoin() {
  const navigate = useNavigate();

  // -----------------------------
  // ✅ State 정의
  // -----------------------------
  const [formData, setFormData] = useState({
    user_id: "",
    password: "",
    password_confirm: "",
    email_prefix: "",
    email_domain: "gmail.com",
    email_code: "",
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
  const [errorMsg, setErrorMsg] = useState("");

  // -----------------------------
  // ✅ Input 변경 핸들러
  // -----------------------------
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorMsg("");
  };

  // -----------------------------
  // ✅ 약관 동의 체크박스 핸들러
  // -----------------------------
  const handleCheckboxChange = (name) => {
    if (name === "all") {
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
      alert("아이디를 입력해주세요.");
      return;
    }

    const result = await authService.checkDuplicate(formData.user_id);
    if (result.success) {
      if (!result.exists) {
        alert("사용 가능한 아이디입니다.");
        setIsDuplicateChecked(true);
      } else {
        alert("이미 사용 중인 아이디입니다.");
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
      alert("이메일을 입력해주세요.");
      return { success: false };
    }

    const email = `${formData.email_prefix}@${formData.email_domain}`;
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await authService.sendVerification(email);

      if (result.success) {
        alert("인증 메일이 발송되었습니다. 이메일을 확인해주세요.");
        setIsEmailSent(true);
        setIsEmailVerified(false);
        return { success: true };
      } else {
        alert(result.message || "이메일 발송에 실패했습니다.");
        setErrorMsg(result.message || "이메일 발송에 실패했습니다.");
        setIsEmailSent(false);
        return { success: false };
      }
    } catch (error) {
      console.error("이메일 발송 처리 중 오류:", error);
      alert("이메일 발송 중 오류가 발생했습니다. 다시 시도해주세요.");
      setErrorMsg("이메일 발송 중 오류가 발생했습니다.");
      setIsEmailSent(false);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // ✅ 이메일 인증번호 확인
  // -----------------------------
  const handleVerifyEmailCode = async () => {
    if (!formData.email_code.trim()) {
      alert("인증번호를 입력해주세요.");
      return { success: false };
    }

    if (!formData.email_prefix.trim()) {
      alert("이메일을 입력해주세요.");
      return { success: false };
    }

    const email = `${formData.email_prefix}@${formData.email_domain}`;
    const result = await authService.verifyCode(email, formData.email_code);

    if (result.success) {
      alert("이메일 인증이 완료되었습니다.");
      setIsEmailVerified(true);
      return { success: true };
    } else {
      alert(result.message || "인증번호가 일치하지 않습니다.");
      setIsEmailVerified(false);
      return { success: false };
    }
  };

  // -----------------------------
  // ✅ 회원가입 제출
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const { user_id, password, password_confirm, email_prefix, email_domain } =
      formData;

    if (!isDuplicateChecked) {
      alert("아이디 중복 검사를 해주세요.");
      return;
    }

    if (password !== password_confirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    const passwordPattern =
      /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,20}$/;
    if (!passwordPattern.test(password)) {
      alert(
        "비밀번호는 영문, 숫자, 특수문자를 포함하여 8~20자로 입력해주세요."
      );
      return;
    }

    if (!isEmailVerified) {
      alert("이메일 인증을 완료해주세요.");
      return;
    }

    if (!agreements.terms || !agreements.privacy) {
      alert("[필수] 약관 및 개인정보 이용에 모두 동의해주세요.");
      return;
    }

    setLoading(true);
    const email = `${email_prefix}@${email_domain}`;
    const result = await authService.join(user_id, password, email);
    setLoading(false);

    if (result.success) {
      alert("회원가입이 완료되었습니다.");
      navigate("/login");
    } else {
      alert(result.message || "회원가입에 실패했습니다.");
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
          <Link to="/" className="logo">
            <img src="/images/logo.png" alt="logo" />
          </Link>

          <div className="join-card">
            <form className="join-form" onSubmit={handleSubmit}>
              {/* 🔹 아이디 */}
              <UserIdInput
                value={formData.user_id}
                onChange={handleChange}
                onCheckDuplicate={handleCheckDuplicate}
              />

              {/* 🔹 비밀번호 */}
              <div className="form-group">
                <PasswordInput
                  id="join_password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="비밀번호"
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* 🔹 비밀번호 확인 */}
              <div className="form-group">
                <PasswordInput
                  id="join_password_confirm"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  placeholder="비밀번호 확인"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="password-hint">
                • 영문, 숫자, 특수문자를 포함한 8~20자 비밀번호를 입력해주세요.
              </div>

              {/* 🔹 이메일 인증 */}
              <EmailVerification
                emailPrefix={formData.email_prefix}
                emailDomain={formData.email_domain}
                emailCode={formData.email_code}
                onEmailPrefixChange={handleChange}
                onEmailDomainChange={handleChange}
                onEmailCodeChange={handleChange}
                onSendEmailCode={handleSendEmailCode}
                onVerifyEmailCode={handleVerifyEmailCode}
                isEmailSent={isEmailSent}
                isEmailVerified={isEmailVerified}
                loading={loading}
                onEmailSentChange={setIsEmailSent}
              />

              {/* 🔹 약관 동의 */}
              <AgreementSection
                agreements={agreements}
                onCheckboxChange={handleCheckboxChange}
              />

              {/* 🔹 제출 버튼 */}
              <button type="submit" className="join-button" disabled={loading}>
                {loading ? "가입 중..." : "회원가입"}
              </button>
            </form>
          </div>

          <div className="form-footer">
            <Link to="/login">로그인</Link>
            <Link to="/login/find">아이디 / 비밀번호 찾기</Link>
          </div>
        </div>

        {/* ===================== FOOTER ===================== */}
        <Footer />
      </div>
    </div>
  );
}

export default LoginJoin;
