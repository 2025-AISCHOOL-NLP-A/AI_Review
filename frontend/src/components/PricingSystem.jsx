import React from "react";
import Sidebar from "./Sidebar";
import "../styles/dashboard.css";
import "../styles/sidebar.css";
import "../styles/pricingsystem.css";
import "../styles/common.css";

function PricingSystem() {
  return (
    <div className={`dashboard-page sidebar-open`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="dashboard-wrapper">
        <div className="dashboard-content" style={{ padding: "24px" }}>
          <header className="pt-6 pb-4">
            <h1 className="text-3xl font-extrabold text-gray-800">
              요금제 관리
            </h1>
          </header>

          {/* 요금제 섹션 */}
          <section className="price-section" style={{ paddingTop: "40px" }}>
            <h2 className="section-title">요금제 안내</h2>
            <div className="price-cards">
              {/* 프리 Plan */}
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

              {/* 프로 Plan */}
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

              {/* 프리미엄 Plan */}
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
        </div>
      </div>
    </div>
  );
}

export default PricingSystem;
