import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/main.css';
import '../styles/common.css';

function Main() {
  const navigate = useNavigate();

  return (
    <div className="main-page">
      <header>
        <button onClick={() => document.querySelector('.preview')?.scrollIntoView({ behavior: 'smooth' })}>
          시연영상
        </button>
        <button onClick={() => document.querySelector('.price-section')?.scrollIntoView({ behavior: 'smooth' })}>
          요금제
        </button>
        <button onClick={() => navigate('/login')}>로그인</button>
      </header>

      <section className="hero">
        <img src="/images/logo.png" alt="search icon" />
        <h1>AI가 고객 리뷰 속 숨은 인사이트를 찾아드립니다!</h1>
      </section>

      <section className="preview">
        <img src="/images/logo.png" alt="서비스 시연 화면" />
      </section>

      <section className="price-section">
        <h2>Price</h2>
        <div className="price-cards">
          <div className="card free">
            <h3>프리</h3>
            <p className="price">무료</p>
            <div className="features">
              ✅ 기본 리뷰 분석 제공<br />
              ✅ 제한적 프로젝트 수<br />
              ❌ 고급 통계 기능 미지원
            </div>
            <button className="select-btn free-btn">요금제 선택</button>
          </div>

          <div className="card pro">
            <h3>프로</h3>
            <p className="price">15,000원 / 월</p>
            <div className="features">
              ✅ 모든 기본 기능<br />
              ✅ 분석 리포트 다운로드<br />
              ✅ 프로젝트 10개
            </div>
            <button className="select-btn blue-btn">요금제 선택</button>
          </div>

          <div className="card premium">
            <h3>프리미엄</h3>
            <p className="price">50,000원 / 월</p>
            <div className="features">
              ✅ 모든 프로 기능<br />
              ✅ 무제한 프로젝트<br />
              ✅ 팀 협업 기능 포함
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
          <div className="footer-links">문의 <span>|</span> 개인정보처리방침</div>
          <div>2025 Team 꽤뚫어뷰</div>
          <div>이메일 (????????@gmail.com)</div>
        </div>
      </footer>
    </div>
  );
}

export default Main;

