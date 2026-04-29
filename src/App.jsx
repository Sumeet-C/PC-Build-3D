// ─── PC Builder System (India Edition) – App Router ─────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import AIResultPage from './pages/AIResultPage.jsx';
import CustomResultPage from './pages/CustomResultPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import './App.css';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const isHome = location.pathname === '/';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <div className="app">
      {/* ─── Navbar ─── */}
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
            </svg>
          </div>
          <span className="brand-text">PC Builder <span className="brand-accent">India</span></span>
        </Link>

        <div className="nav-links">
          <Link to="/" className={`nav-link ${isHome ? 'active' : ''}`}>Home</Link>
          <a href="#smart-builder" className="nav-link" onClick={(e) => {
            if (isHome) { e.preventDefault(); document.getElementById('smart-builder')?.scrollIntoView({ behavior: 'smooth' }); }
          }}>AI Builder</a>
          <a href="#custom-builder" className="nav-link" onClick={(e) => {
            if (isHome) { e.preventDefault(); document.getElementById('custom-builder')?.scrollIntoView({ behavior: 'smooth' }); }
          }}>Custom Builder</a>
        </div>

        <div className="nav-auth">
          {isAuthenticated ? (
            <div className="profile-wrapper" ref={dropdownRef}>
              <button className="profile-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="profile-avatar">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="profile-name">{user?.name || 'User'}</span>
                <svg className={`profile-chevron ${dropdownOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                    <div>
                      <div className="dropdown-name">{user?.name}</div>
                      <div className="dropdown-email">{user?.email}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/dashboard'); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    Dashboard
                  </button>
                  <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-nav-login">Sign In</Link>
              <Link to="/register" className="btn-nav-register">Register</Link>
            </div>
          )}
        </div>
      </nav>

      {/* ─── Page Content ─── */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/ai-result" element={<ProtectedRoute><AIResultPage /></ProtectedRoute>} />
          <Route path="/custom-result" element={<ProtectedRoute><CustomResultPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        </Routes>
      </main>

      {/* ─── Footer ─── */}
      <footer className="app-footer">
        <p>PC Builder System (India Edition) — Dynamic, Database-Driven PC Configuration Tool</p>
      </footer>
    </div>
  );
}
