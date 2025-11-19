import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../../contexts/UserContext";
import { useLogoutTimer } from "../../../hooks/useLogoutTimer";
import authService from "../../../services/authService";
import "../../../styles/common.css";
import "./sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: contextLogout, refreshUser } = useUser();
  const { remainingTime, isExpired } = useLogoutTimer();
  const [isExtending, setIsExtending] = useState(false);

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

  const isActive = (path) => location.pathname === path;

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

  // 세션 시간 연장 핸들러
  const handleExtendSession = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isExtending || isExpired) return;

    setIsExtending(true);
    try {
      const result = await authService.refreshToken();
      if (result.success) {
        // 사용자 정보 새로고침
        await refreshUser();
        // 성공 메시지 (선택사항 - 간단한 알림)
        alert("세션이 2시간 연장되었습니다.");
      } else {
        alert(result.message || "세션 연장에 실패했습니다.");
      }
    } catch (error) {
      console.error("세션 연장 오류:", error);
      alert("세션 연장 중 오류가 발생했습니다.");
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <aside
      className={`dashboard-sidebar ${
        sidebarOpen ? "sidebar-open" : "sidebar-closed"
      }`}
    >
      {/* ===== 사이드바 헤더 ===== */}
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

      {/* ===== 사용자 프로필 ===== */}
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

      {/* ===== 네비 ===== */}
      <nav
        className="sidebar-nav"
        onClick={(e) => {
          // 네비게이션 영역 클릭 시 사이드바가 열리지 않도록 방지
          if (!sidebarOpen) {
            e.stopPropagation();
          }
        }}
      >
        {/* 워크플레이스 */}
        <a
          href="#"
          className={`sidebar-nav-item ${isActive("/wp") ? "active" : ""}`}
          data-label="워크플레이스"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate("/wp");
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          {sidebarOpen && <span>워크플레이스</span>}
        </a>

        {/* 분석 리포트 */}
        <a
          href="#"
          className="sidebar-nav-item"
          data-label="분석 리포트"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          {sidebarOpen && <span>분석 리포트</span>}
        </a>
        {/* 리뷰 관리 */}
        <a
          href="#"
          className={`sidebar-nav-item ${isActive("/reviews") ? "active" : ""}`}
          data-label="리뷰 관리"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate("/reviews");
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          {sidebarOpen && <span>리뷰 관리</span>}
        </a>

        {/* ===== 설정 ===== */}
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
            // ★ 사이드바가 닫혔을 때만 툴팁 문구 동적으로 설정
            data-label={
              sidebarOpen
                ? undefined
                : settingsOpen
                ? "설정메뉴 닫기"
                : "설정메뉴 더보기"
            }
            className={`sidebar-nav-item 
              ${settingsOpen ? "settings-open" : ""} 
              ${
                isActive("/memberupdate") ||
                isActive("/pricingsystem") ||
                isActive("/memberdrop")
                  ? "active"
                  : ""
              }`}
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

          {/* ⬇ 변경: sidebarOpen 여부와 무관하게 settingsOpen이면 렌더 */}
          {settingsOpen && (
            <div
              className={`sidebar-submenu ${!sidebarOpen ? "collapsed" : ""}`}
            >
              <a
                href="#"
                className={`sidebar-submenu-item ${
                  isActive("/memberupdate") ? "active" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/memberupdate");
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                data-label="회원정보 수정"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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
                {sidebarOpen && <span>회원정보 수정</span>}
              </a>

              <a
                href="#"
                className={`sidebar-submenu-item ${
                  isActive("/pricingsystem") ? "active" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/pricingsystem");
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                data-label="요금제 관리"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {sidebarOpen && <span>요금제 관리</span>}
              </a>

              <a
                href="#"
                className={`sidebar-submenu-item ${
                  isActive("/memberdrop") ? "active" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/memberdrop");
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                data-label="회원 탈퇴"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {sidebarOpen && <span>회원 탈퇴</span>}
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* ===== 로그아웃 ===== */}
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            contextLogout();
            navigate("/login");
          }}
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
    </aside>
  );
}

export default Sidebar;
