import json
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from config import RULES_FILE
from models.database import get_db_connection

class RuleEngine:
    def __init__(self):
        self.rules_file = RULES_FILE
        self._load_rules()

    def _load_rules(self) -> Dict[str, Any]:
        if self.rules_file.exists():
            try:
                with open(self.rules_file, "r", encoding="utf-8") as f:
                    self.config = json.load(f)
                    return self.config
            except Exception as e:
                print(f"Error loading rules from JSON: {e}")
        
        # Fallback default rules
        self.config = {
            "version": "1.0.0",
            "title": "Legal Metrology (Packaged Commodities) Rules, 2011",
            "rules": []
        }
        return self.config

    def get_rules(self) -> List[Dict[str, Any]]:
        self._load_rules()
        return self.config.get("rules", [])

    def get_rule_by_id(self, rule_id: str) -> Optional[Dict[str, Any]]:
        rules = self.get_rules()
        for r in rules:
            if r.get("id") == rule_id:
                return r
        return None

    def update_rule(self, rule_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        self._load_rules()
        rules = self.config.get("rules", [])
        updated = False
        target_rule = None
        for r in rules:
            if r.get("id") == rule_id:
                for k, v in updates.items():
                    if v is not None:
                        r[k] = v
                target_rule = r
                updated = True
                break
        
        if updated:
            with open(self.rules_file, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=2)
            
            # Log version in DB
            try:
                conn = get_db_connection()
                conn.execute(
                    "INSERT INTO rule_versions (version, rules_json, updated_by) VALUES (?, ?, ?)",
                    (self.config.get("version", "1.0.0"), json.dumps(self.config), "Admin")
                )
                conn.commit()
                conn.close()
            except Exception as e:
                print(f"DB log rule error: {e}")
                
        return target_rule

    def evaluate_compliance(self, extracted_fields: Dict[str, Dict[str, Any]], overall_ocr_conf: float = 0.8) -> Tuple[float, str, str, List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Evaluates extracted package declarations against active Legal Metrology rules.
        Returns:
            - compliance_score: float (0.0 to 100.0)
            - status: str (COMPLIANT, REVIEW_REQUIRED, NON_COMPLIANT)
            - risk_level: str (LOW, MEDIUM, HIGH)
            - checks: List of compliance check result objects
            - violations: List of violation objects
        """
        rules = [r for r in self.get_rules() if r.get("enabled", True)]
        
        total_possible_weight = sum(r.get("weight", 10) for r in rules)
        if total_possible_weight == 0:
            total_possible_weight = 100.0

        earned_weight = 0.0
        checks = []
        violations = []
        mandatory_missing_count = 0
        review_count = 0

        for r in rules:
            rule_id = r.get("id")
            field_key = r.get("field_key")
            field_data = extracted_fields.get(field_key, {})
            is_detected = field_data.get("is_detected", False)
            conf = field_data.get("confidence", 0.0)
            detected_val = field_data.get("detected_value")
            weight = r.get("weight", 10)
            required = r.get("required", True)
            min_conf = r.get("min_confidence", 0.60)
            citation = r.get("legal_reference", "Legal Metrology Rules, 2011")
            bbox = field_data.get("bounding_box")

            check_status = "FAILED"
            reason = ""
            score_contrib = 0.0

            if is_detected and detected_val and len(str(detected_val).strip()) > 0:
                if conf >= min_conf:
                    check_status = "PASSED"
                    score_contrib = weight
                    earned_weight += weight
                    reason = f"Valid declaration detected with high confidence ({int(conf * 100)}%): '{detected_val}'"
                else:
                    check_status = "REVIEW"
                    score_contrib = weight * 0.5
                    earned_weight += score_contrib
                    review_count += 1
                    reason = f"Declaration detected but OCR confidence is moderate ({int(conf * 100)}% < threshold {int(min_conf * 100)}%). Inspector review required."
                    violations.append({
                        "rule_id": rule_id,
                        "title": f"Low OCR Clarity: {r.get('name')}",
                        "description": f"Text detected ('{detected_val}') had lower confidence score ({int(conf * 100)}%). Needs visual confirmation by inspector.",
                        "severity": "LOW" if not required else "MEDIUM",
                        "evidence_text": str(detected_val),
                        "evidence_bbox": bbox,
                        "recommendation": f"Inspect the physical label area to verify if '{detected_val}' is accurate."
                    })
            else:
                check_status = "FAILED"
                score_contrib = 0.0
                if required:
                    mandatory_missing_count += 1
                    reason = f"Mandatory declaration required by {citation} was NOT detected in the package label."
                    violations.append({
                        "rule_id": rule_id,
                        "title": f"Missing Mandatory Declaration: {r.get('name')}",
                        "description": f"Under {citation}, '{r.get('name')}' must be prominently displayed on the principal display panel or declaration panel.",
                        "severity": r.get("severity", "HIGH"),
                        "evidence_text": "Not detected in OCR extraction",
                        "evidence_bbox": None,
                        "recommendation": f"Issue advisory/notice under Legal Metrology Rules for missing {r.get('name')}."
                    })
                else:
                    reason = f"Optional declaration was not detected on the scanned panel."

            checks.append({
                "rule_id": rule_id,
                "rule_code": r.get("code", "RULE"),
                "rule_name": r.get("name", "Rule Check"),
                "category": r.get("category", "General"),
                "required": required,
                "status": check_status,
                "score_contribution": round(score_contrib, 1),
                "reason": reason,
                "citation": citation
            })

        # Calculate mathematical score out of 100
        raw_score = (earned_weight / total_possible_weight) * 100.0
        final_score = max(0.0, min(100.0, round(raw_score, 1)))

        # Determine overall Status & Risk
        if mandatory_missing_count == 0 and review_count == 0 and final_score >= 88.0:
            status = "COMPLIANT"
            risk_level = "LOW"
        elif mandatory_missing_count == 0 and (review_count > 0 or final_score >= 65.0):
            status = "REVIEW_REQUIRED"
            risk_level = "MEDIUM"
        else:
            status = "NON_COMPLIANT"
            risk_level = "HIGH" if mandatory_missing_count >= 2 or final_score < 50.0 else "MEDIUM"

        return final_score, status, risk_level, checks, violations

rule_engine_instance = RuleEngine()
