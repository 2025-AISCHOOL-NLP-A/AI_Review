import React from "react";
import PasswordInput from "../auth/PasswordInput";
import EmailVerificationUpdate from "./EmailVerificationUpdate";

/**
 * 회원정보 수정 폼 컴포넌트
 */
export default function ProfileUpdateForm({
  formData,
  onFormDataChange,
  isEmailSent,
  isEmailVerified,
  onEmailSentChange,
  onEmailVerifiedChange,
  onSendEmailCode,
  onVerifyEmailCode,
  emailTimer,
  showCurrentPassword,
  showNewPassword,
  showNewPasswordConfirm,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onToggleNewPasswordConfirm,
}) {
  return (
    <form className="join-form">
      {/* 아이디 (고정) */}
      <div className="form-group">
        <div className="input-with-icon">
          <div className="form-icon">
            <img src="/images/id_icon.png" alt="아이디 아이콘" />
          </div>
          <input
            type="text"
            id="update_user_id"
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
              id="update_current_password"
              name="current_password"
              className="form-input"
              placeholder="기존 비밀번호"
              value={formData.current_password}
              onChange={onFormDataChange}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={onToggleCurrentPassword}
              aria-label={
                showCurrentPassword
                  ? "비밀번호 숨기기"
                  : "비밀번호 보기"
              }
            >
              {showCurrentPassword ? (
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

      {/* 새 비밀번호 */}
      <PasswordInput
        id="update_new_password"
        name="new_password"
        value={formData.new_password}
        onChange={onFormDataChange}
        placeholder="비밀번호 수정"
        autoComplete="new-password"
      />

      {/* 새 비밀번호 확인 */}
      <PasswordInput
        id="update_new_password_confirm"
        name="new_password_confirm"
        value={formData.new_password_confirm}
        onChange={onFormDataChange}
        placeholder="수정된 비밀번호 확인"
        autoComplete="new-password"
      />

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
            id="update_current_email"
            name="current_email"
            className="form-input"
            placeholder="기존 이메일(고정)"
            value={formData.current_email}
            readOnly
          />
        </div>
      </div>

      {/* 변경할 이메일 및 인증 */}
      <EmailVerificationUpdate
        emailPrefix={formData.new_email_prefix}
        emailDomain={formData.email_domain}
        emailCode={formData.email_code}
        onEmailPrefixChange={(e) =>
          onFormDataChange({ target: { name: "new_email_prefix", value: e.target.value } })
        }
        onEmailDomainChange={(e) =>
          onFormDataChange({ target: { name: "email_domain", value: e.target.value } })
        }
        onEmailCodeChange={(e) =>
          onFormDataChange({ target: { name: "email_code", value: e.target.value } })
        }
        onSendEmailCode={onSendEmailCode}
        onVerifyEmailCode={onVerifyEmailCode}
        isEmailSent={isEmailSent}
        isEmailVerified={isEmailVerified}
        emailTimer={emailTimer}
      />
    </form>
  );
}

