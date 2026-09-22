import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PackageCheck,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { DashboardStats } from '../types';
import { StatusBadge, RiskBadge } from '../components/StatusBadge';
import { ComplianceActivityTimeline } from '../components/ComplianceActivityTimeline';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to connect to Legal Metrology database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-emerald animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading statutory inspection metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-slate-200">
          <div className="flex items-center gap-3 text-rose-400 font-bold mb-2">
            <XCircle className="w-5 h-5" />
            <span>Inspection Intelligence Engine Offline</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-dark-card border border-dark-border text-xs rounded-lg hover:bg-dark-hover flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const isEmpty = !stats || stats.total_inspections === 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inspection Overview</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitor product compliance and statutory inspection activity under PCR 2011.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="p-2.5 rounded-xl bg-dark-surface border border-dark-border text-slate-400 hover:text-white hover:bg-dark-hover transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/inspect"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-emerald text-black font-bold text-xs sm:text-sm hover:bg-emerald-400 transition-all shadow-glow-emerald"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Start New Inspection</span>
          </Link>
        </div>
      </div>

      {isEmpty ? (
        <div className="p-12 text-center rounded-2xl bg-dark-surface border border-dark-border space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center text-brand-emerald mx-auto">
            <PackageCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Inspections Recorded Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Your inspection history and compliance statistics will populate here immediately after analyzing your first product label.
          </p>
          <Link
            to="/inspect"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-emerald text-black font-bold text-xs hover:bg-emerald-400 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Perform First Inspection</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Executive KPI Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Products Inspected */}
            <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Products Inspected</span>
                <PackageCheck className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-sans">
                  {stats.total_inspections}
                </span>
                <span className="text-xs text-emerald-400 flex items-center font-mono">
                  Active
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Recorded in database
              </div>
            </div>

            {/* Compliance Rate */}
            <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Compliance Rate</span>
                <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-brand-emerald font-sans">
                  {stats.compliance_rate}%
                </span>
                <span className="text-xs text-emerald-400 flex items-center font-mono">
                  PCR 2011
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Passed all mandatory rules
              </div>
            </div>

            {/* Review Required */}
            <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Review Required</span>
                <AlertTriangle className="w-4 h-4 text-brand-amber" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-brand-amber font-sans">
                  {stats.review_required_count}
                </span>
                <span className="text-xs text-amber-400/80 font-mono">
                  Pending Officer
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Moderate confidence / warnings
              </div>
            </div>

            {/* Violations Detected */}
            <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Violations Detected</span>
                <XCircle className="w-4 h-4 text-brand-crimson" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-brand-crimson font-sans">
                  {stats.violations_detected_count}
                </span>
                <span className="text-xs text-rose-400 font-mono">
                  Statutory Flags
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Mandatory rule infractions
              </div>
            </div>
          </div>

          {/* Charts & Breakdown Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compliance Trend Chart */}
            <ComplianceActivityTimeline
              data={stats.compliance_trend}
              isLoading={isLoading}
              error={error}
              onRetry={fetchStats}
            />

            {/* Top Violation Types */}
            <div className="p-6 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Top Violation Categories</h3>
                <p className="text-xs text-slate-400 mb-5">Legal Metrology rule infraction breakdown</p>

                <div className="space-y-3.5">
                  {stats.top_violation_types.map((v, i) => {
                    const maxV = Math.max(...stats.top_violation_types.map((x) => x.count), 1);
                    const pct = Math.round((v.count / maxV) * 100);

                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">{v.category}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{v.count} flags</span>
                        </div>
                        <div className="w-full h-2 bg-dark-card rounded-full overflow-hidden border border-dark-border/40">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-brand-amber rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-border/60 text-[11px] text-slate-500">
                Enforcing Rule 6(1) mandatory provisions
              </div>
            </div>
          </div>

          {/* Recent Inspections Table */}
          <div className="rounded-2xl bg-dark-surface border border-dark-border overflow-hidden">
            <div className="p-5 bg-dark-card border-b border-dark-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Inspections</h3>
                <p className="text-xs text-slate-400">Latest packaged commodities audited in system</p>
              </div>
              <Link
                to="/history"
                className="text-xs font-semibold text-brand-emerald hover:text-emerald-300 flex items-center gap-1"
              >
                <span>View All History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-slate-400 font-semibold bg-dark-bg/40">
                    <th className="py-3 px-4">Inspection ID</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Inspector</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/60 text-xs text-slate-300">
                  {stats.recent_inspections.map((insp) => (
                    <tr
                      key={insp.id}
                      className="hover:bg-dark-hover/40 transition-colors cursor-pointer"
                      onClick={() => window.location.assign(`/inspection/${insp.id}`)}
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-brand-emerald">
                        {insp.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white max-w-[200px] truncate">
                        {insp.product_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 truncate max-w-[140px]">
                        {insp.brand}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {insp.date}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={insp.score >= 88 ? 'text-emerald-400' : insp.score >= 60 ? 'text-amber-400' : 'text-rose-400'}>
                          {Math.round(insp.score)}
                        </span>
                        <span className="text-slate-500 font-normal"> / 100</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={insp.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {insp.inspector}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/inspection/${insp.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 rounded bg-dark-card hover:bg-dark-hover text-slate-200 border border-dark-border text-[11px] inline-flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ArrowUpRight className="w-3 h-3 text-brand-emerald" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
