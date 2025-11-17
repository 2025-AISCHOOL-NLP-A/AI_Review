import React from "react";

/**
 * 회원정보 수정 페이지용 이메일 인증 컴포넌트
 * useEmailTimerUpdate 훅과 함께 사용
 */
export default function EmailVerificationUpdate({
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
  emailTimer,
}) {
  return (
    <>
      {/* 변경할 이메일 입력 */}
      <div className="form-group">
        <div className="email-input-group">
          <div className="input-with-icon email-input-wrapper">
            <div className="form-icon">
              <img src="/images/email_icon.png" alt="이메일 아이콘" />
            </div>
            <input
              type="text"
              id="update_new_email_prefix"
              name="new_email_prefix"
              className="form-input email-input"
              placeholder="변경할 이메일"
              value={emailPrefix}
              onChange={onEmailPrefixChange}
              autoComplete="email"
            />
          </div>

          <span className="email-at">@</span>
          <select
            id="update_email_domain"
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
            onClick={onSendEmailCode}
            disabled={emailTimer.isActive}
          >
            인증하기
          </button>
        </div>
        {emailTimer.isActive && (
          <div className="email-timer">
            남은 시간: {emailTimer.formatTimer()}
          </div>
        )}
      </div>

      {/* 인증 코드 입력 */}
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
              id="update_email_code"
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
            onClick={onVerifyEmailCode}
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
    </>
  );
}

