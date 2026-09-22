import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  PieChart,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Plus,
  Scale,
  Award,
  FileSpreadsheet
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { AnalyticsData } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-emerald animate-spin mb-4" />
        <p className="text-sm text-slate-400">Computing statutory compliance analytics...</p>
      </div>
    );
  }

  if (!data || data.total_inspections === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="p-8 rounded-2xl bg-dark-surface border border-dark-border space-y-3">
          <BarChart3 className="w-10 h-10 text-slate-600 mx-auto" />
          <h2 className="text-base font-bold text-white">No Inspection Data Yet</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Analytics will populate dynamically once packaged products are scanned and audited.
          </p>
          <Link
            to="/inspect"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-emerald text-black font-bold text-xs rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Start First Inspection</span>
          </Link>
        </div>
      </div>
    );
  }

  const compTotal =
    data.compliance_distribution.COMPLIANT +
    data.compliance_distribution.REVIEW_REQUIRED +
    data.compliance_distribution.NON_COMPLIANT;

  const compliantPct = compTotal ? Math.round((data.compliance_distribution.COMPLIANT / compTotal) * 100) : 0;
  const reviewPct = compTotal ? Math.round((data.compliance_distribution.REVIEW_REQUIRED / compTotal) * 100) : 0;
  const nonCompPct = compTotal ? Math.round((data.compliance_distribution.NON_COMPLIANT / compTotal) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Compliance Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Aggregated statutory intelligence across packaged commodities and rule categories.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2.5 rounded-xl bg-dark-surface border border-dark-border text-slate-400 hover:text-white hover:bg-dark-hover transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Distribution Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Compliance Tier Breakdown */}
        <div className="p-6 rounded-2xl bg-dark-surface border border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Compliance Status Share</h3>
            <span className="text-[11px] font-mono text-slate-500">{data.total_inspections} Audits</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-400 font-semibold">Compliant ({data.compliance_distribution.COMPLIANT})</span>
                <span className="font-mono text-slate-300">{compliantPct}%</span>
              </div>
              <div className="w-full h-2 bg-dark-card rounded-full overflow-hidden">
                <div style={{ width: `${compliantPct}%` }} className="h-full bg-brand-emerald rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-semibold">Review Required ({data.compliance_distribution.REVIEW_REQUIRED})</span>
                <span className="font-mono text-slate-300">{reviewPct}%</span>
              </div>
              <div className="w-full h-2 bg-dark-card rounded-full overflow-hidden">
                <div style={{ width: `${reviewPct}%` }} className="h-full bg-brand-amber rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-400 font-semibold">Non-Compliant ({data.compliance_distribution.NON_COMPLIANT})</span>
                <span className="font-mono text-slate-300">{nonCompPct}%</span>
              </div>
              <div className="w-full h-2 bg-dark-card rounded-full overflow-hidden">
                <div style={{ width: `${nonCompPct}%` }} className="h-full bg-brand-crimson rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="p-6 rounded-2xl bg-dark-surface border border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Risk Profile Matrix</h3>
            <span className="text-[11px] font-mono text-slate-500">Legal Risk</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
              <span className="text-2xl font-extrabold text-emerald-400 block font-mono">
                {data.risk_distribution.LOW}
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-300/80 mt-1 block">Low Risk</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/50">
              <span className="text-2xl font-extrabold text-amber-400 block font-mono">
                {data.risk_distribution.MEDIUM}
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-300/80 mt-1 block">Medium</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50">
              <span className="text-2xl font-extrabold text-rose-400 block font-mono">
                {data.risk_distribution.HIGH}
              </span>
              <span className="text-[10px] uppercase font-bold text-rose-300/80 mt-1 block">High Risk</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
            High risk packages exhibit multiple missing mandatory declarations or ambiguous pricing statements under Rule 6(1).
          </p>
        </div>

        {/* Category Volume & Averages */}
        <div className="p-6 rounded-2xl bg-dark-surface border border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Top Commodity Categories</h3>
            <span className="text-[11px] font-mono text-slate-500">Score Avg</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {data.category_breakdown.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-dark-card border border-dark-border/40">
                <span className="text-slate-300 font-medium truncate max-w-[170px]">{cat.category}</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400 text-[11px]">{cat.count} scans</span>
                  <span className={`font-bold ${cat.avg_score >= 88 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {cat.avg_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Violating Rules Table */}
      <div className="rounded-2xl bg-dark-surface border border-dark-border overflow-hidden space-y-0">
        <div className="p-5 bg-dark-card border-b border-dark-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Statutory Rule Infraction Registry</h3>
            <p className="text-xs text-slate-400">Frequency of non-compliance flags by Legal Metrology rule</p>
          </div>
          <span className="text-[11px] font-mono text-brand-emerald bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/30">
            PCR 2011 Codified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-dark-bg/60 border-b border-dark-border text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 px-4">Rule Code</th>
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Legal Reference Citation</th>
                <th className="py-3 px-4 text-right">Violation Frequency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/60 text-slate-300">
              {data.top_violating_rules.map((r, i) => (
                <tr key={i} className="hover:bg-dark-hover/30">
                  <td className="py-3 px-4 font-mono font-bold text-brand-emerald">
                    {r.rule_code}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    {r.rule_name}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {r.category}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {r.citation}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                    {r.violation_count} flags
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
