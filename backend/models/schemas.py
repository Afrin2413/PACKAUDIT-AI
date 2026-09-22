from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    badge_number: Optional[str] = None
    created_at: Optional[str] = None

# --- OCR & Extraction Schemas ---
class BoundingBox(BaseModel):
    x: int
    y: int
    w: int
    h: int
    text: Optional[str] = None
    confidence: Optional[float] = None
    field_key: Optional[str] = None
    color_state: Optional[str] = "green"  # green, amber, red

class OCRLine(BaseModel):
    text: str
    confidence: float
    bbox: Optional[Dict[str, Any]] = None

class ExtractedFieldOut(BaseModel):
    id: Optional[int] = None
    field_key: str
    field_label: str
    detected_value: Optional[str] = None
    is_detected: bool
    confidence: float
    bounding_box: Optional[Dict[str, Any]] = None
    status: str  # DETECTED, REVIEW, NOT_DETECTED

# --- Compliance & Rules Schemas ---
class ComplianceCheckOut(BaseModel):
    id: Optional[int] = None
    rule_id: str
    rule_code: str
    rule_name: str
    category: str
    required: bool
    status: str  # PASSED, REVIEW, FAILED
    score_contribution: float
    reason: str
    citation: str

class ViolationOut(BaseModel):
    id: Optional[int] = None
    rule_id: str
    title: str
    description: str
    severity: str  # LOW, MEDIUM, HIGH
    evidence_text: Optional[str] = None
    evidence_bbox: Optional[Dict[str, Any]] = None
    recommendation: str

class RuleDefinition(BaseModel):
    id: str
    code: str
    name: str
    field_key: str
    category: str
    legal_reference: str
    description: str
    required: bool
    weight: float
    min_confidence: float
    severity: str
    enabled: bool

class RuleUpdatePayload(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    required: Optional[bool] = None
    weight: Optional[float] = None
    min_confidence: Optional[float] = None
    severity: Optional[str] = None
    enabled: Optional[bool] = None

# --- Inspection Schemas ---
class InspectionCreate(BaseModel):
    product_name: Optional[str] = "Packaged Commodity"
    brand: Optional[str] = None
    category: Optional[str] = "General Packaged Commodity"
    notes: Optional[str] = None

class InspectionOut(BaseModel):
    id: str
    product_name: str
    brand: Optional[str] = None
    category: Optional[str] = "General Packaged Commodity"
    image_url: str
    processed_image_url: Optional[str] = None
    compliance_score: float
    status: str  # COMPLIANT, REVIEW_REQUIRED, NON_COMPLIANT
    risk_level: str  # LOW, MEDIUM, HIGH
    ocr_confidence: float
    processing_time_ms: int
    notes: Optional[str] = None
    created_at: str
    inspector_name: Optional[str] = None
    extracted_fields: Optional[List[ExtractedFieldOut]] = []
    compliance_checks: Optional[List[ComplianceCheckOut]] = []
    violations: Optional[List[ViolationOut]] = []
    has_report: Optional[bool] = False
    report_id: Optional[str] = None

# --- Dashboard & Analytics Schemas ---
class DashboardStats(BaseModel):
    total_inspections: int
    compliance_rate: float
    review_required_count: int
    violations_detected_count: int
    recent_inspections: List[Dict[str, Any]]
    compliance_trend: List[Dict[str, Any]]
    top_violation_types: List[Dict[str, Any]]

class AnalyticsData(BaseModel):
    inspection_volume_trend: List[Dict[str, Any]]
    compliance_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
    category_breakdown: List[Dict[str, Any]]
    top_violating_rules: List[Dict[str, Any]]

# --- Report Schemas ---
class ReportOut(BaseModel):
    id: str
    inspection_id: str
    product_name: str
    brand: Optional[str] = None
    status: str
    compliance_score: float
    inspector_name: str
    file_name: str
    file_size_bytes: int
    created_at: str
    download_url: str
