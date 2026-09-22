import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ScanLine, Lock, Mail, ArrowRight, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginDemo();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-dark-card border border-dark-border shadow-glow-emerald mb-4">
            <ScanLine className="w-7 h-7 text-brand-emerald animate-pulse" />
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-wider font-mono">
            PACKAUDIT <span className="text-brand-emerald">AI</span>
          </h1>
          <p className="text-sm font-semibold text-slate-300 mt-1">
            Legal Metrology Intelligence
          </p>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
            Inspect packaged commodities faster with AI-assisted label analysis.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 sm:p-8 shadow-card-dark">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Officer Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="inspector@packaudit.gov.in"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-dark-card border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Access Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-dark-card border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-200 text-black font-bold text-sm hover:bg-white active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-dark-surface px-3 text-slate-500 font-mono">OR</span>
            </div>
          </div>

          {/* Demo Account Quick Access */}
          <button
            onClick={handleDemoSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-brand-emerald/15 hover:bg-brand-emerald/25 border border-brand-emerald/40 text-brand-emerald font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-glow-emerald"
          >
            <Sparkles className="w-4 h-4" />
            <span>Use Demo Inspector</span>
          </button>

          <div className="mt-4 text-center">
            <span className="text-[11px] text-slate-500 font-mono">
              Demo Creds: inspector@packaudit.gov.in / audit2026!
            </span>
          </div>
        </div>

        {/* Legal Positioning Disclaimer */}
        <div className="mt-6 text-center text-[10px] text-slate-500 leading-relaxed max-w-sm mx-auto">
          AI-assisted compliance analysis. Final legal determination requires authorized inspection by a certified Legal Metrology Officer.
        </div>
      </div>
    </div>
  );
};
