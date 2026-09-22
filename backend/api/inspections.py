import json
import time
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends, Query
from config import UPLOAD_DIR
from models.database import get_db_connection
from models.schemas import InspectionOut
from utils.security import get_current_user
from services.image_service import image_service_instance
from services.ocr_service import ocr_service_instance
from services.extraction_service import extraction_service_instance
from services.compliance_service import compliance_service_instance

router = APIRouter(prefix="/inspections", tags=["Inspections"])

@router.post("", response_model=Dict[str, Any])
async def create_and_analyze_inspection(
    file: UploadFile = File(...),
    product_name: str = Form("Packaged Commodity"),
    brand: Optional[str] = Form(None),
    category: Optional[str] = Form("General Packaged Commodity"),
    notes: Optional[str] = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    start_time = time.time()

    # 1. Validate File type and size
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid image (JPG, PNG, WEBP)."
        )

    file_bytes = await file.read()
    if len(file_bytes) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 15MB."
        )

    # 2. Save original image to disk
    original_path, file_id = image_service_instance.save_uploaded_file(file_bytes, file.filename or "upload.jpg")
    image_url = f"/api/uploads/{file_id}"

    # 3. Generate Inspection ID
    year_prefix = time.strftime("%Y")
    random_code = uuid.uuid4().hex[:6].upper()
    inspection_id = f"INSP-{year_prefix}-{random_code}"

    # 4. Computer Vision Preprocessing
    processed_path, proc_meta = image_service_instance.preprocess_image(original_path)
    processed_image_url = f"/api/uploads/{processed_path.name}"

    # 5. Optical Character Recognition
    ocr_result = ocr_service_instance.extract_text(processed_path)
    raw_ocr_text = ocr_result.get("full_text", "")
    ocr_confidence = ocr_result.get("confidence", 0.85)
    ocr_lines = ocr_result.get("lines", [])

    # 6. Structured Field Extraction
    extracted_fields = extraction_service_instance.extract_fields(ocr_result)

    # If product name or brand is detected from commodity name, refine
    detected_commodity = extracted_fields.get("commodity_name", {}).get("detected_value")
    if detected_commodity and (not product_name or product_name == "Packaged Commodity"):
        product_name = detected_commodity

    # 7. Insert initial inspection record
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO inspections (
            id, user_id, product_name, brand, category, image_url, processed_image_url,
            compliance_score, status, risk_level, ocr_confidence, ocr_raw_text, ocr_lines_json,
            notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        inspection_id,
        current_user.get("id", 1),
        product_name,
        brand,
        category,
        image_url,
        processed_image_url,
        0.0,
        "PROCESSING",
        "LOW",
        ocr_confidence,
        raw_ocr_text,
        json.dumps(ocr_lines),
        notes
    ))
    conn.commit()
    conn.close()

    # 8. Legal Metrology Compliance Rule Evaluation & Database Sync
    proc_time_ms = int((time.time() - start_time) * 1000)
    audit_result = compliance_service_instance.run_full_audit(
        inspection_id=inspection_id,
        extracted_fields=extracted_fields,
        overall_ocr_conf=ocr_confidence,
        processing_time_ms=proc_time_ms
    )

    # 9. Return complete inspection response
    return {
        "id": inspection_id,
        "product_name": product_name,
        "brand": brand,
        "category": category,
        "image_url": image_url,
        "processed_image_url": processed_image_url,
        "compliance_score": audit_result["compliance_score"],
        "status": audit_result["status"],
        "risk_level": audit_result["risk_level"],
        "ocr_confidence": ocr_confidence,
        "processing_time_ms": proc_time_ms,
        "notes": notes,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "inspector_name": current_user.get("full_name", "Inspector R. Verma"),
        "extracted_fields": list(extracted_fields.values()),
        "compliance_checks": audit_result["checks"],
        "violations": audit_result["violations"]
    }

