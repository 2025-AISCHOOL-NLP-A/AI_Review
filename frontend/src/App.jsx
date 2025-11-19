import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Main from "./pages/main/Main";
import Login from "./pages/auth/Login";
import LoginJoin from "./pages/auth/LoginJoin";
import LoginFind from "./pages/auth/LoginFind";
import Dashboard from "./pages/dashboard/Dashboard";
import Memberupdate from "./pages/user/Memberupdate";
import Memberdrop from "./pages/user/Memberdrop";
import PricingSystem from "./pages/dashboard/PricingSystem";
import Workplace from "./pages/dashboard/Workplace";
import ReviewManagement from "./pages/review/ReviewManagement";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { UserProvider } from "./contexts/UserContext";
import "./App.css";
import "./styles/variables.css";
import "./styles/common.css";

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
        {/* ✅ 기본 경로를 메인 페이지로 설정 */}
        <Route path="/" element={<Main />} />

        {/* 로그인 관련 페이지 */}
        <Route path="/login" element={<Login />} />
        <Route path="/login/join" element={<LoginJoin />} />
        <Route path="/login/find" element={<LoginFind />} />
        <Route path="/main" element={<Main />} />

        {/* 인증이 필요한 페이지 */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/memberupdate"
          element={
            <ProtectedRoute>
              <Memberupdate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pricingsystem"
          element={
            <ProtectedRoute>
              <PricingSystem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/memberdrop"
          element={
            <ProtectedRoute>
              <Memberdrop />
            </ProtectedRoute>
          }
        />

        {/* Workplace 페이지 */}
        <Route
          path="/wp"
          element={
            <ProtectedRoute>
              <Workplace />
            </ProtectedRoute>
          }
        />

        {/* 리뷰 관리 페이지 */}
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <ReviewManagement />
            </ProtectedRoute>
          }
        />

        {/* 🚧 존재하지 않는 경로는 메인으로 */}
        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
