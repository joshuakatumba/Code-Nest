import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location.pathname;
  const isHome = pathname === '/';
  const isCourses = pathname.startsWith('/courses');
  const isPricing = pathname === '/pricing';
  const isProgress = pathname === '/progress';

  const handleLogout = () => {
    logoutUser();
    navigate('/courses');
  };

  return (
    <header className="navbar">
      <Link to="/courses" className="brand-logo">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="28" fill="#18D2D6" />
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
          <Link to="/progress" className={isProgress ? 'active-link' : ''}>
            Progress
          </Link>
        </li>
      </ul>

      {user ? (
        <div className="user-profile" id="header-profile">
          <img
            src="/images/avatar-katumba.svg"
            alt={user.name}
            className="user-avatar"
          />
          <Link to="/progress" className="user-name">
            {user.name} <i className="fa-solid fa-chevron-down acc-chevron-icon"></i>
          </Link>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
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
  );
}
