import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location.pathname;
  const isHome = pathname === '/';
  const isAbout = pathname === '/about';
  const isCourses = pathname.startsWith('/courses');
  const isPricing = pathname === '/pricing';
  const isProgress = pathname === '/progress';

  const handleLogout = () => {
    setMenuOpen(false);
    logoutUser();
    navigate('/courses');
  };

  const planNames = { 1: 'Free Plan', 2: 'Individual Plan', 3: 'Corporate Plan' };
  const activePlanLabel = user?.plan_id ? planNames[user.plan_id] || 'Active Plan' : 'Free Plan';

  return (
    <div className={isHome ? 'navbar-home-wrapper' : ''}>
      <header className={`navbar ${isHome ? 'navbar-home' : ''}`}>
        <Link to="/" className="brand-logo">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="#18D2D6"
              stroke={isHome ? 'rgba(255, 255, 255, 0.55)' : 'none'}
              strokeWidth="2"
            />
            <path
              d="M18 39C21 46 28 49 36 48C44 47 49 41 50 35"
              stroke="#fff"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M22 44C27 48 37 48 44 43"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="25" cy="29" r="5" fill="#fff" />
            <path
              d="M26 20L21 24L26 28"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M38 20L43 24L38 28"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M34 18L30 30"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="brand-name">CodeNest</span>
        </Link>

        <ul className="nav-links">
          <li>
            <Link to="/" className={isHome ? 'active-link' : ''}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/courses" className={isCourses ? 'active-link' : ''}>
              Courses
            </Link>
          </li>
          <li>
            <Link to="/pricing" className={isPricing ? 'active-link' : ''}>
              Pricing
            </Link>
          </li>
          <li>
            <Link to="/about" className={isAbout ? 'active-link' : ''}>
              About Us
            </Link>
          </li>
          <li>
            <Link to="/progress" className={isProgress ? 'active-link' : ''}>
              Progress
            </Link>
          </li>
        </ul>

        {user ? (
          <div className="user-profile-container">
            <div className="user-profile" id="header-profile">
              <img
                src="/images/avatar-katumba.svg"
                alt={user.name}
                className="user-avatar"
                onClick={() => setMenuOpen((prev) => !prev)}
              />
              <button
                type="button"
                className="user-name-btn"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                {user.name}{' '}
                <i
                  className={`fa-solid ${
                    menuOpen ? 'fa-chevron-up' : 'fa-chevron-down'
                  } acc-chevron-icon`}
                ></i>
              </button>
              <button type="button" className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>

            {menuOpen && (
              <div className="profile-dropdown-menu">
                <div className="profile-dropdown-meta">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  <span className="badge-level">{activePlanLabel}</span>
                </div>
                <Link
                  to="/progress"
                  className="profile-dropdown-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="fa-solid fa-chart-line"></i> Student Dashboard
                </Link>
                <Link
                  to="/courses"
                  className="profile-dropdown-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="fa-solid fa-book-open"></i> Browse &amp; Manage Courses
                </Link>
                <Link
                  to="/pricing"
                  className="profile-dropdown-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="fa-solid fa-tag"></i> Subscription Plan
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons" id="header-auth">
            <Link to="/login" className="btn-login">
              Login
            </Link>
            <Link to="/signup" className="btn-signup">
              Sign Up
            </Link>
          </div>
        )}
      </header>
    </div>
  );
}
