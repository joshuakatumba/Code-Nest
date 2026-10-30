import React from 'react';

export default function PlanCard({ plan, user, onSelectPlan }) {
  const isIndividual = plan.name === 'Individual';
  const isFree = plan.name === 'Free';
  const checkClass = isFree
    ? 'check-grey'
    : isIndividual
    ? 'check-yellow'
    : 'check-mint';
  const buttonLabel = isFree
    ? 'Try for free'
    : isIndividual
    ? 'Regular license'
    : 'Extended license';

  return (
    <div className={`price-card ${isIndividual ? 'featured' : ''}`}>
      <div>
        <div className="price-card-header">
          {!isFree && <span className="plan-tier">{plan.name}</span>}
          {isIndividual && <span className="badge-best">BEST!</span>}
        </div>
        <div className="price-amount">
          {isFree ? 'Free' : `$${plan.price_usd}`}{' '}
          <span className="price-period">/ {plan.period}</span>
        </div>
        <ul className="feature-list">
          {plan.features.map((featureText) => (
            <li key={featureText}>
              <span className={`check-circle ${checkClass}`}>
                <i className="fa-solid fa-check"></i>
              </span>
              {featureText}
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        className={isIndividual ? 'btn-plan-solid' : 'btn-plan-outline'}
        onClick={() => onSelectPlan(plan)}
      >
        {user && user.plan_id === plan.id ? 'Current Plan' : buttonLabel}
      </button>
    </div>
  );
}
