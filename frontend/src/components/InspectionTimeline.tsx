import React from 'react';
import { Check, Loader2, Clock } from 'lucide-react';

interface InspectionTimelineProps {
  currentStage: number; // 0 to 6
  isComplete?: boolean;
}

export const STAGES = [
  { step: 1, title: 'Image Received', desc: 'Secure payload received & verified' },
  { step: 2, title: 'Image Preprocessing', desc: 'Adaptive CLAHE contrast & denoising' },
  { step: 3, title: 'OCR Extraction', desc: 'Text contours & character recognition' },
  { step: 4, title: 'Declaration Detection', desc: 'Rule 6 entity parsing & unit checks' },
  { step: 5, title: 'Compliance Validation', desc: 'Legal Metrology Rules 2011 engine' },
  { step: 6, title: 'Dossier Generation', desc: 'Scoring, risk indexing & evidence mapping' },
];

export const InspectionTimeline: React.FC<InspectionTimelineProps> = ({ currentStage, isComplete = false }) => {
  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4">
      <div className="space-y-4">
        {STAGES.map((s) => {
          const isDone = isComplete || currentStage > s.step;
          const isCurrent = !isComplete && currentStage === s.step;
          const isPending = !isComplete && currentStage < s.step;

          return (
            <div
              key={s.step}
              className={`flex items-start gap-3.5 p-3 rounded-lg border transition-all duration-300 ${
                isCurrent
                  ? 'bg-brand-emerald/10 border-brand-emerald/40 shadow-glow-emerald'
                  : isDone
                  ? 'bg-dark-card border-dark-border/80 text-slate-300'
                  : 'bg-dark-surface/40 border-dark-border/30 opacity-50 text-slate-500'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isDone ? (
                  <div className="w-6 h-6 rounded-full bg-brand-emerald text-black flex items-center justify-center font-bold text-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-brand-emerald/20 text-brand-emerald border border-brand-emerald flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-dark-hover border border-dark-border text-slate-500 flex items-center justify-center text-xs font-mono">
                    0{s.step}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${isCurrent ? 'text-brand-emerald' : isDone ? 'text-slate-200' : 'text-slate-500'}`}>
                    0{s.step}. {s.title}
                  </span>
                  {isDone && (
                    <span className="text-[11px] text-emerald-400/80 font-mono">PASSED</span>
                  )}
                  {isCurrent && (
                    <span className="text-[11px] text-brand-emerald font-mono animate-pulse">PROCESSING...</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
