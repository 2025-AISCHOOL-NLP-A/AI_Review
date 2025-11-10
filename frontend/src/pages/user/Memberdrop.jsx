import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/sidebar/Sidebar";
import Footer from "../../components/layout/Footer/Footer";
import authService from "../../services/authService";
import "../dashboard/dashboard.css";
import "../../components/layout/sidebar/sidebar.css";
import "../../styles/common.css";
import "./memberdrop.css";

function Memberdrop() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ login_id: "" });
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 현재 로그인 사용자 정보 조회
    const fetchUserInfo = async () => {
      try {
        const me = await authService.getMe();
        setUserInfo({
          login_id: me?.login_id || "",
        });
      } catch (error) {
        console.error("사용자 정보를 가져오는데 실패했습니다:", error);
        alert("사용자 정보를 불러오는데 실패했습니다.");
      }
    };

    fetchUserInfo();
  }, []);

  const handleWithdraw = async () => {
    if (!agreeChecked) {
      alert("탈퇴에 따른 주의사항에 동의해주세요.");
      return;
    }

    // 확인 팝업창
    const confirmMessage = "정말로 탈퇴하시겠습니까?";
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const result = await authService.withdraw();
      if (result.success) {
        alert("회원탈퇴가 완료되었습니다.");
        authService.logout();
        navigate("/login");
      } else {
        alert(result.message || "회원탈퇴에 실패했습니다.");
      }
    } catch (error) {
      console.error("회원탈퇴 오류:", error);
      alert("회원탈퇴 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`dashboard-page sidebar-open`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="dashboard-wrapper">
        <div className="dashboard-content memberdrop-content">
          <div className="memberdrop-container">
            {/* 제목 */}
            <h1 className="memberdrop-title">회원탈퇴</h1>
            <div className="memberdrop-divider"></div>

            {/* 안내 문구 */}
            <p className="memberdrop-intro">
              회원탈퇴를 신청하기 전에 안내 사항을 꼭 확인해주세요.
            </p>

            {/* 경고 메시지들 */}
            <div className="memberdrop-warnings">
              {/* 첫 번째 경고 */}
              <div className="warning-item">
                <div className="warning-header">
                  <svg
                    className="check-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="warning-text">
                    사용하고 계신 아이디(<strong>{userInfo.login_id}</strong>)는 탈퇴할 경우 재사용 및 복구가 불가능합니다.
                  </span>
                </div>
                <p className="warning-detail">
                  탈퇴한 아이디는 본인과 타인 모두 재사용 및 복구가 불가하오니 신중하게 선택하시기 바랍니다.
                </p>
              </div>

              {/* 두 번째 경고 */}
              <div className="warning-item">
                <div className="warning-header">
                  <svg
                    className="check-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="warning-text">
                    탈퇴 후 회원정보 및 개인형 서비스 이용기록은 모두 삭제됩니다.
                  </span>
                </div>
                <p className="warning-detail">
                  삭제된 데이터는 복구되지 않습니다.
                  <br />
                  삭제되는 내용을 확인하시고 필요한 데이터는 미리 백업을 해주세요.
                </p>
              </div>

              {/* 세 번째 경고 */}
              <div className="warning-item">
                <div className="warning-header">
                  <svg
                    className="check-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="warning-text">
                    탈퇴 후에는 아이디 <strong>{userInfo.login_id}</strong>로 다시 가입할 수 없으며 아이디와 데이터는 복구할 수 없습니다.
                  </span>
                </div>
                <p className="warning-detail">
                  이전의 아이디로 로그인하여 사용 중이던 외부 사이트를 방문하여
                  <br />
                  다른 로그인 수단을 준비하거나, 데이터를 백업한 후 회원을 탈퇴해야 합니다.
                </p>
              </div>
            </div>

            {/* 동의 체크박스 */}
            <div className="memberdrop-agree">
              <label className="agree-checkbox">
                <input
                  type="checkbox"
                  checked={agreeChecked}
                  onChange={(e) => setAgreeChecked(e.target.checked)}
                />
                <span className="checkmark">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="agree-text">
                  탈퇴에 따른 주의사항을 확인했으며 동의 합니다.
                </span>
              </label>
            </div>

            {/* 탈퇴하기 버튼 */}
            <div className="memberdrop-button-container">
              <button
                className="memberdrop-button"
                onClick={handleWithdraw}
                disabled={loading || !agreeChecked}
              >
                {loading ? "처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
        
        {/* ===================== FOOTER ===================== */}
        <Footer />
      </div>
    </div>
  );
}

export default Memberdrop;

