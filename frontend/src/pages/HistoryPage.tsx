import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpRight,
  Download,
  Trash2,
  Package,
  Calendar,
  Layers,
  Loader2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Inspection } from '../types';
import { StatusBadge, RiskBadge } from '../components/StatusBadge';

export const HistoryPage: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const fetchInspections = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.listInspections({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        risk: riskFilter !== 'ALL' ? riskFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
      });
      setInspections(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [statusFilter, riskFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInspections();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete inspection ${id}?`)) return;
    try {
      await apiClient.deleteInspection(id);
      setInspections((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inspection History</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search, filter, and review all statutory packaged commodity audits.
          </p>
        </div>

        <Link
          to="/inspect"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-emerald text-black font-bold text-xs sm:text-sm hover:bg-emerald-400 transition-all shadow-glow-emerald"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Inspection</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, brand, or inspection ID..."
              className="w-full pl-9 pr-3 py-2 bg-dark-card border border-dark-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-200 text-xs font-semibold rounded-xl"
          >
            Search
          </button>
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-dark-border/50 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-dark-card border border-dark-border rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-emerald"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLIANT">Compliant</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
            <option value="NON_COMPLIANT">Non-Compliant</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-dark-card border border-dark-border rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-emerald"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-dark-card border border-dark-border rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-emerald"
          >
            <option value="ALL">All Categories</option>
            <option value="Packaged Food & Confectionery">Food & Confectionery</option>
            <option value="Beverages & Energy Drinks">Beverages</option>
            <option value="Spices & Condiments">Spices & Condiments</option>
            <option value="Edible Oils & Ghee">Edible Oils</option>
            <option value="Personal Care & Cosmetics">Personal Care</option>
            <option value="Grains & Cereals">Grains & Cereals</option>
          </select>

          {(statusFilter !== 'ALL' || riskFilter !== 'ALL' || categoryFilter !== 'ALL' || search) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setRiskFilter('ALL');
                setCategoryFilter('ALL');
                setSearch('');
              }}
              className="text-[11px] text-brand-emerald hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table / List */}
      <div className="rounded-2xl bg-dark-surface border border-dark-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-brand-emerald animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading audit records...</p>
          </div>
        ) : inspections.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Inspections Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No packaged commodity audits matched your query or filter parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-slate-400 font-semibold bg-dark-card">
                  <th className="py-3 px-4">Inspection ID</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60 text-slate-300">
                {inspections.map((insp) => (
                  <tr
                    key={insp.id}
                    className="hover:bg-dark-hover/40 transition-colors cursor-pointer"
                    onClick={() => window.location.assign(`/inspection/${insp.id}`)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-emerald">
                      {insp.id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white max-w-[200px] truncate">
                      {insp.product_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 truncate max-w-[140px]">
                      {insp.brand || 'Standard'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 truncate max-w-[140px]">
                      {insp.category}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {insp.created_at?.slice(0, 10)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={insp.compliance_score >= 88 ? 'text-emerald-400' : insp.compliance_score >= 60 ? 'text-amber-400' : 'text-rose-400'}>
                        {Math.round(insp.compliance_score)}
                      </span>
                      <span className="text-slate-500 font-normal"> / 100</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={insp.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 truncate max-w-[120px]">
                      {insp.inspector_name || 'Inspector R. Verma'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/inspection/${insp.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded bg-dark-card hover:bg-dark-hover text-slate-200 border border-dark-border inline-flex items-center"
                        title="Open Dossier"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-brand-emerald" />
                      </Link>

                      <button
                        onClick={(e) => handleDelete(e, insp.id)}
                        className="p-1.5 rounded bg-dark-card hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-dark-border inline-flex items-center"
                        title="Delete Inspection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
