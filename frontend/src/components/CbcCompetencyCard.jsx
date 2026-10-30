import React from 'react';
import ProgressBar from './ProgressBar.jsx';

export default function CbcCompetencyCard({ competencies }) {
  return (
    <div className="dashboard-white-card">
      <div className="card-section-header">
        <h4>CBC Competency Progress</h4>
      </div>
      <div className="cbc-grid">
        {competencies.map((competency) => (
          <div key={competency.id} className="cbc-box">
            <div className="cbc-label-row">
              <span>{competency.name}</span>
              <span className="cbc-percent">{competency.percent}%</span>
            </div>
            <ProgressBar
              percent={competency.percent}
              trackClass="cbc-bar-track"
              fillClass="cbc-bar-fill"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
