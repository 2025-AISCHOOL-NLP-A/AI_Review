import React from "react";
import { useEmailTimer } from "../../hooks/useEmailTimer";

/**
 * 이메일 인증 컴포넌트 (이메일 입력 + 인증 코드 입력 + 타이머)
 */
export default function EmailVerification({
  emailPrefix,
  emailDomain,
  emailCode,
  onEmailPrefixChange,
  onEmailDomainChange,
  onEmailCodeChange,
  onSendEmailCode,
  onVerifyEmailCode,
  isEmailSent,
  isEmailVerified,
  loading,
  onEmailSentChange, // isEmailSent 상태를 업데이트하는 콜백
}) {
  const { timer, startTimer, resetTimer, formatTimer, isActive } =
    useEmailTimer();

  const handleSendCode = async () => {
    const result = await onSendEmailCode();
    if (result?.success) {
      startTimer();
      if (onEmailSentChange) {
        onEmailSentChange(true);
      }
    }
  };

  const handleVerifyCode = async () => {
    const result = await onVerifyEmailCode();
    if (result?.success) {
      resetTimer();
    }
  };

  return (
    <>
      {/* 이메일 입력 */}
      <div className="form-group">
        <div className="email-input-group">
          <div className="input-with-icon email-input-wrapper">
            <div className="form-icon">
              <img src="/images/email_icon.png" alt="이메일 아이콘" />
            </div>
            <input
              type="text"
              id="join_email_prefix"
              name="email_prefix"
              className="form-input email-input"
              placeholder="이메일"
              value={emailPrefix}
              onChange={onEmailPrefixChange}
              autoComplete="email"
              required
            />
          </div>
          <span className="email-at">@</span>
          <select
            id="join_email_domain"
            name="email_domain"
            className="form-select"
            value={emailDomain}
            onChange={onEmailDomainChange}
          >
            <option value="gmail.com">gmail.com</option>
            <option value="naver.com">naver.com</option>
            <option value="daum.net">daum.net</option>
            <option value="kakao.com">kakao.com</option>
          </select>
          <button
            type="button"
            className="verify-button"
            onClick={handleSendCode}
            disabled={isActive || loading}
          >
            인증하기
          </button>
        </div>
        {isActive && (
          <div className="email-timer">남은 시간: {formatTimer()}</div>
        )}
        {isEmailSent && !isActive && (
          <div className="email-timer">타이머가 만료되었습니다. 다시 인증해주세요.</div>
        )}
      </div>

      {/* 인증 코드 입력 */}
      <div className="form-group">
        <div className="input-with-button">
          <div className="input-with-icon">
            <div className="form-icon">
              <img src="/images/email_icon.png" alt="이메일 코드 아이콘" />
            </div>
            <input
              type="text"
              id="join_email_code"
              name="email_code"
              className="form-input"
              placeholder={
                isEmailSent
                  ? "이메일 인증번호 입력"
                  : "인증하기 버튼을 먼저 눌러주세요"
              }
              value={emailCode}
              onChange={onEmailCodeChange}
              disabled={!isEmailSent}
              autoComplete="one-time-code"
              style={{
                backgroundColor: !isEmailSent ? "#f3f4f6" : "transparent",
                cursor: !isEmailSent ? "not-allowed" : "text",
              }}
            />
          </div>
          <button
            type="button"
            className="check-button"
            onClick={handleVerifyCode}
            disabled={!isEmailSent || isEmailVerified || loading}
            style={{
              backgroundColor: isEmailVerified
                ? "#10B981"
                : !isEmailSent
                ? "#9ca3af"
                : "#3b82f6",
              cursor:
                !isEmailSent || isEmailVerified ? "not-allowed" : "pointer",
            }}
          >
            {isEmailVerified ? "✓ 인증완료" : "확인"}
          </button>
        </div>
      </div>
    </>
  );
}

