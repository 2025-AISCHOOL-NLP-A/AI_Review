import React from "react";
import Sidebar from "../../components/layout/sidebar/Sidebar";
import Footer from "../../components/layout/Footer/Footer";
import "./dashboard.css";
import "../../components/layout/sidebar/sidebar.css";
import "./pricingsystem.css";
import "../../styles/common.css";

function PricingSystem() {
  return (
    <div className={`dashboard-page sidebar-open`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="dashboard-wrapper">
        <div className="dashboard-content" style={{ padding: "24px" }}>
          {/* 요금제 섹션 */}
          <section className="price-section" style={{ paddingTop: "40px" }}>
            <h1 className="section-title">요금제 안내</h1>
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
          {/* 요금제 비교표 */}
          <section className="compare-section">
            <h1 className="section-title">모든 기능 비교</h1>

            <div
              className="compare-table"
              role="table"
              aria-label="요금제 비교"
            >
              {/* 헤더 */}
              <div className="compare-row compare-header" role="row">
                <div
                  className="compare-cell compare-head feature-col"
                  role="columnheader"
                  aria-colindex={1}
                ></div>
                <div
                  className="compare-cell compare-head"
                  role="columnheader"
                  aria-colindex={2}
                >
                  프리
                </div>
                <div
                  className="compare-cell compare-head"
                  role="columnheader"
                  aria-colindex={3}
                >
                  프로
                </div>
                <div
                  className="compare-cell compare-head"
                  role="columnheader"
                  aria-colindex={4}
                >
                  프리미엄
                </div>
              </div>

              {/* 행 1: 리뷰 분석 */}
              <div className="compare-row" role="row">
                <div className="compare-cell feature-col" role="rowheader">
                  리뷰 분석
                </div>
                <div className="compare-cell" role="cell">
                  <span className="badge good" aria-label="지원">
                    ✔
                  </span>
                </div>
                <div className="compare-cell" role="cell">
                  <span className="badge good" aria-label="지원">
                    ✔
                  </span>
                </div>
                <div className="compare-cell" role="cell">
                  <span className="badge good" aria-label="지원">
                    ✔
                  </span>
                </div>
              </div>

              {/* 행 2: 리포트 다운로드 */}
              <div className="compare-row" role="row">
                <div className="compare-cell feature-col" role="rowheader">
                  리포트 다운로드
                </div>
                <div className="compare-cell" role="cell">
                  <span className="badge bad" aria-label="미지원">
                    ✖
                  </span>
                </div>
                <div className="compare-cell" role="cell">
                  <span className="badge good" aria-label="지원">
                    ✔
                  </span>
                </div>
                <div className="compare-cell" role="cell">
                  <span className="badge good" aria-label="지원">
                    ✔
                  </span>
                </div>
              </div>

              {/* 행 3: 협업 가능 */}
              <div className="compare-row" role="row">
                <div className="compare-cell feature-col" role="rowheader">
                  협업 가능
                </div>
                <div className="compare-cell" role="cell">
                  <span className="badge bad" aria-label="미지원">
                    ✖
                  </span>
                </div>
                <div className="compare-cell" role="cell">
                  <span className="badge bad" aria-label="미지원">
                    ✖
                  </span>
                </div>
                <div className="compare-cell" role="cell">
                  <span className="badge good" aria-label="지원">
                    ✔
                  </span>
                </div>
              </div>

              {/* 행 4: 프로젝트 수 */}
              <div className="compare-row" role="row">
                <div className="compare-cell feature-col" role="rowheader">
                  프로젝트 수
                </div>
                <div className="compare-cell" role="cell">
                  5
                </div>
                <div className="compare-cell" role="cell">
                  10
                </div>
                <div className="compare-cell" role="cell">
                  무제한
                </div>
              </div>
            </div>
          </section>

          {/* ===================== FOOTER ===================== */}
          <Footer />
        </div>
        {/* dashboard-content 끝 */}
      </div>
      {/* dashboard-wrapper 끝 */}
    </div>
  );
}

export default PricingSystem;

