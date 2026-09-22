export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  badge_number?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  confidence?: number;
  field_key?: string;
  color_state?: 'green' | 'amber' | 'red';
}

export interface ExtractedField {
  id?: number;
  field_key: string;
  field_label: string;
  detected_value: string | null;
  is_detected: boolean;
  confidence: number;
  bounding_box: BoundingBox | null;
  status: 'DETECTED' | 'REVIEW' | 'NOT_DETECTED';
}

export interface ComplianceCheck {
  id?: number;
  rule_id: string;
  rule_code: string;
  rule_name: string;
  category: string;
  required: boolean;
  status: 'PASSED' | 'REVIEW' | 'FAILED';
  score_contribution: number;
  reason: string;
  citation: string;
}

export interface Violation {
  id?: number;
  rule_id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence_text: string | null;
  evidence_bbox: BoundingBox | null;
  recommendation: string;
}

export interface OCRLineItem {
  text: string;
  confidence: number;
  bbox?: BoundingBox;
}

export interface Inspection {
  id: string;
  product_name: string;
  brand?: string | null;
  category: string;
  image_url: string;
  processed_image_url?: string | null;
  compliance_score: number;
  status: 'COMPLIANT' | 'REVIEW_REQUIRED' | 'NON_COMPLIANT' | 'PENDING' | 'PROCESSING';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  ocr_confidence: number;
  ocr_raw_text?: string;
  ocr_lines?: OCRLineItem[];
  processing_time_ms: number;
  notes?: string | null;
  created_at: string;
  inspector_name?: string;
  badge_number?: string;
  has_report?: boolean;
  report_id?: string | null;
  extracted_fields?: ExtractedField[];
  compliance_checks?: ComplianceCheck[];
  violations?: Violation[];
}

export interface DashboardStats {
  total_inspections: number;
  compliance_rate: number;
  review_required_count: number;
  violations_detected_count: number;
  recent_inspections: Array<{
    id: string;
    product_name: string;
    brand: string;
    category: string;
    score: number;
    status: 'COMPLIANT' | 'REVIEW_REQUIRED' | 'NON_COMPLIANT';
    risk_level: string;
    date: string;
    inspector: string;
  }>;
  compliance_trend: Array<{
    date: string;
    total: number;
    compliant: number;
    review: number;
    non_compliant: number;
    avg_score: number;
  }>;
  top_violation_types: Array<{
    category: string;
    count: number;
  }>;
}

export interface AnalyticsData {
  total_inspections: number;
  compliance_distribution: {
    COMPLIANT: number;
    REVIEW_REQUIRED: number;
    NON_COMPLIANT: number;
  };
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
  inspection_volume_trend: Array<{
    date: string;
    count: number;
    avg_score: number;
    compliant_count: number;
  }>;
  category_breakdown: Array<{
    category: string;
    count: number;
    avg_score: number;
  }>;
  top_violating_rules: Array<{
    rule_code: string;
    rule_name: string;
    citation: string;
    category: string;
    violation_count: number;
  }>;
}

export interface Rule {
  id: string;
  code: string;
  name: string;
  field_key: string;
  category: string;
  legal_reference: string;
  description: string;
  required: boolean;
  weight: number;
  min_confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  enabled: boolean;
}

export interface ReportItem {
  id: string;
  inspection_id: string;
  product_name: string;
  brand: string;
  status: string;
  compliance_score: number;
  inspector_name: string;
  file_name: string;
  file_size_bytes: number;
  created_at: string;
  download_url: string;
}
