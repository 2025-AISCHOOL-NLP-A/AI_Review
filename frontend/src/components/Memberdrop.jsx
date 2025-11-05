import React from "react";
import Sidebar from "./Sidebar";
import "../styles/dashboard.css";
import "../styles/sidebar.css";
import "../styles/common.css";

function Memberdrop() {
  return (
    <div className={`dashboard-page sidebar-open`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="dashboard-wrapper">
        <div className="dashboard-content" style={{ padding: "24px" }}>
          {/* 회원탈퇴 멘트 */}
          <section className=""></section>

          {/* ===================== FOOTER ===================== */}
          <footer>
            <div className="footer-left">
              <img src="/images/logo.png" alt="logo" className="footer-logo" />
            </div>
            <div className="footer-right">
              <div className="footer-links">
                <span>문의</span>
                <span className="divider">|</span>
                <span>개인정보처리방침</span>
              </div>
              <div className="footer-info">© 2025 Team 꽤뚫어뷰</div>
              <div className="footer-email">
                문의: team.kkwaetoolview@gmail.com
              </div>
            </div>
          </footer>
        </div>
        {/* dashboard-content 끝 */}
      </div>
      {/* dashboard-wrapper 끝 */}
    </div>
  );
}
