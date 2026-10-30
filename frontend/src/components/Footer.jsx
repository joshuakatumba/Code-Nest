import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage('');
    setErrorMessage('');
    try {
      await api.subscribeNewsletter(email);
      setStatusMessage('Subscribed to newsletter.');
      setEmail('');
    } catch (error) {
      setErrorMessage(error.message || 'Could not subscribe');
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-logo">
        <svg width="46" height="46" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" fill="#3B82F6" opacity="0.2" />
          <path
            d="M18 39C21 46 28 49 36 48C44 47 49 41 50 35"
            stroke="#60A5FA"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M26 20L21 24L26 28M38 20L43 24L38 28M34 18L30 30"
            stroke="#60A5FA"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="newsletter-title">Subscribe to get our Newsletter</div>
      <form className="newsletter-form" onSubmit={handleSubmit}>
        <input
          type="email"
          aria-label="Newsletter email"
          className="newsletter-input"
          placeholder="Your Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit" className="btn-subscribe">
          Subscribe
        </button>
      </form>
      {statusMessage && <div className="newsletter-feedback">{statusMessage}</div>}
      {errorMessage && <div className="newsletter-feedback">{errorMessage}</div>}
      <div className="footer-links">
        <Link to="/courses">Courses</Link>
        <span className="divider">|</span>
        <a href="#privacy">Privacy Policy</a>
        <span className="divider">|</span>
        <a href="#terms">Terms &amp; Conditions</a>
      </div>
      <div className="footer-copy">© 2026 CodeNest Kampala.</div>
    </footer>
  );
}
