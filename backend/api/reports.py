from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse
from typing import List, Dict, Any, Optional
from pathlib import Path
from models.database import get_db_connection
from utils.security import get_current_user
from services.report_service import report_service_instance
from config import REPORT_DIR

router = APIRouter(tags=["Reports"])

@router.post("/inspections/{inspection_id}/report", response_model=Dict[str, Any])
def generate_report(inspection_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        user_id = current_user.get("id", 1)
        result = report_service_instance.generate_inspection_pdf(inspection_id, user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"PDF Generation error: {str(e)}")

@router.get("/reports", response_model=List[Dict[str, Any]])
def list_reports(current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT r.id, r.inspection_id, r.file_name, r.file_size_bytes, r.created_at,
               i.product_name, i.brand, i.status, i.compliance_score, u.full_name as inspector_name
        FROM reports r
        JOIN inspections i ON r.inspection_id = i.id
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": r["id"],
            "inspection_id": r["inspection_id"],
            "product_name": r["product_name"],
            "brand": r["brand"] or "Standard Pack",
            "status": r["status"],
            "compliance_score": round(r["compliance_score"], 1),
            "inspector_name": r["inspector_name"] or "Inspector R. Verma",
            "file_name": r["file_name"],
            "file_size_bytes": r["file_size_bytes"],
            "created_at": r["created_at"],
            "download_url": f"/api/reports/{r['id']}/download"
        }
        for r in rows
    ]

@router.get("/reports/{report_id}/download")
def download_report_pdf(report_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT file_path, file_name FROM reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report {report_id} not found.")

    file_path = Path(row["file_path"])
    if not file_path.exists():
        # Regenerate if file missing
        try:
            insp_id = report_id.replace("REP-", "")
            res = report_service_instance.generate_inspection_pdf(insp_id)
            file_path = Path(res["file_path"])
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found on disk.")

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=row["file_name"],
        headers={"Content-Disposition": f'attachment; filename="{row["file_name"]}"'}
    )

@router.get("/reports/{report_id}/preview")
def preview_report_pdf(report_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT file_path, file_name FROM reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report {report_id} not found.")

    file_path = Path(row["file_path"])
    if not file_path.exists():
        try:
            insp_id = report_id.replace("REP-", "")
            res = report_service_instance.generate_inspection_pdf(insp_id)
            file_path = Path(res["file_path"])
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found on disk.")

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{row["file_name"]}"'}
    )
