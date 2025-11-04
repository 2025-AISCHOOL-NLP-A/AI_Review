import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/join" element={<LoginJoin />} />
        <Route path="/login/find" element={<LoginFind />} />
        <Route path="/wp" element={<div>Workplace Page (wp.html)</div>} />
      </Routes>
    </Router>
  );
}

export default App;

