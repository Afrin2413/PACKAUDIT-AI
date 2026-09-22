import React from 'react';
import { Link } from 'react-router-dom';
import {
  Scan,
  ShieldCheck,
  FileCheck2,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  Zap,
  SearchCheck
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-bg text-dark-light">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-dark-border">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-emerald/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dark-card border border-dark-border mb-6">
            <Scale className="w-4 h-4 text-brand-emerald" />
            <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
              SIH26034 • Legal Metrology (Packaged Commodities) Rules, 2011
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto font-sans">
            Turn package labels into <span className="text-brand-emerald underline decoration-brand-emerald/40 underline-offset-8">actionable compliance intelligence</span>.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Scan packaged commodity labels, automatically extract mandatory declarations, evaluate against statutory Legal Metrology rules, and generate audit-ready inspection dossiers in seconds.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/inspect"
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-brand-emerald text-black font-bold text-sm hover:bg-emerald-400 active:scale-95 transition-all shadow-glow-emerald"
            >
              <Scan className="w-5 h-5 stroke-[2.5]" />
              <span>Start Product Inspection</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-dark-card border border-dark-border text-slate-200 font-semibold text-sm hover:bg-dark-hover hover:border-slate-600 transition-all"
            >
              <span>View Live Dashboard</span>
            </Link>
          </div>

          {/* Workflow Stepper */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-dark-card/60 border border-dark-border/80">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-brand-emerald flex items-center justify-center font-bold text-xs mb-3 border border-emerald-500/20">
                01
              </div>
              <h4 className="text-sm font-bold text-white mb-1">SCAN</h4>
              <p className="text-xs text-slate-400">High-resolution label photo upload or live camera scan.</p>
            </div>

            <div className="p-4 rounded-xl bg-dark-card/60 border border-dark-border/80">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-brand-emerald flex items-center justify-center font-bold text-xs mb-3 border border-emerald-500/20">
                02
              </div>
              <h4 className="text-sm font-bold text-white mb-1">EXTRACT</h4>
              <p className="text-xs text-slate-400">CV contrast enhancement, OCR & Rule 6 entity parsing.</p>
            </div>

            <div className="p-4 rounded-xl bg-dark-card/60 border border-dark-border/80">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-brand-emerald flex items-center justify-center font-bold text-xs mb-3 border border-emerald-500/20">
                03
              </div>
              <h4 className="text-sm font-bold text-white mb-1">VALIDATE</h4>
              <p className="text-xs text-slate-400">Rule engine evaluates metric units, MRP, dates & contacts.</p>
            </div>

            <div className="p-4 rounded-xl bg-dark-card/60 border border-dark-border/80">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-brand-emerald flex items-center justify-center font-bold text-xs mb-3 border border-emerald-500/20">
                04
              </div>
              <h4 className="text-sm font-bold text-white mb-1">REPORT</h4>
              <p className="text-xs text-slate-400">Instant compliance score, evidence overlay & PDF download.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars Section */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white">Built for Government Enforcement & QA Speed</h2>
          <p className="text-xs text-slate-400 mt-2">Zero predetermined mocks • Fully dynamic rule engine & optical character analysis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center text-brand-emerald mb-4">
                <SearchCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Automated Rule 6 Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Checks manufacturer, packer, country of origin, net quantity metric units (Schedule II), MRP with tax declaration, MFD/PKD dates, and consumer helpline.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-dark-border/50 text-[11px] text-emerald-400 font-mono">
              ✓ Rule 6(1)(a) to 6(1)(g)
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center text-brand-amber mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Interactive Evidence Mapping</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect high-res label evidence with visual bounding box overlays. Every score point links directly to extracted text regions and confidence metrics.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-dark-border/50 text-[11px] text-amber-400 font-mono">
              ✓ Pan & Zoom OCR Regions
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center text-brand-teal mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Statutory PDF Dossiers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate downloadable, print-ready official inspection certificates complete with badge IDs, violation citations, and legal disclaimers.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-dark-border/50 text-[11px] text-teal-400 font-mono">
              ✓ Downloadable PDF Reports
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
