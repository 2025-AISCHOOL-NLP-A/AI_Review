import React from "react";
import { useNavigate } from "react-router-dom";

function SidebarFooter({
  sidebarOpen,
  remainingTime,
  isExpired,
  isExtending,
  handleExtendSession,
  onLogout,
}) {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onLogout();
    navigate("/login");
  };

  return (
    <div
      className="sidebar-footer"
      onClick={(e) => {
        // 푸터 영역 클릭 시 사이드바가 열리지 않도록 방지
        if (!sidebarOpen) {
          e.stopPropagation();
        }
      }}
    >
      {/* 로그아웃 남은 시간 표시 */}
      {sidebarOpen && (
        <div className="sidebar-timer">
          <div className="sidebar-timer-label">세션 만료까지</div>
          <div className={`sidebar-timer-value ${isExpired ? "expired" : ""}`}>
            {remainingTime}
          </div>
          {!isExpired && (
            <button
              className="sidebar-extend-button"
              onClick={handleExtendSession}
              disabled={isExtending}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            >
              {isExtending ? "연장 중..." : "시간 연장하기"}
            </button>
          )}
        </div>
      )}
      {!sidebarOpen && (
        <div className="sidebar-timer-icon-only" title={`세션 만료까지: ${remainingTime}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      )}
      <button
        className="sidebar-logout-button fullsize-icon"
        data-label="로그아웃"
        onClick={handleLogout}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        aria-label="로그아웃"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        {sidebarOpen && <span>로그아웃</span>}
      </button>
    </div>
  );
}

export default SidebarFooter;

