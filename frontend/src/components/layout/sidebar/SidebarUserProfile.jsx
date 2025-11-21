import React from "react";

function SidebarUserProfile({ sidebarOpen, userInfo }) {
  return (
    <div
      className="sidebar-user-profile"
      onClick={(e) => {
        // 프로필 영역 클릭 시 사이드바가 열리지 않도록 방지
        if (!sidebarOpen) {
          e.stopPropagation();
        }
      }}
    >
      {sidebarOpen ? (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {userInfo.login_id || "사용자"}
            </div>
            <div className="sidebar-user-email">{userInfo.email || ""}</div>
          </div>
        </div>
      ) : (
        <div className="sidebar-user-avatar-only" title={userInfo.login_id}>
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default SidebarUserProfile;

