import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Scan,
  History,
  BarChart3,
  BookOpenCheck,
  FileText,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Inspect', path: '/inspect', icon: Scan },
  { name: 'History', path: '/history', icon: History },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Rules', path: '/rules', icon: BookOpenCheck },
  { name: 'Reports', path: '/reports', icon: FileText },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-60 flex-shrink-0 hidden md:flex flex-col justify-between border-r border-dark-border bg-dark-bg/60 p-4 min-h-[calc(100vh-4rem)]">
      {/* Nav List */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Enforcement Menu
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/30 shadow-glow-emerald font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover/60 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Compliance Standard Badge & Info */}
      <div className="space-y-3 pt-4 border-t border-dark-border">
        <div className="p-3 rounded-xl bg-dark-card border border-dark-border space-y-2">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-brand-emerald" />
            <span>PCR 2011 Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Legal Metrology (Packaged Commodities) Rules, 2011 codified.
          </p>
          <div className="text-[10px] text-slate-500 font-mono">
            Engine v1.0 • Rule 6(1)
          </div>
        </div>

        <div className="px-2 text-[10px] text-slate-500 text-center leading-normal">
          AI-Assisted Screening Tool. Final legal certification requires official inspection.
        </div>
      </div>
    </aside>
  );
};
