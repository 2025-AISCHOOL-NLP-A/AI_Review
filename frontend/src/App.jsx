import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Main from './components/Main';
import Login from './components/Login';
import LoginJoin from './components/LoginJoin';
import LoginFind from './components/LoginFind';
import './App.css';
import './styles/common.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* 기본 경로를 로그인으로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />
        <Route path="/login/join" element={<LoginJoin />} />
        <Route path="/login/find" element={<LoginFind />} />
        <Route path="/main" element={<Main />} />

        {/* 테스트용 or 임시 라우트 */}
        <Route path="/wp" element={<div>Workplace Page (wp.html)</div>} />
      </Routes>
    </Router>
  );
}

export default App;

