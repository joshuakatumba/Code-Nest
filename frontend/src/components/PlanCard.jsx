import React from 'react';

export default function PlanCard({ plan, user, onSelectPlan }) {
  const isSchool = plan.name === 'School program';
  const isHoliday = plan.name === 'Holiday club, 2 weeks';

  const checkClass = isSchool
    ? 'check-yellow'
    : isHoliday
    ? 'check-mint'
    : 'check-grey';

  const buttonLabel = isSchool
    ? 'Select School Program'
    : isHoliday
    ? 'Join Holiday Club'
    : 'Order Starter Pack';

  const formattedAmount = `UGX ${Math.round(plan.price_usd).toLocaleString('en-US')}`;

  return (
    <div className={`price-card ${isSchool ? 'featured' : ''}`}>
      <div>
        <div className="price-card-header">
          <span className="plan-tier">{plan.name}</span>
          {isSchool && <span className="badge-best">POPULAR</span>}
        </div>
        <div className="price-amount">
          {formattedAmount}{' '}
          <span className="price-period">{plan.period}</span>
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
        className={isSchool ? 'btn-plan-solid' : 'btn-plan-outline'}
        disabled={Boolean(user && user.plan_id === plan.id)}
        onClick={() => onSelectPlan(plan)}
      >
        {user && user.plan_id === plan.id ? 'Current Plan' : buttonLabel}
      </button>
    </div>
  );
}
