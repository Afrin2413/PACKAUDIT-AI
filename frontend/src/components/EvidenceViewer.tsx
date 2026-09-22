import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Layers, Eye, Info } from 'lucide-react';
import { ExtractedField, Violation, BoundingBox } from '../types';

interface EvidenceViewerProps {
  imageUrl: string;
  processedImageUrl?: string | null;
  extractedFields?: ExtractedField[];
  violations?: Violation[];
  selectedFieldKey?: string | null;
  onSelectField?: (fieldKey: string | null) => void;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  imageUrl,
  processedImageUrl,
  extractedFields = [],
  violations = [],
  selectedFieldKey,
  onSelectField,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [showProcessed, setShowProcessed] = useState<boolean>(false);
  const [hoveredBox, setHoveredBox] = useState<any | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 800, h: 600 });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth || 800, h: img.naturalHeight || 600 });
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Compile boxes from extracted fields
  const boxes = extractedFields
    .filter((f) => f.bounding_box)
    .map((f) => {
      const isSelected = selectedFieldKey === f.field_key;
      let color = '#10b981'; // Green
      let strokeDash = '0';
      if (f.status === 'REVIEW') {
        color = '#f59e0b'; // Amber
      } else if (f.status === 'NOT_DETECTED') {
        color = '#ef4444'; // Red
      }

      return {
        ...f.bounding_box!,
        key: f.field_key,
        label: f.field_label,
        value: f.detected_value,
        conf: f.confidence,
        color,
        isSelected,
      };
    });

  const activeImage = showProcessed && processedImageUrl ? processedImageUrl : imageUrl;

  return (
    <div className="flex flex-col h-full rounded-xl bg-dark-surface border border-dark-border overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-dark-card border-b border-dark-border text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">EVIDENCE VIEWER</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">
            {boxes.length} OCR Regions Mapped
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {processedImageUrl && (
            <button
              onClick={() => setShowProcessed(!showProcessed)}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                showProcessed
                  ? 'bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/40'
                  : 'bg-dark-surface hover:bg-dark-hover text-slate-300 border border-dark-border'
              }`}
              title="Toggle Preprocessed CV Image"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showProcessed ? 'Preprocessed View' : 'Original Label'}</span>
            </button>
          )}

          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              showOverlays
                ? 'bg-slate-700 text-white border border-slate-600'
                : 'bg-dark-surface text-slate-400 hover:text-slate-200 border border-dark-border'
            }`}
            title="Toggle OCR Bounding Boxes"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Overlays</span>
          </button>

          <div className="h-4 w-px bg-dark-border mx-1" />

          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-dark-hover text-slate-300 hover:text-white border border-dark-border"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-dark-hover text-slate-300 hover:text-white border border-dark-border"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded hover:bg-dark-hover text-slate-300 hover:text-white border border-dark-border"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[380px] max-h-[540px] bg-dark-bg/90 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative inline-block"
        >
          {/* Package Image */}
          <img
            ref={imgRef}
            src={activeImage}
            alt="Package Label Evidence"
            onLoad={handleImageLoad}
            className="max-h-[500px] w-auto rounded object-contain pointer-events-none shadow-2xl"
          />

          {/* SVG Overlay for Bounding Boxes */}
          {showOverlays && naturalSize.w > 0 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-auto"
              viewBox={`0 0 ${naturalSize.w} ${naturalSize.h}`}
              preserveAspectRatio="none"
            >
              {boxes.map((b, idx) => (
                <g key={idx} className="cursor-pointer" onClick={() => onSelectField?.(b.key)}>
                  {/* Bounding Box Rectangle */}
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    fill={b.isSelected ? `${b.color}25` : 'transparent'}
                    stroke={b.color}
                    strokeWidth={b.isSelected ? 3.5 : 2}
                    strokeDasharray={b.isSelected ? '4 2' : 'none'}
                    className="transition-all hover:fill-emerald-500/20"
                    onMouseEnter={() => setHoveredBox(b)}
                    onMouseLeave={() => setHoveredBox(null)}
                  />
                  {/* Tiny label pill on top of box */}
                  <rect
                    x={b.x}
                    y={Math.max(0, b.y - 18)}
                    width={Math.min(b.w, 130)}
                    height={18}
                    fill={b.color}
                    rx={2}
                  />
                  <text
                    x={b.x + 4}
                    y={Math.max(0, b.y - 5)}
                    fill="#000000"
                    fontSize={11}
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {b.label.slice(0, 18)}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredBox && (
          <div className="absolute bottom-4 left-4 z-20 px-3 py-2 bg-dark-card/95 border border-dark-border rounded-lg shadow-xl text-xs backdrop-blur-sm pointer-events-none max-w-sm">
            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredBox.color }} />
              {hoveredBox.label}
            </div>
            <div className="text-slate-300 mt-1 font-mono text-[11px] bg-dark-bg/60 p-1.5 rounded border border-dark-border/50 truncate">
              {hoveredBox.value || 'No value parsed'}
            </div>
            <div className="text-slate-400 mt-1 text-[10px]">
              OCR Confidence: <span className="text-emerald-400 font-semibold">{Math.round(hoveredBox.conf * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className="px-4 py-2 bg-dark-card border-t border-dark-border flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald" />
            <span>Detected Declaration</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-amber" />
            <span>Requires Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-crimson" />
            <span>Missing / Violation</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          Click region to highlight declaration details
        </div>
      </div>
    </div>
  );
};
