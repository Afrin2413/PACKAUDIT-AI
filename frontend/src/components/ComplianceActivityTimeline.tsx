import React, { useState, useId } from 'react';
import { Loader2, RefreshCw, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface TimelineDataPoint {
  date: string;
  total: number;
  compliant: number;
  review?: number;
  non_compliant: number;
  avg_score?: number;
}

interface ComplianceActivityTimelineProps {
  data?: TimelineDataPoint[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Catmull-Rom spline to smooth cubic Bezier curve generator
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    // Catmull-Rom to Cubic Bezier conversion (tension = 0.5 -> division by 6)
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

function createAreaPath(points: { x: number; y: number }[], baselineY: number): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[0].x.toFixed(2)} ${baselineY} Z`;
  }
  const linePath = createSmoothPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x.toFixed(2)} ${baselineY} L ${first.x.toFixed(2)} ${baselineY} Z`;
}

function formatDateLabel(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (mIndex >= 0 && mIndex < 12 && !isNaN(day)) {
        return `${monthNames[mIndex]} ${day}`;
      }
    }
  } catch {
    // fallback
  }
  return dateStr.slice(5) || dateStr;
}

function formatFullDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const year = parts[0];
      const mIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (mIndex >= 0 && mIndex < 12 && !isNaN(day)) {
        return `${monthNames[mIndex]} ${day}, ${year}`;
      }
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export const ComplianceActivityTimeline: React.FC<ComplianceActivityTimelineProps> = ({
  data = [],
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, '');

  // Dimensions & Padding inside SVG coordinate space
  const svgWidth = 640;
  const svgHeight = 220;
  const padLeft = 36;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 34;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;
  const baselineY = svgHeight - padBottom;

  // Compute scale and points if data exists
  const hasData = Boolean(data && data.length > 0);

  // Compute maximum inspection count for Y-axis
  let maxCount = 1;
  if (hasData) {
    for (const d of data) {
      if (d.total > maxCount) maxCount = d.total;
      if (d.compliant > maxCount) maxCount = d.compliant;
      if (d.non_compliant > maxCount) maxCount = d.non_compliant;
    }
  }
  // Round max count up to a clean integer grid
  let yAxisMax = 4;
  if (maxCount <= 2) yAxisMax = 2;
  else if (maxCount <= 4) yAxisMax = 4;
  else if (maxCount <= 6) yAxisMax = 6;
  else if (maxCount <= 10) yAxisMax = 10;
  else yAxisMax = Math.ceil(maxCount / 5) * 5;

  const yTicks = [
    { value: yAxisMax, y: padTop },
    { value: Math.round(yAxisMax / 2), y: padTop + chartH / 2 },
    { value: 0, y: baselineY },
  ];

  const compliantPoints: { x: number; y: number }[] = [];
  const nonCompliantPoints: { x: number; y: number }[] = [];

  if (hasData) {
    data.forEach((item, idx) => {
      const x = data.length === 1
        ? padLeft + chartW / 2
        : padLeft + (idx / (data.length - 1)) * chartW;
      
      const compY = baselineY - (item.compliant / yAxisMax) * chartH;
      const nonCompY = baselineY - (item.non_compliant / yAxisMax) * chartH;

      compliantPoints.push({ x, y: compY });
      nonCompliantPoints.push({ x, y: nonCompY });
    });
  }

  const compliantPath = createSmoothPath(compliantPoints);
  const compliantArea = createAreaPath(compliantPoints, baselineY);
  const nonCompliantPath = createSmoothPath(nonCompliantPoints);
  const nonCompliantArea = createAreaPath(nonCompliantPoints, baselineY);

  const activePoint = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : null;
  const activeCompCoord = hoveredIndex !== null ? compliantPoints[hoveredIndex] : null;
  const activeNonCompCoord = hoveredIndex !== null ? nonCompliantPoints[hoveredIndex] : null;

  // Tooltip horizontal percentage
  const tooltipLeftPct =
    hoveredIndex !== null && data.length > 1
      ? ((activeCompCoord?.x ?? padLeft) / svgWidth) * 100
      : 50;

  return (
    <div className="lg:col-span-2 p-6 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Compliance Activity Timeline</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspections & average audit scores over recent dates
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="font-medium">Compliant</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-crimson shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="font-medium">Non-Compliant</span>
          </div>
        </div>
      </div>

      {/* Graph Content Area */}
      <div className="relative min-h-[220px] w-full flex items-center justify-center pt-2 pb-2">
        {isLoading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-12 space-y-3 text-slate-400">
            <Loader2 className="w-7 h-7 text-brand-emerald animate-spin" />
            <span className="text-xs font-medium">Loading inspection timeline...</span>
          </div>
        ) : error ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs text-rose-300 font-medium max-w-sm">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border text-xs text-slate-300 hover:text-white hover:bg-dark-hover transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : !hasData ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 space-y-2 text-slate-500">
            <TrendingUp className="w-8 h-8 stroke-1 text-slate-600" />
            <p className="text-xs font-medium text-slate-400">No inspection data available</p>
            <p className="text-[11px] text-slate-600">
              Timeline data will appear here when product packages are inspected.
            </p>
          </div>
        ) : (
          /* Line Graph Visualization */
          <div
            className="w-full relative select-none"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 overflow-visible"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Emerald linear gradient for compliant area */}
                <linearGradient id={`compGrad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                  <stop offset="70%" stopColor="#10b981" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>

                {/* Crimson linear gradient for non-compliant area */}
                <linearGradient id={`nonCompGrad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                  <stop offset="70%" stopColor="#ef4444" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                </linearGradient>

                {/* Drop shadow filters for glow lines */}
                <filter id={`emeraldGlow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.35" />
                </filter>
                <filter id={`crimsonGlow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.35" />
                </filter>
              </defs>

              {/* Horizontal Grid Lines & Y-Axis Labels */}
              {yTicks.map((tick, idx) => (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={tick.y}
                    x2={svgWidth - padRight}
                    y2={tick.y}
                    stroke="#273142"
                    strokeWidth={1}
                    strokeDasharray={idx === yTicks.length - 1 ? 'none' : '3 3'}
                    strokeOpacity={idx === yTicks.length - 1 ? 0.8 : 0.5}
                  />
                  <text
                    x={padLeft - 8}
                    y={tick.y + 3.5}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {tick.value}
                  </text>
                </g>
              ))}

              {/* Area fills */}
              {nonCompliantArea && (
                <path d={nonCompliantArea} fill={`url(#nonCompGrad-${gradientId})`} />
              )}
              {compliantArea && (
                <path d={compliantArea} fill={`url(#compGrad-${gradientId})`} />
              )}

              {/* Main Line: Non-Compliant */}
              {nonCompliantPath && (
                <path
                  d={nonCompliantPath}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#crimsonGlow-${gradientId})`}
                />
              )}

              {/* Main Line: Compliant */}
              {compliantPath && (
                <path
                  d={compliantPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#emeraldGlow-${gradientId})`}
                />
              )}

              {/* Active Hover Guide Line */}
              {hoveredIndex !== null && activeCompCoord && (
                <line
                  x1={activeCompCoord.x}
                  y1={padTop}
                  x2={activeCompCoord.x}
                  y2={baselineY}
                  stroke="#64748b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Data Points on Compliant Line */}
              {compliantPoints.map((pt, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <g key={`comp-pt-${idx}`} className="transition-all duration-200">
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="8"
                        fill="#10b981"
                        fillOpacity="0.25"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5 : 3.5}
                      fill="#0a0c0f"
                      stroke="#10b981"
                      strokeWidth={isHovered ? 2.5 : 2}
                    />
                  </g>
                );
              })}

              {/* Data Points on Non-Compliant Line */}
              {nonCompliantPoints.map((pt, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <g key={`noncomp-pt-${idx}`} className="transition-all duration-200">
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="8"
                        fill="#ef4444"
                        fillOpacity="0.25"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5 : 3.5}
                      fill="#0a0c0f"
                      stroke="#ef4444"
                      strokeWidth={isHovered ? 2.5 : 2}
                    />
                  </g>
                );
              })}

              {/* X-Axis Dates Labels */}
              {data.map((item, idx) => {
                const pt = compliantPoints[idx];
                if (!pt) return null;
                const isHovered = hoveredIndex === idx;

                return (
                  <text
                    key={`lbl-${idx}`}
                    x={pt.x}
                    y={baselineY + 16}
                    textAnchor="middle"
                    fill={isHovered ? '#f1f5f9' : '#64748b'}
                    fontSize="10"
                    fontWeight={isHovered ? '600' : '400'}
                    fontFamily="monospace"
                  >
                    {formatDateLabel(item.date)}
                  </text>
                );
              })}

              {/* Transparent interactive hover trigger zones */}
              {data.map((_, idx) => {
                const stepW = chartW / Math.max(data.length - 1, 1);
                const rectW = data.length === 1 ? chartW : stepW;
                const rectX =
                  data.length === 1
                    ? padLeft
                    : idx === 0
                    ? padLeft
                    : compliantPoints[idx].x - stepW / 2;

                return (
                  <rect
                    key={`hover-zone-${idx}`}
                    x={rectX}
                    y={0}
                    width={rectW}
                    height={svgHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip Card */}
            {hoveredIndex !== null && activePoint && (
              <div
                style={{
                  left: `clamp(16%, ${tooltipLeftPct}%, 84%)`,
                  top: '8px',
                }}
                className="absolute pointer-events-none -translate-x-1/2 z-30 transform transition-all duration-150 ease-out"
              >
                <div className="p-3 rounded-xl bg-dark-card/95 backdrop-blur-md border border-dark-border text-slate-200 shadow-2xl space-y-2 min-w-[190px]">
                  {/* Tooltip Header: Exact Date */}
                  <div className="border-b border-dark-border/70 pb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-white">
                      {formatFullDate(activePoint.date)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {activePoint.date}
                    </span>
                  </div>

                  {/* Tooltip Metrics */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-brand-emerald" />
                        <span>Compliant:</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">
                        {activePoint.compliant}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-brand-crimson" />
                        <span>Non-Compliant:</span>
                      </div>
                      <span className="font-mono font-bold text-rose-400">
                        {activePoint.non_compliant}
                      </span>
                    </div>

                    <div className="pt-1.5 mt-1 border-t border-dark-border/50 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Total Inspections:</span>
                      <span className="font-mono font-bold text-white">
                        {activePoint.total}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-dark-border/40 pt-3">
        <span>Calculated directly from SQLite audit trail</span>
        <Link to="/analytics" className="text-brand-emerald hover:underline flex items-center gap-1">
          View Full Analytics <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
