import React from "react";
import "./footer.css";

function Footer() {
  return (
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
        <div className="footer-info">© 2025 Team 꿰뚫어뷰</div>
        <div className="footer-email">이메일(team.kkwaetoolview@gmail.com)</div>
      </div>
    </footer>
  );
}

export default Footer;

