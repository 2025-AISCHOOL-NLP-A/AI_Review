import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SidebarSettings from "./SidebarSettings";

function SidebarNavigation({ sidebarOpen, settingsOpen, setSettingsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    {
      path: "/wp",
      label: "워크플레이스",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      ),
    },
    // {
    //   path: null,
    //   label: "분석 리포트",
    //   icon: (
    //     <path
    //       strokeLinecap="round"
    //       strokeLinejoin="round"
    //       d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2"
    //     />
    //   ),
    // },
    {
      path: "/reviews",
      label: "리뷰 관리",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      ),
    },
  ];

  return (
    <nav
      className="sidebar-nav"
      onClick={(e) => {
        // 네비게이션 영역 클릭 시 사이드바가 열리지 않도록 방지
        if (!sidebarOpen) {
          e.stopPropagation();
        }
      }}
    >
      {navItems.map((item) => (
        <a
          key={item.label}
          href="#"
          className={`sidebar-nav-item ${isActive(item.path) ? "active" : ""}`}
          data-label={item.label}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (item.path) {
              navigate(item.path);
            }
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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

      <SidebarSettings
        sidebarOpen={sidebarOpen}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
      />
    </nav>
  );
}

export default SidebarNavigation;

