import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ShieldCheck, User as UserIcon, LogOut, CheckSquare, ScanLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full bg-dark-bg/95 backdrop-blur-md border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-dark-surface to-dark-card border border-dark-border flex items-center justify-center shadow-md group-hover:border-brand-emerald/50 transition-colors">
            {/* Minimal package outline with scan check */}
            <div className="relative flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-brand-emerald animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-emerald" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-white font-mono">
                PACKAUDIT <span className="text-brand-emerald">AI</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 rounded">
                DEMO ENV
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight">
              Legal Metrology Intelligence
            </p>
          </div>
        </Link>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/inspect"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-emerald text-black font-semibold text-xs sm:text-sm hover:bg-emerald-400 active:scale-95 transition-all shadow-glow-emerald"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Inspection</span>
          </Link>

          {/* User Profile */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 pl-2 border-l border-dark-border">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">
                  {user.full_name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {user.role} • {user.badge_number || 'LM-OFFICER'}
                </span>
              </div>

              <div className="w-8 h-8 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-slate-300">
                <UserIcon className="w-4 h-4" />
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-dark-hover transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
