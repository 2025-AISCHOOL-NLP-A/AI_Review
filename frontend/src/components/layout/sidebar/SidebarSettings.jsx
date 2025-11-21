import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

function SidebarSettings({ sidebarOpen, settingsOpen, setSettingsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const settingsItems = [
    {
      path: "/memberupdate",
      label: "회원정보 수정",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      ),
    },
    {
      path: "/pricingsystem",
      label: "요금제 관리",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      path: "/memberdrop",
      label: "회원 탈퇴",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      ),
    },
  ];

  const isSettingsActive =
    isActive("/memberupdate") ||
    isActive("/pricingsystem") ||
    isActive("/memberdrop");

  return (
    <div
      className="sidebar-nav-item-parent"
      onClick={(e) => {
        // 설정 메뉴 부모 영역 클릭 시 사이드바가 열리지 않도록 방지
        if (!sidebarOpen) {
          e.stopPropagation();
        }
      }}
    >
      <a
        href="#"
        data-label={
          sidebarOpen
            ? undefined
            : settingsOpen
            ? "설정메뉴 닫기"
            : "설정메뉴 더보기"
        }
        className={`sidebar-nav-item 
          ${settingsOpen ? "settings-open" : ""} 
          ${isSettingsActive ? "active" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSettingsOpen(!settingsOpen);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        aria-expanded={settingsOpen}
      >
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        {sidebarOpen && (
          <>
            <span>설정</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ml-auto transition-transform ${
                settingsOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </>
        )}
      </a>

      {settingsOpen && (
        <div
          className={`sidebar-submenu ${!sidebarOpen ? "collapsed" : ""}`}
        >
          {settingsItems.map((item) => (
            <a
              key={item.path}
              href="#"
              className={`sidebar-submenu-item ${
                isActive(item.path) ? "active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(item.path);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              data-label={item.label}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                {item.icon}
              </svg>
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default SidebarSettings;