@router.get("", response_model=List[Dict[str, Any]])
def list_inspections(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    risk_filter: Optional[str] = Query(None, alias="risk"),
    category: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT i.*, u.full_name as inspector_name, r.id as report_id
        FROM inspections i
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN reports r ON i.id = r.inspection_id
        WHERE 1=1
    """
    params = []

    if search:
        query += " AND (i.product_name LIKE ? OR i.brand LIKE ? OR i.id LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    if status_filter and status_filter.upper() != "ALL":
        query += " AND i.status = ?"
        params.append(status_filter.upper())

    if risk_filter and risk_filter.upper() != "ALL":
        query += " AND i.risk_level = ?"
        params.append(risk_filter.upper())

    if category and category.upper() != "ALL":
        query += " AND i.category = ?"
        params.append(category)

    query += " ORDER BY i.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "product_name": r["product_name"],
            "brand": r["brand"],
            "category": r["category"],
            "image_url": r["image_url"],
            "compliance_score": round(r["compliance_score"], 1),
            "status": r["status"],
            "risk_level": r["risk_level"],
            "ocr_confidence": round(r["ocr_confidence"], 2),
            "processing_time_ms": r["processing_time_ms"],
            "created_at": r["created_at"],
            "inspector_name": r["inspector_name"] or "Inspector R. Verma",
            "has_report": bool(r["report_id"]),
            "report_id": r["report_id"]
        })

    return results

@router.get("/{inspection_id}", response_model=Dict[str, Any])
def get_inspection_detail(inspection_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Fetch Inspection
    cursor.execute("""
        SELECT i.*, u.full_name as inspector_name, u.badge_number, r.id as report_id
        FROM inspections i
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN reports r ON i.id = r.inspection_id
        WHERE i.id = ?
    """, (inspection_id,))
    insp = cursor.fetchone()

    if not insp:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection '{inspection_id}' not found."
        )

    # 2. Fetch Extracted Fields
    cursor.execute("SELECT * FROM extracted_fields WHERE inspection_id = ?", (inspection_id,))
    field_rows = cursor.fetchall()
    fields = []
    for f in field_rows:
        bbox = json.loads(f["bounding_box_json"]) if f["bounding_box_json"] else None
        fields.append({
            "id": f["id"],
            "field_key": f["field_key"],
            "field_label": f["field_label"],
            "detected_value": f["detected_value"],
            "is_detected": bool(f["is_detected"]),
            "confidence": round(f["confidence"], 2),
            "bounding_box": bbox,
            "status": f["status"]
        })

    # 3. Fetch Compliance Checks
    cursor.execute("SELECT * FROM compliance_checks WHERE inspection_id = ?", (inspection_id,))
    check_rows = cursor.fetchall()
    checks = [
        {
            "id": c["id"],
            "rule_id": c["rule_id"],
            "rule_code": c["rule_code"],
            "rule_name": c["rule_name"],
            "category": c["category"],
            "required": bool(c["required"]),
            "status": c["status"],
            "score_contribution": round(c["score_contribution"], 1),
            "reason": c["reason"],
            "citation": c["citation"]
        }
        for c in check_rows
    ]

    # 4. Fetch Violations
    cursor.execute("SELECT * FROM violations WHERE inspection_id = ?", (inspection_id,))
    viol_rows = cursor.fetchall()
    violations = [
        {
            "id": v["id"],
            "rule_id": v["rule_id"],
            "title": v["title"],
            "description": v["description"],
            "severity": v["severity"],
            "evidence_text": v["evidence_text"],
            "evidence_bbox": json.loads(v["evidence_bbox_json"]) if v["evidence_bbox_json"] else None,
            "recommendation": v["recommendation"]
        }
        for v in viol_rows
    ]

    # 5. Parse raw OCR lines for visual overlays
    ocr_lines = []
    if insp["ocr_lines_json"]:
        try:
            ocr_lines = json.loads(insp["ocr_lines_json"])
        except Exception:
            ocr_lines = []

    conn.close()

    return {
        "id": insp["id"],
        "product_name": insp["product_name"],
        "brand": insp["brand"],
        "category": insp["category"],
        "image_url": insp["image_url"],
        "processed_image_url": insp["processed_image_url"],
        "compliance_score": round(insp["compliance_score"], 1),
        "status": insp["status"],
        "risk_level": insp["risk_level"],
        "ocr_confidence": round(insp["ocr_confidence"], 2),
        "ocr_raw_text": insp["ocr_raw_text"],
        "ocr_lines": ocr_lines,
        "processing_time_ms": insp["processing_time_ms"],
        "notes": insp["notes"],
        "created_at": insp["created_at"],
        "inspector_name": insp["inspector_name"] or "Inspector R. Verma",
        "badge_number": insp["badge_number"] or "LM-IND-2026",
        "has_report": bool(insp["report_id"]),
        "report_id": insp["report_id"],
        "extracted_fields": fields,
        "compliance_checks": checks,
        "violations": violations
    }

@router.delete("/{inspection_id}")
def delete_inspection(inspection_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM inspections WHERE id = ?", (inspection_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    cursor.execute("DELETE FROM inspections WHERE id = ?", (inspection_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Inspection {inspection_id} deleted."}

@router.get("/{inspection_id}/evidence")
def get_inspection_evidence(inspection_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    detail = get_inspection_detail(inspection_id, current_user)
    return {
        "inspection_id": inspection_id,
        "image_url": detail["image_url"],
        "processed_image_url": detail["processed_image_url"],
        "extracted_fields": detail["extracted_fields"],
        "violations": detail["violations"],
        "ocr_lines": detail.get("ocr_lines", [])
    }
