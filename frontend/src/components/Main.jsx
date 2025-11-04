// src/pages/Main.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/main.css";
import "../styles/common.css";

function Main() {
  const navigate = useNavigate();

  // 스크롤 대상 섹션 레퍼런스
  const previewRef = useRef(null);
  const priceRef = useRef(null);

  // 페이지 진입 시 무조건 맨 위로
  useEffect(() => {
    // 브라우저가 스크롤 위치를 기억하는 경우를 방지
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // 공통 스크롤 함수(헤더 높이 고려)
  const smoothScrollTo = (el) => {
    if (!el) return;
    const headerH = 72; // 실제 헤더 높이에 맞춰 조정
    const y = el.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="main-page">
      <header className="main-header">
        <button onClick={() => smoothScrollTo(previewRef.current)}>
          시연영상
        </button>
        <button onClick={() => smoothScrollTo(priceRef.current)}>요금제</button>
        <button onClick={() => navigate("/login")}>로그인</button>
      </header>

      {/* 히어로가 항상 처음 보이도록 */}
      <section className="hero" id="hero">
        <img src="/images/logo.png" alt="search icon" />
        <h1>AI가 고객 리뷰 속 숨은 인사이트를 찾아드립니다!</h1>
      </section>

      <section className="preview" ref={previewRef}>
        <img src="/images/logo.png" alt="서비스 시연 화면" />
      </section>

      <section className="price-section" ref={priceRef}>
        <h2>Price</h2>
        <div className="price-cards">
          <div className="card free">
            <h3>프리</h3>
            <p className="price">무료</p>
            <div className="features">
              ✅ 기본 리뷰 분석 제공
              <br />
              ✅ 제한적 프로젝트 수<br />❌ 고급 통계 기능 미지원
            </div>
            <button className="select-btn free-btn">요금제 선택</button>
          </div>

          <div className="card pro">
            <h3>프로</h3>
            <p className="price">15,000원 / 월</p>
            <div className="features">
              ✅ 모든 기본 기능
              <br />
              ✅ 분석 리포트 다운로드
              <br />✅ 프로젝트 10개
            </div>
            <button className="select-btn blue-btn">요금제 선택</button>
          </div>

          <div className="card premium">
            <h3>프리미엄</h3>
            <p className="price">50,000원 / 월</p>
            <div className="features">
              ✅ 모든 프로 기능
              <br />
              ✅ 무제한 프로젝트
              <br />✅ 팀 협업 기능 포함
            </div>
            <button className="select-btn blue-btn">요금제 선택</button>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-left">
          <img src="/images/logo.png" alt="logo" />
        </div>
        <div className="footer-right">
          <div className="footer-links">
            문의 <span>|</span> 개인정보처리방침
          </div>
          <div>2025 Team 꽤뚫어뷰</div>
          <div>이메일 (????????@gmail.com)</div>
        </div>
      </footer>
    </div>
  );
}

export default Main;
