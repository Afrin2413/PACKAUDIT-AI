from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from models.database import get_db_connection
from utils.security import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("", response_model=Dict[str, Any])
def get_analytics_data(current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Total inspections check
    cursor.execute("SELECT COUNT(*) as count FROM inspections")
    total_count = cursor.fetchone()["count"]

    if total_count == 0:
        conn.close()
        return {
            "total_inspections": 0,
            "compliance_distribution": {"COMPLIANT": 0, "REVIEW_REQUIRED": 0, "NON_COMPLIANT": 0},
            "risk_distribution": {"LOW": 0, "MEDIUM": 0, "HIGH": 0},
            "inspection_volume_trend": [],
            "category_breakdown": [],
            "top_violating_rules": []
        }

    # 2. Compliance Distribution
    cursor.execute("""
        SELECT status, COUNT(*) as count
        FROM inspections
        GROUP BY status
    """)
    comp_dist = {"COMPLIANT": 0, "REVIEW_REQUIRED": 0, "NON_COMPLIANT": 0}
    for r in cursor.fetchall():
        if r["status"] in comp_dist:
            comp_dist[r["status"]] = r["count"]

    # 3. Risk Distribution
    cursor.execute("""
        SELECT risk_level, COUNT(*) as count
        FROM inspections
        GROUP BY risk_level
    """)
    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    for r in cursor.fetchall():
        if r["risk_level"] in risk_dist:
            risk_dist[r["risk_level"]] = r["count"]

    # 4. Inspection Volume Trend
    cursor.execute("""
        SELECT strftime('%Y-%m-%d', created_at) as day,
               COUNT(*) as count,
               AVG(compliance_score) as avg_score,
               SUM(CASE WHEN status = 'COMPLIANT' THEN 1 ELSE 0 END) as compliant_count
        FROM inspections
        GROUP BY day
        ORDER BY day ASC
        LIMIT 30
    """)
    trend = [
        {
            "date": r["day"],
            "count": r["count"],
            "avg_score": round(r["avg_score"], 1),
            "compliant_count": r["compliant_count"]
        }
        for r in cursor.fetchall()
    ]

    # 5. Category Breakdown
    cursor.execute("""
        SELECT category, COUNT(*) as count, AVG(compliance_score) as avg_score
        FROM inspections
        GROUP BY category
        ORDER BY count DESC
    """)
    cat_breakdown = [
        {
            "category": r["category"] or "General",
            "count": r["count"],
            "avg_score": round(r["avg_score"], 1)
        }
        for r in cursor.fetchall()
    ]

    # 6. Top Violating Rules
    cursor.execute("""
        SELECT c.rule_code, c.rule_name, c.citation, c.category, COUNT(v.id) as violation_count
        FROM violations v
        JOIN compliance_checks c ON v.rule_id = c.rule_id AND v.inspection_id = c.inspection_id
        GROUP BY c.rule_code, c.rule_name, c.citation, c.category
        ORDER BY violation_count DESC
        LIMIT 10
    """)
    top_viol_rules = [
        {
            "rule_code": r["rule_code"],
            "rule_name": r["rule_name"],
            "citation": r["citation"],
            "category": r["category"],
            "violation_count": r["violation_count"]
        }
        for r in cursor.fetchall()
    ]

    conn.close()

    return {
        "total_inspections": total_count,
        "compliance_distribution": comp_dist,
        "risk_distribution": risk_dist,
        "inspection_volume_trend": trend,
        "category_breakdown": cat_breakdown,
        "top_violating_rules": top_viol_rules
    }
