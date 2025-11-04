import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
  RadarController
} from 'chart.js';
import html2pdf from 'html2pdf.js';
import '../styles/dashboard.css';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
  RadarController
);

function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const dailyTrendChartRef = useRef(null);
  const radarChartRef = useRef(null);
  const splitBarChartRef = useRef(null);
  const dashboardContentRef = useRef(null);
  const downloadBtnRef = useRef(null);
  
  const dailyTrendChartInstance = useRef(null);
  const radarChartInstance = useRef(null);
  const splitBarChartInstance = useRef(null);

  // Color constants
  const primaryColor = '#5B8EFF';
  const neutralColor = '#CBD5E1';
  const newReviewColor = '#111827';
  const positiveHighlight = '#10B981';
  const negativeHighlight = '#EF4444';
  const fontColor = '#333333';

  // Data
  const dailyTrendData = {
    dates: ['1/15', '1/18', '1/21', '1/24', '1/27', '1/30', '2/02', '2/07'],
    positive: [62, 65, 68, 70, 72, 75, 77, 78],
    negative: [38, 35, 32, 30, 28, 25, 23, 22],
    newReviews: [120, 150, 200, 250, 280, 300, 305, 310]
  };

  const radarData = {
    labels: ['디자인', '착용감', '음질', '배터리', '전원 효율', '브랜드 신뢰도'],
    positive: [90, 82, 75, 60, 55, 88],
    negative: [10, 18, 25, 40, 45, 12],
  };

  const splitBarRawData = [
    { label: '가격', negRatio: 80, negCount: 100, posRatio: 20, posCount: 25 },
    { label: '디자인', negRatio: 10, negCount: 15, posRatio: 90, posCount: 150 },
    { label: '음질', negRatio: 25, negCount: 30, posRatio: 75, posCount: 90 },
    { label: '배터리', negRatio: 40, negCount: 50, posRatio: 60, posCount: 70 },
    { label: '착용감', negRatio: 18, negCount: 20, posRatio: 82, posCount: 95 },
  ];

  const correlationLabels = ['디자인', '가격', '품질', '배터리', '착용감'];
  const correlationMatrix = {
    '디자인': { '가격': 0.82, '품질': 0.45, '배터리': 0.22, '착용감': 0.35 },
    '가격': { '품질': 0.78, '배터리': 0.32, '착용감': 0.18 },
    '품질': { '배터리': 0.41, '착용감': 0.33 },
    '배터리': { '착용감': 0.27 }
  };

  const reviewSamples = [
    { date: '2/02', content: '디자인은 예쁘고 착용감도 좋아요', summary: [{ text: '디자인', type: 'pos' }, { text: '착용감', type: 'pos' }] },
    { date: '2/05', content: '배터리가 너무 빨리 닳아요', summary: [{ text: '배터리', type: 'neg' }] },
    { date: '2/06', content: '노이즈 캔슬링이 대박이에요', summary: [{ text: '음질', type: 'pos' }, { text: '기능', type: 'pos' }] },
    { date: '2/07', content: '가격이 좀 비싸지만 만족해요', summary: [{ text: '가격', type: 'neg' }, { text: '만족', type: 'pos' }] },
  ];

  // Initialize charts
  useEffect(() => {
    let isMounted = true;

    const initializeCharts = () => {
      try {
        if (dailyTrendChartRef.current && !dailyTrendChartInstance.current && isMounted) {
          const ctx = dailyTrendChartRef.current.getContext('2d');
          if (ctx) {
            dailyTrendChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dailyTrendData.dates,
          datasets: [{
            label: '긍정 비율 (%)',
            data: dailyTrendData.positive,
            backgroundColor: primaryColor,
            yAxisID: 'y',
            stack: 'Stack 0',
          }, {
            label: '부정 비율 및 기타 (%)',
            data: dailyTrendData.negative,
            backgroundColor: neutralColor,
            yAxisID: 'y',
            stack: 'Stack 0',
          }, {
            type: 'line',
            label: '해당일 신규 리뷰 수 (건수)',
            data: dailyTrendData.newReviews,
            borderColor: newReviewColor,
            borderWidth: 2,
            pointBackgroundColor: newReviewColor,
            yAxisID: 'y1',
            fill: false,
            tension: 0.3,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          aspectRatio: 1.5,
          layout: {
            padding: {
              top: 20
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: { color: fontColor }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
            }
          },
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: {
                padding: 10
              }
            },
            y: {
              stacked: true,
              position: 'left',
              title: { display: true, text: '비율 (%)', color: primaryColor },
              max: 100,
              ticks: { color: primaryColor }
            },
            y1: {
              position: 'right',
              title: { display: true, text: '신규 리뷰 수 (건수)', color: newReviewColor },
              grid: { drawOnChartArea: false },
              ticks: { color: newReviewColor }
            }
          }
        }
            });
          }
        }

        if (radarChartRef.current && !radarChartInstance.current && isMounted) {
          const ctx = radarChartRef.current.getContext('2d');
          if (ctx) {
            radarChartInstance.current = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: radarData.labels,
          datasets: [{
            label: '긍정 비율',
            data: radarData.positive,
            backgroundColor: 'rgba(91, 142, 255, 0.4)',
            borderColor: primaryColor,
            pointBackgroundColor: primaryColor,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: primaryColor
          }, {
            label: '부정 비율',
            data: radarData.negative,
            backgroundColor: 'rgba(203, 213, 225, 0.4)',
            borderColor: neutralColor,
            pointBackgroundColor: neutralColor,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: neutralColor
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: fontColor }
            }
          },
          scales: {
            r: {
              angleLines: { color: '#E5E7EB' },
              grid: { color: '#E5E7EB' },
              pointLabels: { color: fontColor, font: { size: 14 } },
              suggestedMin: 0,
              suggestedMax: 100,
              ticks: {
                stepSize: 20,
                backdropColor: 'rgba(255, 255, 255, 0.7)',
                color: fontColor
              }
            }
          }
        }
            });
          }
        }

        if (splitBarChartRef.current && !splitBarChartInstance.current && isMounted) {
          const ctx = splitBarChartRef.current.getContext('2d');
          if (ctx) {
            const labels = splitBarRawData.map(d => d.label);
            const negData = splitBarRawData.map(d => -d.negRatio);
            const posData = splitBarRawData.map(d => d.posRatio);

            splitBarChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: '부정 비율 (왼쪽)',
            data: negData,
            backgroundColor: neutralColor,
            barPercentage: 0.7
          }, {
            label: '긍정 비율 (오른쪽)',
            data: posData,
            backgroundColor: primaryColor,
            barPercentage: 0.7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              position: 'top',
              labels: { color: fontColor }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const rawValue = Math.abs(context.raw);
                  const count = context.datasetIndex === 0 
                    ? splitBarRawData[context.dataIndex].negCount 
                    : splitBarRawData[context.dataIndex].posCount;
                  return `${context.dataset.label}: ${rawValue}% (${count}개)`;
                }
              }
            }
          },
          scales: {
            x: {
              stacked: true,
              min: -100,
              max: 100,
              ticks: {
                callback: function(value) {
                  return Math.abs(value) + '%';
                },
                color: fontColor
              },
              title: {
                display: true,
                text: '감정 비율'
              },
              grid: {
                color: (context) => (context.tick.value === 0 ? '#000' : '#E5E7EB')
              }
            },
            y: {
              stacked: true,
              grid: { display: false },
              ticks: { color: fontColor }
            }
          }
        }
            });
          }
        }
      } catch (error) {
        console.error('Chart initialization error:', error);
      }
    };

    // Delay initialization slightly to ensure DOM is ready
    // Use requestAnimationFrame to ensure DOM is fully rendered
    let timeoutId = null;
    const initTimer = requestAnimationFrame(() => {
      timeoutId = setTimeout(() => {
        if (isMounted) {
          initializeCharts();
        }
      }, 500);
    });

    // Cleanup
    return () => {
      isMounted = false;
      cancelAnimationFrame(initTimer);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (dailyTrendChartInstance.current) {
        try {
          dailyTrendChartInstance.current.destroy();
        } catch (error) {
          console.error('Error destroying daily trend chart:', error);
        }
        dailyTrendChartInstance.current = null;
      }
      if (radarChartInstance.current) {
        try {
          radarChartInstance.current.destroy();
        } catch (error) {
          console.error('Error destroying radar chart:', error);
        }
        radarChartInstance.current = null;
      }
      if (splitBarChartInstance.current) {
        try {
          splitBarChartInstance.current.destroy();
        } catch (error) {
          console.error('Error destroying split bar chart:', error);
        }
        splitBarChartInstance.current = null;
      }
    };
  }, []);

  const handlePDFDownload = () => {
    if (!dashboardContentRef.current) return;

    const downloadButton = downloadBtnRef.current;
    if (downloadButton) {
      downloadButton.style.display = 'none';
    }

    const opt = {
      margin: 1,
      filename: '에어팟프로_리뷰_분석_리포트.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, logging: true, dpi: 192, letterRendering: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(dashboardContentRef.current).save().then(() => {
      if (downloadButton) {
        downloadButton.style.display = 'flex';
      }
    });
  };

  const renderHeatmap = () => {
    let html = [];
    correlationLabels.forEach((rowLabel, rowIndex) => {
      let rowCells = [];
      rowCells.push(
        <div key={`label-${rowIndex}`} className="text-xs font-semibold text-gray-600">
          {rowLabel}
        </div>
      );

      correlationLabels.forEach((colLabel, colIndex) => {
        let cellContent = '-';
        let bgColor = 'bg-gray-100';
        let value = null;

        if (rowIndex === colIndex) {
          cellContent = '-';
          bgColor = 'bg-gray-100';
        } else if (rowIndex > colIndex) {
          value = correlationMatrix[colLabel] ? correlationMatrix[colLabel][rowLabel] : null;
        } else {
          value = correlationMatrix[rowLabel] ? correlationMatrix[rowLabel][colLabel] : null;
        }

        if (value !== null) {
          const normalized = (value - 0.18) / (0.82 - 0.18);
          const intensity = Math.min(5, Math.max(0, Math.round(normalized * 5)));
          const bgClasses = [
            'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 
            'bg-blue-400', 'bg-blue-500', 'bg-blue-600'
          ];
          bgColor = bgClasses[intensity] || 'bg-blue-200';

          let icon = '🔵';
          if (value >= 0.7) icon = '🔵';
          else if (value >= 0.4) icon = '🔵';
          else if (value >= 0.2) icon = '🔵';

          cellContent = (
            <span>
              <span className="text-lg">{icon}</span>{' '}
              <span className="font-medium">{value.toFixed(2)}</span>
            </span>
          );
        }

        rowCells.push(
          <div 
            key={`cell-${rowIndex}-${colIndex}`}
            className={`p-1 h-full flex flex-col justify-center items-center ${bgColor} rounded-sm`}
          >
            {cellContent}
          </div>
        );
      });

      html.push(
        <div key={`row-${rowIndex}`} className="grid grid-cols-6 items-center border-b border-gray-100 py-2">
          {rowCells}
        </div>
      );
    });
    return html;
  };

  return (
    <div className={`dashboard-page ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-main" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {sidebarOpen && <span className="sidebar-brand">리뷰 분석</span>}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#" className="sidebar-nav-item active">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {sidebarOpen && <span>대시보드</span>}
          </a>
          
          <a href="#" className="sidebar-nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {sidebarOpen && <span>분석 리포트</span>}
          </a>
          
          <a href="#" className="sidebar-nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {sidebarOpen && <span>리뷰 관리</span>}
          </a>
          
          <div className="sidebar-nav-item-parent">
            <a 
              href="#" 
              className={`sidebar-nav-item ${settingsOpen ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setSettingsOpen(!settingsOpen);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {sidebarOpen && (
                <>
                  <span>설정</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 ml-auto transition-transform ${settingsOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </a>
            {sidebarOpen && settingsOpen && (
              <div className="sidebar-submenu">
                <a 
                  href="#" 
                  className="sidebar-submenu-item" 
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/memberupdate');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>회원정보 수정</span>
                </a>
                <a href="#" className="sidebar-submenu-item" onClick={(e) => e.preventDefault()}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>요금제 관리</span>
                </a>
                <a href="#" className="sidebar-submenu-item" onClick={(e) => e.preventDefault()}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>회원 탈퇴</span>
                </a>
              </div>
            )}
          </div>
        </nav>
        
        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">관리자</div>
                <div className="sidebar-user-email">admin@example.com</div>
              </div>
            </div>
          )}
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="dashboard-wrapper">
        <div id="dashboard-content" ref={dashboardContentRef} className="dashboard-content">
        {/* Header & Filter Section */}
        <header className="pt-6 pb-4">
          <h1 className="text-3xl font-extrabold text-gray-800">리뷰 분석 대시보드</h1>
          <div className="mt-4 p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between bg-white rounded-xl shadow-sm">
            <div className="mb-3 md:mb-0">
              <span className="text-xs font-semibold uppercase text-gray-500 mr-2">분석 대상</span>
              <span className="text-2xl font-bold text-gray-900">에어팟 프로 3</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-gray-600">필터 기간: 2025.01.15 ~ 2025.02.07</span>
              <button className="bg-main text-white px-4 py-2 rounded-lg font-medium hover-opacity-90 transition shadow-md flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                🔍 적용하기
              </button>
              <button className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg font-medium hover-bg-gray-300 transition flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* 1. KPI Summary Cards */}
        <div className="kpi-cards-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card kpi-card">
            <h3 className="text-sm font-medium text-gray-500">💬 총 리뷰 수</h3>
            <div className="mt-1 flex items-end justify-between">
              <p className="text-3xl font-extrabold text-gray-900">1,235건</p>
              <span className="kpi-change-up text-sm font-semibold">+12%</span>
            </div>
            <p className="mt-2 text-xs text-gray-400">분석 대상 전체 리뷰 수</p>
          </div>
          <div className="card kpi-card">
            <h3 className="text-sm font-medium text-gray-500">😀 긍정 비율</h3>
            <div className="mt-1 flex items-end justify-between">
              <p className="text-3xl font-extrabold text-gray-900">78%</p>
              <span className="kpi-change-up text-sm font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.47 10.74a.75.75 0 010-1.06l3.75-3.75a.75.75 0 011.06 0l3.75 3.75a.75.75 0 01-1.06 1.06L10 7.31l-3.22 3.22a.75.75 0 01-1.06 0z" clipRule="evenodd" />
                </svg>
                +3%
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-400">긍정 평가 비중</p>
          </div>
          <div className="card kpi-card">
            <h3 className="text-sm font-medium text-gray-500">😟 부정 비율</h3>
            <div className="mt-1 flex items-end justify-between">
              <p className="text-3xl font-extrabold text-gray-900">12%</p>
              <span className="kpi-change-down text-sm font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.53 9.26a.75.75 0 010 1.06l-3.75 3.75a.75.75 0 01-1.06 0l-3.75-3.75a.75.75 0 011.06-1.06L10 12.69l3.22-3.22a.75.75 0 011.06 0z" clipRule="evenodd" />
                </svg>
                -2%
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-400">부정 평가 비중</p>
          </div>
          <div className="card kpi-card">
            <h3 className="text-sm font-medium text-gray-500">⭐ 종합 스코어</h3>
            <div className="mt-1 flex items-end justify-between">
              <p className="text-3xl font-extrabold text-gray-900">4.5 / 5.0</p>
              <span className="kpi-change-up text-sm font-semibold">+0.2</span>
            </div>
            <p className="mt-2 text-xs text-gray-400">전체 감정 점수 기반 산출</p>
          </div>
        </div>

        {/* Main Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch" id="main-chart-section">
          <div className="card lg:col-span-3 flex flex-col" id="daily-trend-card">
            <h2 className="text-xl font-semibold mb-4">📊 일자별 긍·부정 포함 리뷰 비율</h2>
            <div className="relative h-96 flex-1">
              <canvas ref={dailyTrendChartRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
              <h4 className="font-bold text-gray-700 mb-1">📈 결과 요약:</h4>
              <p>긍정 언급 62% → 78%로 상승, 부정 언급 38% → 22%로 감소. 해당일 리뷰 수: 120건 → 310건. 펌웨어 업데이트 이후 "노이즈 캔슬링" 관련 긍정 리뷰 급증.</p>
            </div>
          </div>

          <div className="card lg:col-span-2 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">🕸️ 속성별 감정 밸런스</h2>
            <div className="relative h-96 flex-1">
              <canvas ref={radarChartRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
              <h4 className="font-bold text-gray-700 mb-1">📈 해석:</h4>
              <p>"디자인", "브랜드 신뢰도"는 긍정 비중 높음. "배터리", "전원 효율"은 부정 피드백 상대적으로 많음.</p>
            </div>
          </div>
        </div>

        {/* Detailed Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">📊 속성별 긍·부정 분기형 막대 그래프</h2>
            <div className="relative h-96">
              <canvas ref={splitBarChartRef}></canvas>
            </div>
          </div>

          <div className="card lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">🔥 속성 상관관계 히트맵</h2>
            <div className="grid grid-cols-6 text-center text-sm font-semibold border-b border-gray-200 pb-2">
              <div className="text-gray-500"></div>
              <div className="text-gray-600">디자인</div>
              <div className="text-gray-600">가격</div>
              <div className="text-gray-600">품질</div>
              <div className="text-gray-600">배터리</div>
              <div className="text-gray-600">착용감</div>
            </div>
            <div className="mt-2 text-xs">
              {renderHeatmap()}
            </div>
            <p className="mt-4 text-xs text-gray-500">
              <span className="text-main font-bold">🔵</span> 진할수록 함께 언급되는 빈도가 높음.<br />
              예: 디자인–가격(0.82) → "디자인 만족도"가 "가격 인식"에 영향
            </p>
          </div>
        </div>

        {/* Word Cloud & Review Sample */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">🌈 감정 워드클라우드</h2>
            <div className="flex flex-wrap gap-3">
              <span style={{ fontSize: '36px', color: primaryColor }} className="font-bold">만족</span>
              <span style={{ fontSize: '30px', color: primaryColor }}>디자인</span>
              <span style={{ fontSize: '28px', color: primaryColor }}>음질</span>
              <span style={{ fontSize: '24px', color: primaryColor }}>편안</span>
              <span style={{ fontSize: '22px', color: primaryColor }}>착용감</span>
              <span style={{ fontSize: '20px', color: primaryColor }}>노캔좋음</span>
            </div>
            <div className="border-t border-gray-100 my-4"></div>
            <div className="flex flex-wrap gap-3">
              <span style={{ fontSize: '36px', color: neutralColor }} className="font-bold">비싸다</span>
              <span style={{ fontSize: '30px', color: neutralColor }}>배터리</span>
              <span style={{ fontSize: '26px', color: neutralColor }}>무겁다</span>
              <span style={{ fontSize: '22px', color: neutralColor }}>끊김</span>
              <span style={{ fontSize: '20px', color: neutralColor }}>발열</span>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">💬 리뷰 원문 샘플</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <th className="px-3 py-3 text-left">날짜</th>
                    <th className="px-3 py-3 text-left">리뷰 내용</th>
                    <th className="px-3 py-3 text-left">감정 요약</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {reviewSamples.map((review, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{review.date}</td>
                      <td className="px-3 py-2 text-gray-900">{review.content}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {review.summary.map((item, i) => {
                          const tagClass = item.type === 'pos' ? 'bg-pos-light text-pos' : 'bg-neg-light text-neg';
                          const tagIcon = item.type === 'pos' ? '🟩' : '🟥';
                          return (
                            <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass} mr-1`}>
                              {tagIcon} {item.text}
                            </span>
                          );
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Insights and AI Report Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">A. 핵심 인사이트</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              👍 전체 긍정률 78%로 상승 중
              '디자인·착용감·음질' 주요 강점
            </p>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">B. 개선 제안</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              ⚙️ 배터리 지속시간 관련 부정 리뷰 40%↑
              전원 효율 개선 필요
            </p>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">C. 리뷰 샘플</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              💬 "디자인은 예쁜데 가격이 비싸요."
              💬 "소음이 거의 없어 만족합니다."
              💬 "배터리 빨리 닳아요."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">🤖 AI 인사이트 리포트</h2>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm whitespace-pre-wrap text-gray-800">
              🔍 AI 자동 분석 요약
              - 긍정 요인: 디자인, 착용감, 음질 (전체 리뷰의 70% 이상)
              - 부정 요인: 배터리 지속시간, 가격
              - 인사이트: 신규 리뷰 유입과 함께 긍정률 상승. 펌웨어 업데이트 영향 가능성 높음.
            </div>
          </div>
        </div>

        {/* PDF Download Button */}
        <div className="pt-4 pb-12 flex justify-center">
          <button
            ref={downloadBtnRef}
            onClick={handlePDFDownload}
            className="bg-main text-white px-8 py-3 rounded-xl font-bold text-lg hover-opacity-90 transition shadow-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            📥 [ 리포트 PDF 다운로드 ]
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
