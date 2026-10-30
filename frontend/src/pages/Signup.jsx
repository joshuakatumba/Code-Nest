import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Footer from '../components/Footer.jsx';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signupUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    try {
      await signupUser(name, email, password);
      navigate('/progress');
    } catch (error) {
      setErrorMessage(error.message || 'Sign up failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <section className="auth-page-section">
        <div className="auth-card">
          <h1>Create Account</h1>
          <p className="auth-sub">Start your coding journey with CodeNest Kampala</p>

          {errorMessage && <div className="status-banner error">{errorMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="signup-name">Student Name</label>
              <input
                id="signup-name"
                type="text"
                className="form-input"
                placeholder="Katumba"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                type="email"
                className="form-input"
                placeholder="student@codenest.ug"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
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
              {submitting ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-switch-text">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
