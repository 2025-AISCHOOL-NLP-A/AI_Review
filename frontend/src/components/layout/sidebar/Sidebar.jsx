import React, { useState, useEffect } from "react";
import { useUser } from "../../../contexts/UserContext";
import { useLogoutTimer } from "../../../hooks/auth/useLogoutTimer";
import { useExtendSession } from "../../../hooks/auth/useExtendSession";
import SidebarHeader from "./SidebarHeader";
import SidebarUserProfile from "./SidebarUserProfile";
import SidebarNavigation from "./SidebarNavigation";
import SidebarSettings from "./SidebarSettings";
import SidebarFooter from "./SidebarFooter";
import "../../../styles/common.css";
import "./sidebar.css";

function Sidebar() {
  const { user, logout: contextLogout, refreshUser } = useUser();
  const { remainingTime, isExpired } = useLogoutTimer();
  const { isExtending, handleExtendSession } = useExtendSession(
    refreshUser,
    isExpired
  );

  // localStorage에서 사이드바 상태 불러오기 (기본값: true)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? saved === "true" : true;
  });

  // localStorage에서 설정 탭 상태 불러오기 (기본값: false)
  const [settingsOpen, setSettingsOpen] = useState(() => {
    const saved = localStorage.getItem("settingsOpen");
    return saved !== null ? saved === "true" : false;
  });

  // Context에서 사용자 정보 가져오기 (API 호출 없음)
  const userInfo = user
    ? {
        login_id: user?.login_id || "",
        email: user?.email || "",
      }
    : { login_id: "", email: "" };

  // 사이드바 상태가 변경될 때마다 localStorage에 저장하고 커스텀 이벤트 발생
  useEffect(() => {
    localStorage.setItem("sidebarOpen", sidebarOpen.toString());
    // 사이드바 상태 변경 커스텀 이벤트 발생
    window.dispatchEvent(
      new CustomEvent("sidebarStateChanged", {
        detail: { sidebarOpen },
      })
    );
  }, [sidebarOpen]);

  // 설정 탭 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("settingsOpen", settingsOpen.toString());
  }, [settingsOpen]);

  return (
    <aside
      className={`dashboard-sidebar ${
        sidebarOpen ? "sidebar-open" : "sidebar-closed"
      }`}
    >
      <SidebarHeader
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <SidebarUserProfile sidebarOpen={sidebarOpen} userInfo={userInfo} />

      <SidebarNavigation
        sidebarOpen={sidebarOpen}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
      />

      <SidebarFooter
        sidebarOpen={sidebarOpen}
        remainingTime={remainingTime}
        isExpired={isExpired}
        isExtending={isExtending}
        handleExtendSession={handleExtendSession}
        onLogout={contextLogout}
      />
    </aside>
  );
}

export default Sidebar;
