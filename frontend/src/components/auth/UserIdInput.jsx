import React from "react";

/**
 * 아이디 입력 필드 + 중복 검사 버튼 컴포넌트
 */
export default function UserIdInput({
  value,
  onChange,
  onCheckDuplicate,
}) {
  return (
    <div className="form-group">
      <div className="input-with-button">
        <div className="input-with-icon">
          <div className="form-icon">
            <img src="/images/id_icon.png" alt="아이디 아이콘" />
          </div>
          <input
            type="text"
            id="join_user_id"
            name="user_id"
            className="form-input"
            placeholder="아이디"
            value={value}
            onChange={onChange}
            autoComplete="username"
            required
          />
        </div>
        <button
          type="button"
          className="check-button"
          onClick={onCheckDuplicate}
        >
          중복 검사
        </button>
      </div>
    </div>
  );
}

