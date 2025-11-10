import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../services/authService";
import Footer from "../../components/layout/Footer/Footer";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // -----------------------------
  // ✅ 타이머 복원 (페이지 로드 시)
  // -----------------------------
  useEffect(() => {
    const savedTimerEndTime = localStorage.getItem("emailVerificationTimerEnd");
    if (savedTimerEndTime) {
      const endTime = parseInt(savedTimerEndTime, 10);
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      if (remaining > 0) {
        setTimer(remaining);
        setIsEmailSent(true);
      } else {
        // 타이머가 이미 만료된 경우
        localStorage.removeItem("emailVerificationTimerEnd");
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
  // ✅ 타이머 효과
  // -----------------------------
  useEffect(() => {
    if (timer > 0) {
      // localStorage에 타이머 종료 시간 저장
      const endTime = Date.now() + timer * 1000;
      localStorage.setItem("emailVerificationTimerEnd", endTime.toString());

      timerRef.current = setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);
    } else {
      // 타이머가 0이 되면 localStorage에서 제거
      localStorage.removeItem("emailVerificationTimerEnd");
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
      alert("이메일을 입력해주세요.");
      return;
    }

    // 이메일 형식 검증
    const emailPrefix = formData.email_prefix.trim();
    if (emailPrefix.length === 0) {
      alert("이메일을 입력해주세요.");
      return;
    }

    const email = `${emailPrefix}@${formData.email_domain}`;

    // 로딩 상태 설정
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await authService.sendVerification(email);

      if (result.success) {
        alert("인증 메일이 발송되었습니다. 이메일을 확인해주세요.");
        setIsEmailSent(true);
        setIsEmailVerified(false);
        setTimer(60); // 1분 타이머 시작
        // 타이머 종료 시간을 localStorage에 저장
        const endTime = Date.now() + 60 * 1000;
        localStorage.setItem("emailVerificationTimerEnd", endTime.toString());
      } else {
        alert(result.message || "이메일 발송에 실패했습니다.");
        setErrorMsg(result.message || "이메일 발송에 실패했습니다.");
        setIsEmailSent(false);
      }
    } catch (error) {
      console.error("이메일 발송 처리 중 오류:", error);
      alert("이메일 발송 중 오류가 발생했습니다. 다시 시도해주세요.");
      setErrorMsg("이메일 발송 중 오류가 발생했습니다.");
      setIsEmailSent(false);
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
      return;
    }

    if (!formData.email_prefix.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    const email = `${formData.email_prefix}@${formData.email_domain}`;
    const result = await authService.verifyCode(email, formData.email_code);

    if (result.success) {
      alert("이메일 인증이 완료되었습니다.");
      setIsEmailVerified(true);
      // 인증 완료 시 타이머 초기화
      setTimer(0);
      localStorage.removeItem("emailVerificationTimerEnd");
    } else {
      alert(result.message || "인증번호가 일치하지 않습니다.");
      setIsEmailVerified(false);
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
                  <button
                    type="button"
                    className="check-button"
                    onClick={handleCheckDuplicate}
                  >
                    중복 검사
                  </button>
                </div>
              </div>

              {/* 🔹 비밀번호 */}
              <div className="form-group">
                <div className="input-with-icon">
                  <div className="form-icon">
                    <img
                      src="/images/password_icon.png"
                      alt="비밀번호 아이콘"
                    />
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
                      aria-label={
                        showPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                      }
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                            clipRule="evenodd"
                          />
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
                    <img
                      src="/images/password_icon.png"
                      alt="비밀번호 확인 아이콘"
                    />
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
                      onClick={() =>
                        setShowPasswordConfirm(!showPasswordConfirm)
                      }
                      aria-label={
                        showPasswordConfirm
                          ? "비밀번호 숨기기"
                          : "비밀번호 보기"
                      }
                    >
                      {showPasswordConfirm ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                            clipRule="evenodd"
                          />
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
                    남은 시간: {Math.floor(timer / 60)}:
                    {String(timer % 60).padStart(2, "0")}
                  </div>
                )}
              </div>

              {/* 🔹 인증 코드 입력 */}
              <div className="form-group">
                <div className="input-with-button">
                  <div className="input-with-icon">
                    <div className="form-icon">
                      <img
                        src="/images/email_icon.png"
                        alt="이메일 코드 아이콘"
                      />
                    </div>
                    <input
                      type="text"
                      name="email_code"
                      className="form-input"
                      placeholder={
                        isEmailSent
                          ? "이메일 인증번호 입력"
                          : "인증하기 버튼을 먼저 눌러주세요"
                      }
                      value={formData.email_code}
                      onChange={handleChange}
                      disabled={!isEmailSent}
                      style={{
                        backgroundColor: !isEmailSent
                          ? "#f3f4f6"
                          : "transparent",
                        cursor: !isEmailSent ? "not-allowed" : "text",
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="check-button"
                    onClick={handleVerifyEmailCode}
                    disabled={!isEmailSent || isEmailVerified}
                    style={{
                      backgroundColor: isEmailVerified
                        ? "#10B981"
                        : !isEmailSent
                        ? "#9ca3af"
                        : "#3b82f6",
                      cursor:
                        !isEmailSent || isEmailVerified
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {isEmailVerified ? "✓ 인증완료" : "확인"}
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
                      onChange={() => handleCheckboxChange("all")}
                    />
                    <label htmlFor="agreeAll" className="checkbox-label">
                      전체 동의하기
                    </label>
                  </div>
                  <p className="agreement-desc">
                    모든 약관 및 개인정보 수집 동의가 포함됩니다.
                  </p>
                </div>

                <div className="agreement-item">
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      className="checkbox-input"
                      checked={agreements.terms}
                      onChange={() => handleCheckboxChange("terms")}
                      required
                    />
                    <label htmlFor="agreeTerms" className="checkbox-label">
                      [필수] 이용약관 동의
                    </label>
                  </div>
                  <div className="terms-textarea">
                    <strong>이용약관</strong>
                    <br />
                    <br />
                    <strong>제1조 (목적)</strong>
                    <br />
                    본 약관은 AI 기반 고객 리뷰 분석 서비스(이하 "서비스")의
                    이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을
                    규정함을 목적으로 합니다.
                    <br />
                    <br />
                    <strong>제2조 (용어의 정의)</strong>
                    <br />
                    "서비스"란 회원이 제공한 고객 리뷰 데이터를 AI 기술로
                    분석하여 제품 개선 인사이트를 제공하는 플랫폼을 말합니다.
                    <br />
                    "회원"이란 본 약관에 동의하고 회사와 서비스 이용계약을
                    체결한 자를 말합니다.
                    <br />
                    "아이디(ID)"란 회원의 식별과 서비스 이용을 위하여 회원이
                    설정하고 회사가 승인한 문자 또는 숫자의 조합을 말합니다.
                    <br />
                    <br />
                    <strong>제3조 (약관의 효력 및 변경)</strong>
                    <br />
                    본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게
                    공지함으로써 효력이 발생합니다.
                    <br />
                    회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본
                    약관을 변경할 수 있으며, 변경된 약관은 시행일자 7일 전부터
                    공지합니다.
                    <br />
                    <br />
                    <strong>제4조 (서비스의 제공)</strong>
                    <br />
                    회사는 다음과 같은 서비스를 제공합니다.
                    <br />
                    - 고객 리뷰 데이터 수집 및 관리
                    <br />
                    - AI 기반 감성 분석 및 키워드 추출
                    <br />
                    - 제품 개선 인사이트 리포트 생성
                    <br />
                    - 데이터 시각화 및 통계 분석
                    <br />
                    서비스는 연중무휴 1일 24시간 제공함을 원칙으로 합니다. 다만,
                    시스템 점검 등 불가피한 사유가 있는 경우 서비스 제공을 일시
                    중단할 수 있습니다.
                    <br />
                    <br />
                    <strong>제5조 (회원가입)</strong>
                    <br />
                    이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후
                    본 약관에 동의한다는 의사표시를 함으로써 회원가입을
                    신청합니다.
                    <br />
                    회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중
                    다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
                    <br />
                    - 타인의 명의를 이용한 경우
                    <br />
                    - 허위 정보를 기재한 경우
                    <br />
                    - 사회의 안녕질서 또는 미풍양속을 저해할 목적으로 신청한
                    경우
                    <br />
                    <br />
                    <strong>제6조 (회원 탈퇴 및 자격 상실)</strong>
                    <br />
                    회원은 언제든지 서비스 내 회원탈퇴 메뉴를 통해 이용계약
                    해지를 요청할 수 있으며, 회사는 관련 법령이 정하는 바에 따라
                    즉시 처리합니다.
                    <br />
                    회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을
                    제한 및 정지시킬 수 있습니다.
                    <br />
                    - 가입 시 허위 내용을 등록한 경우
                    <br />
                    - 다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는
                    경우
                    <br />
                    - 서비스를 이용하여 법령과 본 약관이 금지하는 행위를 하는
                    경우
                    <br />
                    <br />
                    <strong>제7조 (회원에 대한 통지)</strong>
                    <br />
                    회사는 회원에 대한 통지를 하는 경우 회원이 제공한 전자우편
                    주소로 할 수 있습니다.
                    <br />
                    <br />
                    <strong>제8조 (면책조항)</strong>
                    <br />
                    회사는 천재지변 또는 이에 준하는 불가항력으로 인하여
                    서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이
                    면제됩니다.
                    <br />
                    회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는
                    책임을 지지 않습니다.
                    <br />
                    <br />본 약관에 동의하시면 회원가입이 가능합니다.
                  </div>
                </div>

                <div className="agreement-item">
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id="agreePrivacy"
                      className="checkbox-input"
                      checked={agreements.privacy}
                      onChange={() => handleCheckboxChange("privacy")}
                      required
                    />
                    <label htmlFor="agreePrivacy" className="checkbox-label">
                      [필수] 개인정보 수집 및 이용 동의
                    </label>
                  </div>
                  <div className="terms-textarea">
                    <strong>개인정보 수집 및 이용 동의</strong>
                    <br />
                    <br />
                    회사는 「개인정보 보호법」 제15조 및 제22조에 따라 귀하의
                    개인정보 수집 및 이용에 관하여 다음과 같이 고지하고 동의를
                    받습니다.
                    <br />
                    <br />
                    <strong>개인정보의 수집 및 이용 목적</strong>
                    <br />
                    <strong>회원 가입 및 관리:</strong> 회원 가입 의사 확인,
                    회원제 서비스 제공, 본인 확인, 불량회원의 부정 이용 방지
                    <br />
                    <strong>서비스 제공:</strong> 리뷰 분석 결과 제공, 맞춤형
                    인사이트 리포트 생성, 고객 문의 대응
                    <br />
                    <strong>서비스 개선 및 통계 분석:</strong> 서비스 이용 통계
                    분석, 신규 서비스 개발 및 기존 서비스 개선
                    <br />
                    <br />
                    <strong>수집하는 개인정보 항목</strong>
                    <br />
                    <strong>필수항목:</strong> 이름, 이메일 주소, 비밀번호
                    <br />
                    <strong>자동 수집 항목:</strong> 서비스 이용기록, 접속 로그,
                    쿠키, 접속 IP 정보
                    <br />
                    <br />
                    <strong>개인정보의 보유 및 이용기간</strong>
                    <br />
                    회원의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이
                    달성되면 지체없이 파기합니다. 단, 다음의 정보에 대해서는
                    아래의 이유로 명시한 기간 동안 보존합니다.
                    <br />
                    <br />
                    <strong>회사 내부 방침에 의한 정보보유</strong>
                    <br />
                    <strong>부정 이용 기록:</strong> 1년 (부정 이용 방지)
                    <br />
                    <br />
                    <strong>관련 법령에 의한 정보보유</strong>
                    <br />
                    <strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년
                    (전자상거래 등에서의 소비자보호에 관한 법률)
                    <br />
                    <strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년
                    (전자상거래 등에서의 소비자보호에 관한 법률)
                    <br />
                    <strong>
                      소비자의 불만 또는 분쟁처리에 관한 기록:
                    </strong>{" "}
                    3년 (전자상거래 등에서의 소비자보호에 관한 법률)
                    <br />
                    <strong>웹사이트 방문기록:</strong> 3개월 (통신비밀보호법)
                    <br />
                    <br />
                    <strong>동의를 거부할 권리 및 불이익</strong>
                    <br />
                    귀하는 위와 같은 개인정보 수집 및 이용에 대한 동의를 거부할
                    권리가 있습니다. 다만, 필수항목에 대한 동의를 거부할 경우
                    회원가입이 제한됩니다.
                    <br />
                    <br />위 내용을 확인하였으며, 개인정보 수집 및 이용에
                    동의합니다.
                  </div>
                </div>
              </div>

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
