import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
  Share2,
  Printer,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  Layers,
  Sparkles,
  Loader2,
  Building2,
  Calendar,
  IndianRupee,
  Scale,
  PhoneCall,
  Globe,
  Tag
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Inspection, ExtractedField, Violation, ComplianceCheck } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { StatusBadge, RiskBadge } from '../components/StatusBadge';
import { EvidenceViewer } from '../components/EvidenceViewer';

export const ResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const fetchInspection = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getInspection(id);
      setInspection(data);
      if (data.report_id) {
        setReportUrl(apiClient.getReportDownloadUrl(data.report_id));
      }
    } catch (err: any) {
      console.error('Error fetching inspection:', err);
      setError(err.message || `Inspection ${id} could not be retrieved.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInspection();
  }, [id]);

  const handleGenerateReport = async () => {
    if (!inspection) return;
    setIsGeneratingPdf(true);
    try {
      const res = await apiClient.generateReport(inspection.id);
      setReportUrl(apiClient.getReportDownloadUrl(res.report_id));
      setInspection((prev) => (prev ? { ...prev, has_report: true, report_id: res.report_id } : null));
    } catch (err: any) {
      alert(`Report generation failed: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-emerald animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading statutory inspection dossier...</p>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-slate-200">
          <XCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">Inspection Record Not Found</h3>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
          <div className="mt-4">
            <Link
              to="/history"
              className="inline-flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-xs hover:bg-dark-hover"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Inspection History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getFieldIcon = (key: string) => {
    switch (key) {
      case 'mrp':
        return IndianRupee;
      case 'net_quantity':
        return Scale;
      case 'mfg_date':
        return Calendar;
      case 'manufacturer_packer':
        return Building2;
      case 'consumer_care':
        return PhoneCall;
      case 'country_of_origin':
        return Globe;
      default:
        return Tag;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="p-2 rounded-xl bg-dark-surface border border-dark-border text-slate-400 hover:text-white hover:bg-dark-hover transition-colors"
            title="Back to History"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-emerald">
                {inspection.id}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">
                {inspection.created_at}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
              {inspection.product_name}
            </h1>
          </div>
        </div>

        {/* Report Actions */}
        <div className="flex items-center gap-3">
          {inspection.report_id ? (
            <a
              href={apiClient.getReportDownloadUrl(inspection.report_id)}
              download={`${inspection.report_id}.pdf`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 text-black font-bold text-xs sm:text-sm hover:bg-white transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Dossier</span>
            </a>
          ) : (
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-emerald text-black font-bold text-xs sm:text-sm hover:bg-emerald-400 transition-all shadow-glow-emerald disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>Generate Inspection Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Score & Executive Summary Card */}
      <div className="p-6 rounded-2xl bg-dark-surface border border-dark-border shadow-card-dark grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Score Gauge */}
        <div className="flex justify-center border-b md:border-b-0 md:border-r border-dark-border pb-6 md:pb-0 md:pr-6">
          <ScoreGauge score={inspection.compliance_score} status={inspection.status} size={190} />
        </div>

        {/* Summary Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={inspection.status} size="lg" />
            <RiskBadge risk={inspection.risk_level} />
            <span className="px-2.5 py-1 rounded-full bg-dark-card border border-dark-border text-xs text-slate-300 font-mono">
              OCR Clarity: {Math.round(inspection.ocr_confidence * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-dark-card border border-dark-border/60">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Brand / Pack</span>
              <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                {inspection.brand || 'Standard Package'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-dark-card border border-dark-border/60">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Category</span>
              <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                {inspection.category}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-dark-card border border-dark-border/60">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Inspector Assigned</span>
              <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                {inspection.inspector_name || 'Inspector R. Verma'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-dark-card/60 border border-dark-border/40 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-brand-emerald" />
              <span>Full CV Preprocessing & Rule Engine Runtime: <strong>{inspection.processing_time_ms} ms</strong></span>
            </div>
            <span className="font-mono text-emerald-400">Rule 6(1) Codified</span>
          </div>
        </div>
      </div>

      {/* 2-Column Core Layout: Evidence Viewer & Declarations / Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Evidence Viewer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-emerald" />
              <span>Visual Evidence & OCR Bounding Boxes</span>
            </h3>

            <EvidenceViewer
              imageUrl={inspection.image_url}
              processedImageUrl={inspection.processed_image_url}
              extractedFields={inspection.extracted_fields}
              violations={inspection.violations}
              selectedFieldKey={selectedFieldKey}
              onSelectField={(key) => setSelectedFieldKey(key)}
            />

            <div className="p-3 rounded-xl bg-dark-surface border border-dark-border text-[11px] text-slate-400 mt-3 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <p>
                Bounding coordinates are mapped using optical character density analysis. Click on any declaration or violation row on the right to highlight its label region.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Extracted Declarations, Rule Breakdown & Violations (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Extracted Mandatory Declarations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">1. Extracted Mandatory Declarations</h3>
              <span className="text-xs text-slate-400 font-mono">
                {inspection.extracted_fields?.filter((f) => f.is_detected).length || 0} / {inspection.extracted_fields?.length || 0} Detected
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {inspection.extracted_fields?.map((field) => {
                const Icon = getFieldIcon(field.field_key);
                const isSelected = selectedFieldKey === field.field_key;

                return (
                  <div
                    key={field.field_key}
                    onClick={() => setSelectedFieldKey(isSelected ? null : field.field_key)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-dark-hover border-brand-emerald shadow-glow-emerald'
                        : 'bg-dark-surface hover:bg-dark-card border-dark-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 rounded-lg bg-dark-card border border-dark-border text-slate-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-200">
                            {field.field_label}
                          </span>
                          <p className="text-xs font-mono text-slate-300 mt-1 bg-dark-bg/60 px-2 py-1 rounded border border-dark-border/40">
                            {field.detected_value ? field.detected_value : <span className="text-rose-400 italic">Not Detected on Label</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <StatusBadge status={field.status} size="sm" showIcon={false} />
                        {field.is_detected && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {Math.round(field.confidence * 100)}% conf
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Flagged Violations & Issues */}
          {inspection.violations && inspection.violations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-brand-crimson" />
                <h3 className="text-base font-bold text-white">
                  2. Flagged Violations & Non-Compliance Findings ({inspection.violations.length})
                </h3>
              </div>

              <div className="space-y-3">
                {inspection.violations.map((viol, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/60 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                        <XCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{viol.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900/80 text-rose-200 font-mono">
                        {viol.severity} SEVERITY
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {viol.description}
                    </p>

                    <div className="p-2.5 rounded-lg bg-dark-bg/80 border border-dark-border text-xs text-emerald-400/90 flex items-start gap-2">
                      <span className="font-bold text-slate-400 flex-shrink-0">Action:</span>
                      <span>{viol.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Legal Metrology Rule Evaluations Breakdown */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">
              3. Statutory Rule Checks Breakdown
            </h3>

            <div className="rounded-xl bg-dark-surface border border-dark-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-dark-card border-b border-dark-border text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      <th className="py-3 px-4">Rule Code</th>
                      <th className="py-3 px-4">Rule Specification</th>
                      <th className="py-3 px-4">Result</th>
                      <th className="py-3 px-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border/60 text-slate-300">
                    {inspection.compliance_checks?.map((check, idx) => (
                      <tr key={idx} className="hover:bg-dark-hover/30">
                        <td className="py-3 px-4 font-mono font-bold text-brand-emerald">
                          {check.rule_code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{check.rule_name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{check.citation}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 italic">{check.reason}</div>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={check.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                          {check.score_contribution}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Statutory Legal Notice Disclaimer */}
          <div className="p-4 rounded-xl bg-dark-card border border-dark-border text-[11px] text-slate-400 space-y-1 leading-relaxed">
            <strong className="text-slate-300">Statutory Notice:</strong>
            <p>
              PackAudit AI provides automated, AI-assisted legal metrology compliance analysis. It is designed to accelerate inspection throughput and assist enforcement officers. Final legal determination remains with the designated Legal Metrology Officer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
