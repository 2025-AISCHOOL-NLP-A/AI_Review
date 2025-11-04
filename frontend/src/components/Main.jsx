// src/pages/Main.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/main.css";
import "../styles/common.css";

function Main() {
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const priceRef = useRef(null);

  // 페이지 진입 시 맨 위로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // 스무스 스크롤 함수
  const smoothScrollTo = (el) => {
    if (!el) return;
    const headerH = 72; // 헤더 높이 고려
    const y = el.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="main-page">
      {/* ===================== HEADER ===================== */}
      <header className="main-header">
        <nav className="nav-buttons">
          <button onClick={() => smoothScrollTo(previewRef.current)}>시연영상</button>
          <button onClick={() => smoothScrollTo(priceRef.current)}>요금제</button>
          <button onClick={() => navigate("/login")}>로그인</button>
        </nav>
      </header>

      {/* ===================== HERO SECTION ===================== */}
      <section className="hero">
        <img src="/images/logo.png" alt="서비스 로고" className="hero-logo" />
        <h1 className="hero-title">
          AI가 고객 리뷰 속 <br />
          숨은 인사이트를 찾아드립니다!
        </h1>
        <p className="hero-subtitle">
          리뷰 분석 자동화 플랫폼, <strong>꽤뚫어뷰</strong>와 함께하세요.
        </p>
      </section>

      {/* ===================== PREVIEW SECTION ===================== */}
      <section className="preview" ref={previewRef}>
        <h2 className="section-title">서비스 시연</h2>
        <div className="preview-video">
          <img src="/images/demo_preview.png" alt="서비스 시연 화면" />
        </div>
      </section>

      {/* ===================== PRICE SECTION ===================== */}
      <section className="price-section" ref={priceRef}>
        <h2 className="section-title">요금제 안내</h2>
        <div className="price-cards">
          {/* 🔸 Free Plan */}
          <div className="card free">
            <h3 className="plan-name">프리</h3>
            <p className="price">무료</p>
            <ul className="features">
              <li>✅ 기본 리뷰 분석 제공</li>
              <li>✅ 제한적 프로젝트 수</li>
              <li>❌ 고급 통계 기능 미지원</li>
            </ul>
            <button className="select-btn free-btn">요금제 선택</button>
          </div>

          {/* 🔹 Pro Plan */}
          <div className="card pro">
            <h3 className="plan-name">프로</h3>
            <p className="price">15,000원 / 월</p>
            <ul className="features">
              <li>✅ 모든 기본 기능</li>
              <li>✅ 분석 리포트 다운로드</li>
              <li>✅ 프로젝트 10개</li>
            </ul>
            <button className="select-btn blue-btn">요금제 선택</button>
          </div>

          {/* 🔸 Premium Plan */}
          <div className="card premium">
            <h3 className="plan-name">프리미엄</h3>
            <p className="price">50,000원 / 월</p>
            <ul className="features">
              <li>✅ 모든 프로 기능</li>
              <li>✅ 무제한 프로젝트</li>
              <li>✅ 팀 협업 기능 포함</li>
            </ul>
            <button className="select-btn blue-btn">요금제 선택</button>
          </div>
        </div>
      </section>

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
          <div className="footer-email">문의: team.kkwaetoolview@gmail.com</div>
        </div>
      </footer>
    </div>
  );
}

export default Main;
