from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from models.database import get_db_connection
from models.schemas import DashboardStats
from utils.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Total Inspections
    cursor.execute("SELECT COUNT(*) as count FROM inspections")
    total_inspections = cursor.fetchone()["count"]

    if total_inspections == 0:
        conn.close()
        return {
            "total_inspections": 0,
            "compliance_rate": 0.0,
            "review_required_count": 0,
            "violations_detected_count": 0,
            "recent_inspections": [],
            "compliance_trend": [],
            "top_violation_types": []
        }

    # 2. Compliant count & rate
    cursor.execute("SELECT COUNT(*) as count FROM inspections WHERE status = 'COMPLIANT'")
    compliant_count = cursor.fetchone()["count"]
    compliance_rate = round((compliant_count / total_inspections) * 100.0, 1)

    # 3. Review required count
    cursor.execute("SELECT COUNT(*) as count FROM inspections WHERE status = 'REVIEW_REQUIRED'")
    review_count = cursor.fetchone()["count"]

    # 4. Total Violations
    cursor.execute("SELECT COUNT(*) as count FROM violations")
    violations_count = cursor.fetchone()["count"]

    # 5. Recent Inspections (Last 8)
    cursor.execute("""
        SELECT i.id, i.product_name, i.brand, i.category, i.compliance_score, 
               i.status, i.risk_level, i.created_at, u.full_name as inspector_name
        FROM inspections i
        LEFT JOIN users u ON i.user_id = u.id
        ORDER BY i.created_at DESC
        LIMIT 8
    """)
    recent_rows = cursor.fetchall()
    recent_inspections = [
        {
            "id": r["id"],
            "product_name": r["product_name"],
            "brand": r["brand"] or "Standard Pack",
            "category": r["category"],
            "score": round(r["compliance_score"], 1),
            "status": r["status"],
            "risk_level": r["risk_level"],
            "date": r["created_at"][:10] if r["created_at"] else "2026-03-20",
            "inspector": r["inspector_name"] or "Inspector R. Verma"
        }
        for r in recent_rows
    ]

    # 6. Compliance Trend (Aggregated by day or recent items)
    cursor.execute("""
        SELECT date(created_at) as insp_date,
               COUNT(*) as total,
               SUM(CASE WHEN status = 'COMPLIANT' THEN 1 ELSE 0 END) as compliant,
               SUM(CASE WHEN status = 'REVIEW_REQUIRED' THEN 1 ELSE 0 END) as review,
               SUM(CASE WHEN status = 'NON_COMPLIANT' THEN 1 ELSE 0 END) as non_compliant,
               AVG(compliance_score) as avg_score
        FROM inspections
        GROUP BY date(created_at)
        ORDER BY insp_date ASC
        LIMIT 14
    """)
    trend_rows = cursor.fetchall()
    compliance_trend = [
        {
            "date": r["insp_date"] or "2026-03-20",
            "total": r["total"],
            "compliant": r["compliant"],
            "review": r["review"],
            "non_compliant": r["non_compliant"],
            "avg_score": round(r["avg_score"], 1) if r["avg_score"] else 0.0
        }
        for r in trend_rows
    ]

    # 7. Top Violation Types
    cursor.execute("""
        SELECT c.category, COUNT(v.id) as count
        FROM violations v
        JOIN compliance_checks c ON v.rule_id = c.rule_id AND v.inspection_id = c.inspection_id
        GROUP BY c.category
        ORDER BY count DESC
    """)
    cat_rows = cursor.fetchall()
    top_violation_types = [
        {"category": r["category"] or "General", "count": r["count"]}
        for r in cat_rows
    ]
    if not top_violation_types:
        # Fallback to direct check categories if few violations
        top_violation_types = [
            {"category": "Pricing (MRP)", "count": 0},
            {"category": "Quantity", "count": 0},
            {"category": "Redressal", "count": 0},
            {"category": "Traceability", "count": 0},
            {"category": "Identity", "count": 0}
        ]

    conn.close()

    return {
        "total_inspections": total_inspections,
        "compliance_rate": compliance_rate,
        "review_required_count": review_count,
        "violations_detected_count": violations_count,
        "recent_inspections": recent_inspections,
        "compliance_trend": compliance_trend,
        "top_violation_types": top_violation_types
    }
