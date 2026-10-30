import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import PlanCard from '../components/PlanCard.jsx';
import Footer from '../components/Footer.jsx';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setErrorMessage('');
    api
      .getPlans()
      .then((data) => {
        setPlans(data);
      })
      .catch((error) => {
        setErrorMessage(error.message || 'Failed to load pricing plans');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSelectPlan = async (plan) => {
    setErrorMessage('');
    setInfoMessage('');
    if (!user) {
      if (plan.name === 'Free') {
        navigate('/courses');
      } else {
        navigate('/courses/2');
      }
      return;
    }
    try {
      const updatedUser = await api.subscribePlan(plan.id);
      updateUser(updatedUser);
      setInfoMessage(`Subscribed to ${plan.name} plan.`);
    } catch (error) {
      setErrorMessage(error.message || 'Could not update subscription');
    }
  };

  return (
    <main id="screen-pricing">
      <section className="pricing-section">
        <h1 className="pricing-heading">Affordable pricing</h1>

        {errorMessage && <div className="status-banner error">{errorMessage}</div>}
        {infoMessage && <div className="status-banner info">{infoMessage}</div>}

        {loading ? (
          <div className="loading-state">Loading plans...</div>
        ) : (
          <div className="pricing-grid">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                user={user}
                onSelectPlan={handleSelectPlan}
              />
            ))}
          </div>
        )}
      </section>

      <section className="cta-dark-wrap">
        <div className="cta-dark-box">
          <h2>Online coaching lessons for remote learning.</h2>
          <p>
            CodeNest is a school at your palms empowering the next generation of innovative minds
          </p>
          <button
            type="button"
            className="btn-cta-teal"
            onClick={() => navigate('/courses')}
          >
            Start learning now
          </button>
        </div>
        <div className="bottom-divider"></div>
      </section>

      <Footer />
    </main>
  );
}
