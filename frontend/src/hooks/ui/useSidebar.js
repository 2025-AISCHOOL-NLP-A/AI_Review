import { useState, useEffect } from "react";

/**
 * 사이드바 상태 관리 커스텀 훅
 * localStorage와 커스텀 이벤트를 통해 사이드바 상태를 동기화
 */
export const useSidebar = () => {
  // localStorage에서 사이드바 상태 불러오기
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? saved === "true" : true;
  });

  // 사이드바 상태 변경 감지 (커스텀 이벤트 및 storage 이벤트)
  useEffect(() => {
    const handleSidebarStateChange = (event) => {
      if (event.detail && typeof event.detail.sidebarOpen === 'boolean') {
        setSidebarOpen(event.detail.sidebarOpen);
      } else {
        // 이벤트에 detail이 없는 경우 localStorage에서 직접 확인
        const saved = localStorage.getItem("sidebarOpen");
        setSidebarOpen(saved !== null ? saved === "true" : true);
      }
    };

    // storage 이벤트 리스너 (다른 탭에서 변경된 경우)
    const handleStorageChange = () => {
      const saved = localStorage.getItem("sidebarOpen");
      setSidebarOpen(saved !== null ? saved === "true" : true);
    };

    // 초기 상태 확인
    const saved = localStorage.getItem("sidebarOpen");
    setSidebarOpen(saved !== null ? saved === "true" : true);

    // 커스텀 이벤트 리스너 등록 (같은 탭에서 변경된 경우)
    window.addEventListener("sidebarStateChanged", handleSidebarStateChange);
    // storage 이벤트 리스너 등록 (다른 탭에서 변경된 경우)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("sidebarStateChanged", handleSidebarStateChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return sidebarOpen;
};

