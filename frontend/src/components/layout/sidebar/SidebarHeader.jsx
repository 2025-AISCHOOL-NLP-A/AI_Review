import React from "react";

function SidebarHeader({ sidebarOpen, setSidebarOpen }) {
  return (
    <div className="sidebar-header">
      <div
        className="sidebar-logo"
        onClick={
          !sidebarOpen
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                setSidebarOpen(true);
              }
            : undefined
        }
        style={!sidebarOpen ? { cursor: "pointer" } : {}}
        onMouseDown={(e) => {
          // 로고 클릭 시 이벤트 전파 완전 차단
          if (!sidebarOpen) {
            e.stopPropagation();
          }
        }}
      >
        <img
          src="/images/logo.png"
          alt="꿰뚫어뷰 로고"
          className="sidebar-logo-img"
        />
        {sidebarOpen && <span className="sidebar-brand">꿰뚫어뷰</span>}
      </div>
      <button
        className="sidebar-toggle"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSidebarOpen(!sidebarOpen);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        aria-label="Toggle sidebar"
        aria-expanded={sidebarOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          {sidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          )}
        </svg>
      </button>
    </div>
  );
}

export default SidebarHeader;

