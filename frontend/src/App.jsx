import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Main from './components/Main';
import Login from './components/Login';
import LoginJoin from './components/LoginJoin';
import LoginFind from './components/LoginFind';
import Dashboard from './components/Dashboard';
import Memberupdate from './components/Memberupdate';
import PricingSystem from './components/PricingSystem';
import './App.css';
import './styles/common.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ 기본 경로를 메인 페이지로 설정 */}
        <Route path="/" element={<Main />} />

        {/* 로그인 관련 페이지 */}
        <Route path="/login" element={<Login />} />
        <Route path="/login/join" element={<LoginJoin />} />
        <Route path="/login/find" element={<LoginFind />} />
        <Route path="/main" element={<Main />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/memberupdate" element={<Memberupdate />} />
        <Route path="/pricingsystem" element={<PricingSystem />} />

        {/* 예비 페이지 */}
        <Route path="/wp" element={<div>Workplace Page (wp.html)</div>} />

        {/* 🚧 존재하지 않는 경로는 메인으로 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
