import React, { useEffect, useState } from 'react';
import {
  BookOpenCheck,
  ShieldCheck,
  Edit2,
  Check,
  X,
  AlertCircle,
  Loader2,
  Info,
  Scale
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Rule } from '../types';

export const RulesPage: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getRules();
      setRules(data.rules || []);
      setMeta({
        title: data.title,
        version: data.version,
        authority: data.authority,
        last_updated: data.last_updated,
        disclaimer: data.disclaimer,
      });
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleEnable = async (rule: Rule) => {
    try {
      const updated = await apiClient.updateRule(rule.id, { enabled: !rule.enabled });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: !rule.enabled } : r))
      );
      setSaveSuccess(`Rule ${rule.code} ${!rule.enabled ? 'enabled' : 'disabled'}.`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    setIsSaving(true);
    try {
      await apiClient.updateRule(editingRule.id, {
        name: editingRule.name,
        description: editingRule.description,
        weight: Number(editingRule.weight),
        required: editingRule.required,
        severity: editingRule.severity,
      });
      setRules((prev) =>
        prev.map((r) => (r.id === editingRule.id ? editingRule : r))
      );
      setEditingRule(null);
      setSaveSuccess(`Rule ${editingRule.code} configuration updated.`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      alert(`Failed to update rule: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-emerald animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading Legal Metrology rule configurations...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3">
          <Scale className="w-3.5 h-3.5" />
          <span>Statutory Rule Registry Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Compliance Rules Configuration</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          {meta?.title} • Codified under {meta?.authority}
        </p>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-xl bg-dark-surface border border-dark-border flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-5 h-5 text-brand-emerald flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-200">Prototype Rule Engine Environment</span>
          <p>
            This engine codifies Rule 6(1) mandatory declarations for packaged commodities. Adjust weights, thresholds, and requirement toggles for prototype testing. Official statutory changes require authorized ministry Gazette notification.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Rules Table */}
      <div className="rounded-2xl bg-dark-surface border border-dark-border overflow-hidden">
        <div className="p-5 bg-dark-card border-b border-dark-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Active Rule Definitions</h3>
          <span className="text-xs font-mono text-slate-400">
            Version: {meta?.version || '1.0.0'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-dark-bg/60 border-b border-dark-border text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Requirement</th>
                <th className="py-3 px-4">Weight</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/60 text-slate-300">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-dark-hover/30">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-emerald">
                    {rule.code}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{rule.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{rule.description}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {rule.category}
                  </td>
                  <td className="py-3.5 px-4 font-semibold">
                    {rule.required ? (
                      <span className="text-emerald-400">MANDATORY</span>
                    ) : (
                      <span className="text-slate-400">OPTIONAL</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                    {rule.weight} pts
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className={rule.severity === 'HIGH' ? 'text-rose-400 font-bold' : rule.severity === 'MEDIUM' ? 'text-amber-400' : 'text-slate-400'}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleEnable(rule)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                        rule.enabled
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/60'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setEditingRule({ ...rule })}
                      className="p-1.5 rounded bg-dark-card hover:bg-dark-hover text-slate-300 hover:text-white border border-dark-border"
                      title="Configure Rule"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-dark-surface border border-dark-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border">
              <h3 className="font-bold text-white text-sm">
                Edit Rule: <span className="text-brand-emerald font-mono">{editingRule.code}</span>
              </h3>
              <button
                onClick={() => setEditingRule(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rule Name</label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Score Weight (pts)</label>
                  <input
                    type="number"
                    value={editingRule.weight}
                    onChange={(e) => setEditingRule({ ...editingRule, weight: Number(e.target.value) })}
                    min={1}
                    max={50}
                    className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity</label>
                  <select
                    value={editingRule.severity}
                    onChange={(e) => setEditingRule({ ...editingRule, severity: e.target.value as any })}
                    className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="reqCheck"
                  checked={editingRule.required}
                  onChange={(e) => setEditingRule({ ...editingRule, required: e.target.checked })}
                  className="rounded bg-dark-card border-dark-border text-brand-emerald"
                />
                <label htmlFor="reqCheck" className="text-slate-300 font-semibold">
                  Mandatory Legal Metrology Declaration (Non-compliance flags violation)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-brand-emerald text-black font-bold rounded-lg hover:bg-emerald-400"
                >
                  {isSaving ? 'Saving...' : 'Save Rule Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
