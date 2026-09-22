import React from 'react';

interface ScoreGaugeProps {
  score: number;
  status: string;
  size?: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, status, size = 180 }) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = '#10b981'; // Emerald
  let glowClass = 'shadow-glow-emerald';
  let statusText = 'COMPLIANT';

  if (clampedScore < 60 || status === 'NON_COMPLIANT') {
    strokeColor = '#ef4444'; // Crimson
    glowClass = 'shadow-glow-crimson';
    statusText = 'NON-COMPLIANT';
  } else if (clampedScore < 88 || status === 'REVIEW_REQUIRED') {
    strokeColor = '#f59e0b'; // Amber
    glowClass = 'shadow-glow-amber';
    statusText = 'REVIEW REQUIRED';
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <div className={`relative flex items-center justify-center rounded-full p-2 ${glowClass}`}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e2634"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-4xl font-extrabold tracking-tight text-white font-sans">
            {Math.round(clampedScore)}
          </div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
            / 100
          </div>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Compliance Index
        </span>
      </div>
    </div>
  );
};
