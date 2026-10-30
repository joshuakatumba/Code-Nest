import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Footer from '../components/Footer.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    try {
      await loginUser(email, password);
      navigate('/progress');
    } catch (error) {
      setErrorMessage(error.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <section className="auth-page-section">
        <div className="auth-card">
          <h1>Welcome Back</h1>
          <p className="auth-sub">Log in to your CodeNest student account</p>

          {errorMessage && <div className="status-banner error">{errorMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="katumba@codenest.ug"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-plan-solid"
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="auth-switch-text">
            Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
