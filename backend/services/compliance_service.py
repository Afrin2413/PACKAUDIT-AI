import json
import time
from pathlib import Path
from typing import Dict, Any, Tuple, List
from models.database import get_db_connection
from rules.rule_engine import rule_engine_instance

class ComplianceService:
    def __init__(self):
        self.rule_engine = rule_engine_instance

    def run_full_audit(
        self,
        inspection_id: str,
        extracted_fields: Dict[str, Dict[str, Any]],
        overall_ocr_conf: float = 0.85,
        processing_time_ms: int = 420
    ) -> Dict[str, Any]:
        """
        Executes Legal Metrology rules evaluation and writes all records to SQLite database:
        - updates inspection row with score, status, risk_level
        - stores extracted_fields
        - stores compliance_checks
        - stores violations
        """
        score, status, risk_level, checks, violations = self.rule_engine.evaluate_compliance(
            extracted_fields=extracted_fields,
            overall_ocr_conf=overall_ocr_conf
        )

        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Update inspection table
        cursor.execute("""
            UPDATE inspections 
            SET compliance_score = ?,
                status = ?,
                risk_level = ?,
                ocr_confidence = ?,
                processing_time_ms = ?
            WHERE id = ?
        """, (score, status, risk_level, overall_ocr_conf, processing_time_ms, inspection_id))

        # 2. Insert extracted fields
        cursor.execute("DELETE FROM extracted_fields WHERE inspection_id = ?", (inspection_id,))
        for field_key, f in extracted_fields.items():
            bbox_json = json.dumps(f.get("bounding_box")) if f.get("bounding_box") else None
            cursor.execute("""
                INSERT INTO extracted_fields (
                    inspection_id, field_key, field_label, detected_value, is_detected, confidence, bounding_box_json, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                inspection_id,
                field_key,
                f.get("field_label", field_key),
                f.get("detected_value"),
                1 if f.get("is_detected") else 0,
                f.get("confidence", 0.0),
                bbox_json,
                f.get("status", "NOT_DETECTED")
            ))

        # 3. Insert compliance checks
        cursor.execute("DELETE FROM compliance_checks WHERE inspection_id = ?", (inspection_id,))
        for c in checks:
            cursor.execute("""
                INSERT INTO compliance_checks (
                    inspection_id, rule_id, rule_code, rule_name, category, required, status, score_contribution, reason, citation
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                inspection_id,
                c.get("rule_id"),
                c.get("rule_code"),
                c.get("rule_name"),
                c.get("category"),
                1 if c.get("required") else 0,
                c.get("status"),
                c.get("score_contribution", 0.0),
                c.get("reason"),
                c.get("citation")
            ))

        # 4. Insert violations
        cursor.execute("DELETE FROM violations WHERE inspection_id = ?", (inspection_id,))
        for v in violations:
            bbox_json = json.dumps(v.get("evidence_bbox")) if v.get("evidence_bbox") else None
            cursor.execute("""
                INSERT INTO violations (
                    inspection_id, rule_id, title, description, severity, evidence_text, evidence_bbox_json, recommendation
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                inspection_id,
                v.get("rule_id"),
                v.get("title"),
                v.get("description"),
                v.get("severity"),
                v.get("evidence_text"),
                bbox_json,
                v.get("recommendation")
            ))

        conn.commit()
        conn.close()

        return {
            "inspection_id": inspection_id,
            "compliance_score": score,
            "status": status,
            "risk_level": risk_level,
            "checks": checks,
            "violations": violations
        }

compliance_service_instance = ComplianceService()
