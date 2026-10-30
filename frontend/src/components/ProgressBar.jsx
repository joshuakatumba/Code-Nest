import React from 'react';

export default function ProgressBar({ percent, trackClass = 'cbc-bar-track', fillClass = 'cbc-bar-fill' }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className={trackClass}>
      <div className={fillClass} style={{ width: `${safePercent}%` }}></div>
    </div>
  );
}
