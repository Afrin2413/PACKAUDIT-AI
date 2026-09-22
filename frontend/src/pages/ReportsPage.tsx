import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Package,
  ExternalLink,
  Loader2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { ReportItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.listReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Statutory Inspection Dossiers</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Generated official Legal Metrology inspection certificates & audit reports.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="p-2.5 rounded-xl bg-dark-surface border border-dark-border text-slate-400 hover:text-white hover:bg-dark-hover transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl bg-dark-surface border border-dark-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-brand-emerald animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading statutory PDF archive...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Reports Generated Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              PDF dossiers are generated immediately upon completing an inspection or clicking 'Generate Inspection Report'.
            </p>
            <Link
              to="/inspect"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-emerald text-black font-bold text-xs rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>Perform Inspection</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-slate-400 font-semibold bg-dark-card">
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Inspection ID</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60 text-slate-300">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-dark-hover/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {rep.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-brand-emerald">
                      <Link to={`/inspection/${rep.inspection_id}`} className="hover:underline">
                        {rep.inspection_id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200 max-w-[200px] truncate">
                      {rep.product_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 truncate max-w-[130px]">
                      {rep.brand}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {rep.created_at?.slice(0, 10)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={rep.compliance_score >= 88 ? 'text-emerald-400' : rep.compliance_score >= 60 ? 'text-amber-400' : 'text-rose-400'}>
                        {Math.round(rep.compliance_score)}
                      </span>
                      <span className="text-slate-500 font-normal"> / 100</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={rep.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {Math.round(rep.file_size_bytes / 1024)} KB
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <a
                        href={apiClient.getReportPreviewUrl(rep.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded bg-dark-card hover:bg-dark-hover text-slate-300 hover:text-white border border-dark-border inline-flex items-center gap-1 text-[11px]"
                        title="Preview PDF"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                      </a>

                      <a
                        href={apiClient.getReportDownloadUrl(rep.id)}
                        download={rep.file_name}
                        className="p-1.5 rounded bg-brand-emerald/15 hover:bg-brand-emerald/30 text-brand-emerald border border-brand-emerald/40 inline-flex items-center gap-1 text-[11px] font-semibold"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">PDF</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
