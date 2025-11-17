import React from "react";
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from "../../constants/terms";

/**
 * 약관 동의 섹션 컴포넌트
 */
export default function AgreementSection({
  agreements,
  onCheckboxChange,
}) {
  // 약관 텍스트를 줄바꿈 처리
  const formatText = (text) => {
    return text.split("\n").map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="agreement-section">
      <div className="agreement-item">
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            id="agreeAll"
            className="checkbox-input"
            checked={agreements.all}
            onChange={() => onCheckboxChange("all")}
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
            onChange={() => onCheckboxChange("terms")}
            required
          />
          <label htmlFor="agreeTerms" className="checkbox-label">
            [필수] 이용약관 동의
          </label>
        </div>
        <div className="terms-textarea">
          {formatText(TERMS_OF_SERVICE)}
        </div>
      </div>

      <div className="agreement-item">
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            id="agreePrivacy"
            className="checkbox-input"
            checked={agreements.privacy}
            onChange={() => onCheckboxChange("privacy")}
            required
          />
          <label htmlFor="agreePrivacy" className="checkbox-label">
            [필수] 개인정보 수집 및 이용 동의
          </label>
        </div>
        <div className="terms-textarea">
          {formatText(PRIVACY_POLICY)}
        </div>
      </div>
    </div>
  );
}

