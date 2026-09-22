import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const norm = (status || '').toUpperCase();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  if (norm === 'COMPLIANT' || norm === 'PASSED') {
    return (
      <span className={`inline-flex items-center rounded-full font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}>
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        <span>COMPLIANT</span>
      </span>
    );
  }

  if (norm === 'REVIEW_REQUIRED' || norm === 'REVIEW') {
    return (
      <span className={`inline-flex items-center rounded-full font-medium bg-amber-950/60 text-amber-400 border border-amber-500/30 ${sizeClasses}`}>
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
        <span>REVIEW REQUIRED</span>
      </span>
    );
  }

  if (norm === 'NON_COMPLIANT' || norm === 'FAILED') {
    return (
      <span className={`inline-flex items-center rounded-full font-medium bg-rose-950/60 text-rose-400 border border-rose-500/30 ${sizeClasses}`}>
        {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
        <span>NON-COMPLIANT</span>
      </span>
    );
  }

  if (norm === 'PROCESSING' || norm === 'PENDING') {
    return (
      <span className={`inline-flex items-center rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
        {showIcon && <Clock className="w-3.5 h-3.5 animate-spin text-slate-400" />}
        <span>PROCESSING</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
      {status}
    </span>
  );
};

export const RiskBadge: React.FC<{ risk: string }> = ({ risk }) => {
  const norm = (risk || '').toUpperCase();
  if (norm === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-rose-950/50 text-rose-400 border border-rose-900/50 font-medium">
        <ShieldAlert className="w-3 h-3" />
        HIGH RISK
      </span>
    );
  }
  if (norm === 'MEDIUM') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-900/50 font-medium">
        MEDIUM RISK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 font-medium">
      LOW RISK
    </span>
  );
};
