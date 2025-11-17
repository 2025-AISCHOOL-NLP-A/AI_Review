// src/pages/main/Main.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import Footer from "../../components/layout/Footer/Footer";
import "./main.css";
import "../../styles/common.css";

function Main() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: userLoading } = useUser();
  const heroRef = useRef(null);
  const previewRef = useRef(null);
  const priceRef = useRef(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const controlsTimeoutRef = useRef(null);

  // 이미 로그인된 사용자가 메인 페이지에 접근하면 워크플레이스로 리다이렉트
  // 단, 로딩이 완전히 끝나고 실제로 인증된 상태일 때만 리다이렉트
  useEffect(() => {
    // 로딩이 완료되고 실제로 인증된 상태인지 확인
    // isAuthenticated가 null이 아닌 경우에만 체크 (초기 상태 제외)
    if (!userLoading && isAuthenticated === true) {
      // 토큰이 실제로 유효한지 한 번 더 확인
      const token = sessionStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const exp = payload.exp * 1000;
          // 토큰이 만료되지 않았을 때만 리다이렉트
          if (Date.now() < exp) {
            navigate('/wp', { replace: true });
          }
        } catch (error) {
          // 토큰 파싱 실패 시 리다이렉트하지 않음
        }
      }
    }
  }, [isAuthenticated, userLoading, navigate]);

  // 페이지 진입 시 맨 위로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // 비디오 이벤트 핸들러
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, []);

  // 재생 중일 때 컨트롤러 자동 숨김
  useEffect(() => {
    if (isPlaying && !isDragging) {
      // 재생 중일 때 3초 후 컨트롤러 숨김
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      // 일시정지이거나 드래그 중일 때는 컨트롤러 표시
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isDragging]);

  // 시간 포맷팅 함수
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 타임라인 클릭/드래그 핸들러
  const handleTimelineClick = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // 타임라인 드래그 시작
  const handleTimelineMouseDown = (e) => {
    setIsDragging(true);
    handleTimelineClick(e);
  };

  // 타임라인 드래그 중
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const timeline = document.querySelector('.video-timeline');
      if (!timeline) return;
      
      const rect = timeline.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = percentage * duration;
      
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);

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
          <button onClick={() => smoothScrollTo(heroRef.current)}>홈</button>
          <button onClick={() => smoothScrollTo(previewRef.current)}>시연영상</button>
          <button onClick={() => smoothScrollTo(priceRef.current)}>요금제</button>
          <span className="nav-divider"></span>
          <button className="login-btn" onClick={() => navigate("/login")}>로그인</button>
        </nav>
      </header>

      {/* ===================== HERO SECTION ===================== */}
      <section className="hero" ref={heroRef}>
        <img src="/images/logo.png" alt="서비스 로고" className="hero-logo" />
        <h1 className="hero-title">
          AI가 고객 리뷰 속 <br />
          숨은 인사이트를 찾아드립니다!
        </h1>
        <p className="hero-subtitle">
          리뷰 분석 자동화 플랫폼, <strong>꿰뚫어뷰</strong>와 함께하세요.
        </p>
        <p className="hero-description">
          AI 리뷰 분석은 고객이 진짜로 원하는 것을 찾아내는 가장 빠른 방법입니다.<br />
          숨은 불만과 강점을 파악해, 제품 전략과 마케팅 방향을 개선할 수 있습니다.<br />
          데이터에서 행동으로, 인사이트를 실행으로 바꾸세요
        </p>
      </section>

      {/* ===================== PREVIEW SECTION ===================== */}
      <section className="preview" ref={previewRef}>
        <h2 className="section-title">서비스 시연</h2>
        <div className="preview-video">
          <div className="video-wrapper">
            <video 
              ref={videoRef}
              muted 
              loop
              controls={false}
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              onPlay={() => {
                setIsPlaying(true);
                setShowControls(true);
              }}
              onPause={() => {
                setIsPlaying(false);
                setShowControls(true);
              }}
              onMouseEnter={() => {
                setShowControls(true);
                if (controlsTimeoutRef.current) {
                  clearTimeout(controlsTimeoutRef.current);
                }
              }}
              onMouseLeave={() => {
                if (isPlaying && !isDragging) {
                  controlsTimeoutRef.current = setTimeout(() => {
                    setShowControls(false);
                  }, 3000);
                }
              }}
            >
              <source src="/videos/test_video.mp4" type="video/mp4" />
              브라우저가 비디오 태그를 지원하지 않습니다.
            </video>
            {!isPlaying && (
              <button 
                className="video-play-button"
                onClick={() => {
                  videoRef.current?.play();
                  setIsPlaying(true);
                }}
                aria-label="재생"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="64" height="64">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            )}
            {/* 커스텀 비디오 컨트롤러 */}
            <div className={`video-controls ${showControls || !isPlaying ? 'show' : 'hide'}`}>
              <div className="video-controls-top">
                <button
                  className="video-control-btn"
                  onClick={() => {
                    if (isPlaying) {
                      videoRef.current?.pause();
                      setIsPlaying(false);
                    } else {
                      videoRef.current?.play();
                      setIsPlaying(true);
                    }
                  }}
                  aria-label={isPlaying ? "일시정지" : "재생"}
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
                <span className="video-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
              {/* 타임라인 (프로그레스 바) */}
              <div 
                className="video-timeline" 
                onClick={handleTimelineClick}
                onMouseDown={handleTimelineMouseDown}
              >
                <div 
                  className="video-timeline-progress" 
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                ></div>
                <div 
                  className="video-timeline-handle"
                  style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
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
      <Footer />
    </div>
  );
}

export default Main;

