import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
)
from config import REPORT_DIR, BASE_DIR
from models.database import get_db_connection

class ReportService:
    def __init__(self):
        self.report_dir = REPORT_DIR
        self.report_dir.mkdir(parents=True, exist_ok=True)

    def generate_inspection_pdf(self, inspection_id: str, user_id: Optional[int] = 1) -> Dict[str, Any]:
        """
        Generates a professional, print-ready PDF inspection report for the specified inspection ID.
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch inspection
        cursor.execute("SELECT * FROM inspections WHERE id = ?", (inspection_id,))
        insp = cursor.fetchone()
        if not insp:
            conn.close()
            raise ValueError(f"Inspection {inspection_id} not found")

        # Fetch user/inspector
        inspector_name = "Inspector R. Verma (LM-IND-2026-489)"
        if insp["user_id"]:
            cursor.execute("SELECT full_name, badge_number FROM users WHERE id = ?", (insp["user_id"],))
            u = cursor.fetchone()
            if u:
                inspector_name = f"{u['full_name']} ({u['badge_number'] or 'LM-OFFICER'})"

        # Fetch extracted fields
        cursor.execute("SELECT * FROM extracted_fields WHERE inspection_id = ?", (inspection_id,))
        fields = cursor.fetchall()

        # Fetch compliance checks
        cursor.execute("SELECT * FROM compliance_checks WHERE inspection_id = ?", (inspection_id,))
        checks = cursor.fetchall()

        # Fetch violations
        cursor.execute("SELECT * FROM violations WHERE inspection_id = ?", (inspection_id,))
        violations = cursor.fetchall()

        report_id = f"REP-{inspection_id}"
        pdf_filename = f"{report_id}.pdf"
        pdf_path = self.report_dir / pdf_filename

        # Build PDF Document
        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom styles with dark slate enterprise accents
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0f172a')
        )

        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#475569')
        )

        section_heading = ParagraphStyle(
            'SectionHead',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=12,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            'BodyDark',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#334155')
        )

        badge_style = ParagraphStyle(
            'BadgeText',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=12,
            textColor=colors.white
        )

        story = []

        # 1. Header Banner Table
        header_data = [
            [
                Paragraph("<b>PACKAUDIT AI</b><br/><font size=8 color='#64748b'>LEGAL METROLOGY INTELLIGENCE DOSSIER</font>", title_style),
                Paragraph(f"<b>REPORT ID:</b> {report_id}<br/><b>DATE:</b> {insp['created_at'][:10]}<br/><b>INSPECTOR:</b> {inspector_name}", subtitle_style)
            ]
        ]
        header_table = Table(header_data, colWidths=[300, 240])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(header_table)
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceBefore=2, spaceAfter=10))

        # 2. Executive Summary Box
        status_color = colors.HexColor('#10b981') if insp['status'] == 'COMPLIANT' else (
            colors.HexColor('#f59e0b') if insp['status'] == 'REVIEW_REQUIRED' else colors.HexColor('#ef4444')
        )
        
        status_label = "COMPLIANT" if insp['status'] == 'COMPLIANT' else (
            "REVIEW REQUIRED" if insp['status'] == 'REVIEW_REQUIRED' else "NON-COMPLIANT"
        )

        summary_data = [
            [
                Paragraph(f"<b>Product:</b> {insp['product_name']}<br/><b>Brand:</b> {insp['brand'] or 'N/A'}<br/><b>Category:</b> {insp['category']}", body_style),
                Paragraph(f"<b>Audit Score:</b> <font size=14 color='{status_color.hexval()}'><b>{int(insp['compliance_score'])} / 100</b></font><br/><b>Status:</b> {status_label}<br/><b>Risk Tier:</b> {insp['risk_level']}", body_style)
            ]
        ]
        summary_table = Table(summary_data, colWidths=[270, 270])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('PADDING', (0,0), (-1,-1), 10),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 12))

        # 3. Extracted Mandatory Declarations Table
        story.append(Paragraph("1. Extracted Mandatory Declarations (Rule 6)", section_heading))
        field_rows = [["Declaration Field", "Detected Label Content", "Confidence", "Status"]]
        for f in fields:
            val_text = f["detected_value"] if f["detected_value"] else "<i>Not Detected</i>"
            conf_text = f"{int(f['confidence'] * 100)}%" if f["is_detected"] else "--"
            status_chip = f["status"]
            field_rows.append([
                Paragraph(f"<b>{f['field_label']}</b>", body_style),
                Paragraph(val_text, body_style),
                Paragraph(conf_text, body_style),
                Paragraph(status_chip, body_style)
            ])
        
        field_table = Table(field_rows, colWidths=[140, 260, 60, 80])
        field_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 8.5),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(field_table)
        story.append(Spacer(1, 12))

        # 4. Legal Metrology Compliance Check Results
        story.append(Paragraph("2. Legal Metrology Rules Evaluation", section_heading))
        check_rows = [["Rule Code", "Rule Specification", "Legal Citation", "Result", "Pts"]]
        for c in checks:
            check_rows.append([
                Paragraph(f"<b>{c['rule_code']}</b>", body_style),
                Paragraph(c['rule_name'], body_style),
                Paragraph(f"<font size=7 color='#64748b'>{c['citation']}</font>", body_style),
                Paragraph(f"<b>{c['status']}</b>", body_style),
                Paragraph(str(int(c['score_contribution'])), body_style)
            ])

        check_table = Table(check_rows, colWidths=[70, 190, 180, 60, 40])
        check_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 8.5),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
            ('PADDING', (0,0), (-1,-1), 4.5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(check_table)
        story.append(Spacer(1, 12))

        # 5. Violations & Recommended Actions
        if violations:
            story.append(Paragraph("3. Flagged Violations & Corrective Actions", section_heading))
            viol_rows = [["Severity", "Violation Title & Description", "Recommended Action"]]
            for v in violations:
                viol_rows.append([
                    Paragraph(f"<b>{v['severity']}</b>", body_style),
                    Paragraph(f"<b>{v['title']}</b><br/><font size=8 color='#475569'>{v['description']}</font>", body_style),
                    Paragraph(f"<font size=8 color='#047857'>{v['recommendation']}</font>", body_style)
                ])

            viol_table = Table(viol_rows, colWidths=[70, 270, 200])
            viol_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#991b1b')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 8.5),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fecaca')),
                ('PADDING', (0,0), (-1,-1), 5),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            story.append(viol_table)
            story.append(Spacer(1, 12))

        # 6. Official Disclaimer
        disclaimer_text = (
            "<b>STATUTORY NOTICE & DISCLAIMER:</b> PackAudit AI is an automated, AI-assisted computer vision "
            "and natural language compliance screening tool designed under the Legal Metrology (Packaged Commodities) "
            "Rules, 2011. This electronic audit record is advisory and does not replace the statutory authority "
            "or final determination of an appointed Legal Metrology Officer or Controller of Legal Metrology."
        )
        disclaimer_table = Table([[Paragraph(disclaimer_text, ParagraphStyle('Disc', parent=styles['Normal'], fontSize=7.5, leading=10, textColor=colors.HexColor('#475569')))]], colWidths=[540])
        disclaimer_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(disclaimer_table)

        # Build PDF
        doc.build(story)

        file_size = os.path.getsize(pdf_path)

        # Record in database
        cursor.execute("DELETE FROM reports WHERE inspection_id = ?", (inspection_id,))
        cursor.execute("""
            INSERT INTO reports (id, inspection_id, user_id, file_path, file_name, file_size_bytes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (report_id, inspection_id, user_id, str(pdf_path), pdf_filename, file_size))

        conn.commit()
        conn.close()

        return {
            "report_id": report_id,
            "inspection_id": inspection_id,
            "file_name": pdf_filename,
            "file_path": str(pdf_path),
            "file_size_bytes": file_size,
            "download_url": f"/api/reports/{report_id}/download"
        }

report_service_instance = ReportService()
