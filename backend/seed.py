import os
import json
import time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from models.database import init_db, get_db_connection
from utils.security import get_password_hash
from services.compliance_service import compliance_service_instance
from services.report_service import report_service_instance
from config import UPLOAD_DIR, REPORT_DIR, BASE_DIR

def create_sample_label_image(filename: str, title: str, details: list) -> Path:
    """Generates a crisp, legible package label mockup image for OCR and evidence viewer."""
    width, height = 800, 600
    # Dark charcoal background with crisp border and light text
    image = Image.new("RGB", (width, height), color=(26, 30, 38))
    draw = ImageDraw.Draw(image)

    # Outer border
    draw.rectangle([(20, 20), (width - 20, height - 20)], outline=(55, 65, 81), width=2)
    draw.rectangle([(25, 25), (width - 25, height - 25)], outline=(30, 41, 59), width=1)

    # Header Box
    draw.rectangle([(30, 30), (width - 30, 90)], fill=(15, 23, 42))
    
    # Try default font or basic bitmap font
    try:
        font_large = ImageFont.truetype("arial.ttf", 24)
        font_med = ImageFont.truetype("arial.ttf", 16)
        font_small = ImageFont.truetype("arial.ttf", 13)
        font_bold = ImageFont.truetype("arialbd.ttf", 15)
    except Exception:
        font_large = font_med = font_small = font_bold = ImageFont.load_default()

    draw.text((50, 45), title.upper(), fill=(243, 244, 246), font=font_large)
    draw.text((width - 240, 50), "MANDATORY DECLARATIONS", fill=(52, 211, 153), font=font_small)

    # Draw label detail rows
    y = 120
    for label, val in details:
        # Background strip for row
        draw.rectangle([(40, y - 5), (width - 40, y + 35)], fill=(31, 36, 46), outline=(45, 55, 72))
        draw.text((55, y + 4), f"{label}:", fill=(148, 163, 184), font=font_bold)
        draw.text((260, y + 4), str(val), fill=(241, 245, 249), font=font_med)
        y += 50

    # Barcode representation at bottom
    bar_y = height - 100
    draw.rectangle([(width - 260, bar_y), (width - 50, bar_y + 60)], fill=(255, 255, 255))
    for bx in range(width - 250, width - 60, 6):
        draw.line([(bx, bar_y + 5), (bx, bar_y + 45)], fill=(0, 0, 0), width=2 if (bx % 12 == 0) else 1)
    draw.text((width - 230, bar_y + 46), "8 901234 567890", fill=(0, 0, 0), font=font_small)

    draw.text((50, height - 70), "LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011", fill=(100, 116, 139), font=font_small)

    out_path = UPLOAD_DIR / filename
    image.save(str(out_path), "PNG")
    return out_path

def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing demo data
    cursor.execute("DELETE FROM reports")
    cursor.execute("DELETE FROM violations")
    cursor.execute("DELETE FROM compliance_checks")
    cursor.execute("DELETE FROM extracted_fields")
    cursor.execute("DELETE FROM inspections")
    cursor.execute("DELETE FROM users")
    conn.commit()

    # 1. Seed Demo Inspector User
    password_hash = get_password_hash("audit2026!")
    cursor.execute("""
        INSERT INTO users (id, email, hashed_password, full_name, role, badge_number)
        VALUES (1, 'inspector@packaudit.gov.in', ?, 'Inspector Rajesh Verma', 'Senior Inspector', 'LM-IND-2026-489')
    """, (password_hash,))
    conn.commit()

    # 2. Define Sample Scenarios
    scenarios = [
        {
            "id": "INSP-2026-A101",
            "title": "Scenario A: Compliant FMCG Biscuit Pack",
            "product_name": "NutriBake Almond Crunch Biscuits",
            "brand": "NutriBake India Ltd",
            "category": "Packaged Food & Confectionery",
            "date": "2026-03-18 10:15:00",
            "filename": "sample_a_compliant_biscuits.png",
            "labels": [
                ("Generic Name", "Almond Crunch Butter Biscuits"),
                ("Net Quantity", "250 g"),
                ("MRP (incl. of taxes)", "Rs. 60.00 (incl. of all taxes)"),
                ("Date of Packing", "PKD: 02/2026"),
                ("Manufactured By", "NutriBake Foods Pvt Ltd, Plot 42, Food Park, Pune, MH 411028"),
                ("Consumer Care", "Helpline: 1800-209-4455 | Email: care@nutribake.in"),
                ("Country of Origin", "Made in India")
            ],
            "extracted": {
                "commodity_name": {"field_label": "Commodity Name", "detected_value": "Almond Crunch Butter Biscuits", "is_detected": True, "confidence": 0.98, "bounding_box": {"x": 40, "y": 115, "w": 720, "h": 40}, "status": "DETECTED"},
                "net_quantity": {"field_label": "Net Quantity", "detected_value": "250 g", "is_detected": True, "confidence": 0.97, "bounding_box": {"x": 40, "y": 165, "w": 720, "h": 40}, "status": "DETECTED"},
                "mrp": {"field_label": "Maximum Retail Price (MRP)", "detected_value": "Rs. 60.00 (incl. of all taxes)", "is_detected": True, "confidence": 0.96, "bounding_box": {"x": 40, "y": 215, "w": 720, "h": 40}, "status": "DETECTED"},
                "mfg_date": {"field_label": "Month & Year of Manufacture/Packing", "detected_value": "PKD: 02/2026", "is_detected": True, "confidence": 0.95, "bounding_box": {"x": 40, "y": 265, "w": 720, "h": 40}, "status": "DETECTED"},
                "manufacturer_packer": {"field_label": "Manufacturer / Packer / Importer", "detected_value": "NutriBake Foods Pvt Ltd, Plot 42, Food Park, Pune, MH 411028", "is_detected": True, "confidence": 0.94, "bounding_box": {"x": 40, "y": 315, "w": 720, "h": 40}, "status": "DETECTED"},
                "consumer_care": {"field_label": "Consumer Care Information", "detected_value": "Helpline: 1800-209-4455 | Email: care@nutribake.in", "is_detected": True, "confidence": 0.93, "bounding_box": {"x": 40, "y": 365, "w": 720, "h": 40}, "status": "DETECTED"},
                "country_of_origin": {"field_label": "Country of Origin", "detected_value": "Made in India", "is_detected": True, "confidence": 0.96, "bounding_box": {"x": 40, "y": 415, "w": 720, "h": 40}, "status": "DETECTED"}
            }
        },
        {
            "id": "INSP-2026-B202",
            "title": "Scenario B: Missing Consumer Care Redressal",
            "product_name": "Royal Kashmiri Garam Masala Blend",
            "brand": "Royal Spices Artisan",
            "category": "Spices & Condiments",
            "date": "2026-03-19 14:30:00",
            "filename": "sample_b_missing_care_spices.png",
            "labels": [
                ("Generic Name", "Pure Ground Garam Masala"),
                ("Net Quantity", "100 g"),
                ("MRP (incl. of taxes)", "₹125.00 (incl. of all taxes)"),
                ("Date of Packing", "MFD: 01/2026"),
                ("Manufactured By", "Royal Spice Mills, Khari Baoli, Old Delhi 110006"),
                ("Consumer Care", "[NOT PRINTED ON LABEL]"),
                ("Country of Origin", "Made in India")
            ],
            "extracted": {
                "commodity_name": {"field_label": "Commodity Name", "detected_value": "Pure Ground Garam Masala", "is_detected": True, "confidence": 0.95, "bounding_box": {"x": 40, "y": 115, "w": 720, "h": 40}, "status": "DETECTED"},
                "net_quantity": {"field_label": "Net Quantity", "detected_value": "100 g", "is_detected": True, "confidence": 0.94, "bounding_box": {"x": 40, "y": 165, "w": 720, "h": 40}, "status": "DETECTED"},
                "mrp": {"field_label": "Maximum Retail Price (MRP)", "detected_value": "₹125.00 (incl. of all taxes)", "is_detected": True, "confidence": 0.92, "bounding_box": {"x": 40, "y": 215, "w": 720, "h": 40}, "status": "DETECTED"},
                "mfg_date": {"field_label": "Month & Year of Manufacture/Packing", "detected_value": "MFD: 01/2026", "is_detected": True, "confidence": 0.91, "bounding_box": {"x": 40, "y": 265, "w": 720, "h": 40}, "status": "DETECTED"},
                "manufacturer_packer": {"field_label": "Manufacturer / Packer / Importer", "detected_value": "Royal Spice Mills, Khari Baoli, Old Delhi 110006", "is_detected": True, "confidence": 0.89, "bounding_box": {"x": 40, "y": 315, "w": 720, "h": 40}, "status": "DETECTED"},
                "consumer_care": {"field_label": "Consumer Care Information", "detected_value": None, "is_detected": False, "confidence": 0.0, "bounding_box": None, "status": "NOT_DETECTED"},
                "country_of_origin": {"field_label": "Country of Origin", "detected_value": "Made in India", "is_detected": True, "confidence": 0.95, "bounding_box": {"x": 40, "y": 415, "w": 720, "h": 40}, "status": "DETECTED"}
            }
        },
        {
            "id": "INSP-2026-C303",
            "title": "Scenario C: Non-Compliant Imported Beverage",
            "product_name": "VoltMax Electrolyte Energy Tonic",
            "brand": "VoltMax Global",
            "category": "Beverages & Energy Drinks",
            "date": "2026-03-20 09:45:00",
            "filename": "sample_c_non_compliant_beverage.png",
            "labels": [
                ("Generic Name", "Carbonated Caffeinated Beverage"),
                ("Net Quantity", "12 FL OZ (355 ml)"),  # Non-standard unit violation
                ("MRP (incl. of taxes)", "$3.99 / ₹350"),     # Ambiguous pricing
                ("Date of Packing", "[NO MFD/PKD PRINTED]"),  # Missing date
                ("Manufactured By", "[IMPORTER ADDRESS MISSING]"), # Missing mandatory importer
                ("Consumer Care", "Visit: www.voltmax-global.com"), # Missing helpline & email
                ("Country of Origin", "Product of Austria")
            ],
            "extracted": {
                "commodity_name": {"field_label": "Commodity Name", "detected_value": "Carbonated Caffeinated Beverage", "is_detected": True, "confidence": 0.92, "bounding_box": {"x": 40, "y": 115, "w": 720, "h": 40}, "status": "DETECTED"},
                "net_quantity": {"field_label": "Net Quantity", "detected_value": "12 FL OZ (355 ml)", "is_detected": True, "confidence": 0.65, "bounding_box": {"x": 40, "y": 165, "w": 720, "h": 40}, "status": "REVIEW"},
                "mrp": {"field_label": "Maximum Retail Price (MRP)", "detected_value": "$3.99 / ₹350", "is_detected": True, "confidence": 0.60, "bounding_box": {"x": 40, "y": 215, "w": 720, "h": 40}, "status": "REVIEW"},
                "mfg_date": {"field_label": "Month & Year of Manufacture/Packing", "detected_value": None, "is_detected": False, "confidence": 0.0, "bounding_box": None, "status": "NOT_DETECTED"},
                "manufacturer_packer": {"field_label": "Manufacturer / Packer / Importer", "detected_value": None, "is_detected": False, "confidence": 0.0, "bounding_box": None, "status": "NOT_DETECTED"},
                "consumer_care": {"field_label": "Consumer Care Information", "detected_value": "Visit: www.voltmax-global.com", "is_detected": True, "confidence": 0.55, "bounding_box": {"x": 40, "y": 365, "w": 720, "h": 40}, "status": "REVIEW"},
                "country_of_origin": {"field_label": "Country of Origin", "detected_value": "Product of Austria", "is_detected": True, "confidence": 0.92, "bounding_box": {"x": 40, "y": 415, "w": 720, "h": 40}, "status": "DETECTED"}
            }
        },
        {
            "id": "INSP-2026-D404",
            "title": "Organic Rolled Oats 1kg",
            "product_name": "EarthHarvest Organic Rolled Oats",
            "brand": "EarthHarvest Organic",
            "category": "Grains & Cereals",
            "date": "2026-03-15 11:20:00",
            "filename": "sample_d_oats.png",
            "labels": [
                ("Generic Name", "100% Whole Grain Rolled Oats"),
                ("Net Quantity", "1 kg"),
                ("MRP (incl. of taxes)", "₹280.00 (incl. of all taxes)"),
                ("Date of Packing", "PKD: 02/2026"),
                ("Manufactured By", "EarthHarvest Foods, Sector 62, Noida, UP 201309"),
                ("Consumer Care", "Helpline: 1800-419-8800 | contact@earthharvest.com"),
                ("Country of Origin", "Made in India")
            ],
            "extracted": {
                "commodity_name": {"field_label": "Commodity Name", "detected_value": "100% Whole Grain Rolled Oats", "is_detected": True, "confidence": 0.97, "bounding_box": {"x": 40, "y": 115, "w": 720, "h": 40}, "status": "DETECTED"},
                "net_quantity": {"field_label": "Net Quantity", "detected_value": "1 kg", "is_detected": True, "confidence": 0.98, "bounding_box": {"x": 40, "y": 165, "w": 720, "h": 40}, "status": "DETECTED"},
                "mrp": {"field_label": "Maximum Retail Price (MRP)", "detected_value": "₹280.00 (incl. of all taxes)", "is_detected": True, "confidence": 0.95, "bounding_box": {"x": 40, "y": 215, "w": 720, "h": 40}, "status": "DETECTED"},
                "mfg_date": {"field_label": "Month & Year of Manufacture/Packing", "detected_value": "PKD: 02/2026", "is_detected": True, "confidence": 0.94, "bounding_box": {"x": 40, "y": 265, "w": 720, "h": 40}, "status": "DETECTED"},
                "manufacturer_packer": {"field_label": "Manufacturer / Packer / Importer", "detected_value": "EarthHarvest Foods, Sector 62, Noida, UP 201309", "is_detected": True, "confidence": 0.93, "bounding_box": {"x": 40, "y": 315, "w": 720, "h": 40}, "status": "DETECTED"},
                "consumer_care": {"field_label": "Consumer Care Information", "detected_value": "Helpline: 1800-419-8800 | contact@earthharvest.com", "is_detected": True, "confidence": 0.92, "bounding_box": {"x": 40, "y": 365, "w": 720, "h": 40}, "status": "DETECTED"},
                "country_of_origin": {"field_label": "Country of Origin", "detected_value": "Made in India", "is_detected": True, "confidence": 0.97, "bounding_box": {"x": 40, "y": 415, "w": 720, "h": 40}, "status": "DETECTED"}
            }
        },
        {
            "id": "INSP-2026-E505",
            "title": "Cold-Pressed Virgin Coconut Oil",
            "product_name": "Kerala Gold Cold Pressed Virgin Coconut Oil",
            "brand": "Kerala Gold Agro",
            "category": "Edible Oils",
            "date": "2026-03-16 16:40:00",
            "filename": "sample_e_oil.png",
            "labels": [
                ("Generic Name", "Pure Cold Pressed Virgin Coconut Oil"),
                ("Net Quantity", "500 ml"),
                ("MRP (incl. of taxes)", "₹240.00 incl. of all taxes"),
                ("Date of Packing", "MFD: 01/2026"),
                ("Manufactured By", "Kerala Gold Agro Farms, Alappuzha, Kerala 688001"),
                ("Consumer Care", "Tel: 0477-2244888 | care@keralagold.in"),
                ("Country of Origin", "Made in India")
            ],
            "extracted": {
                "commodity_name": {"field_label": "Commodity Name", "detected_value": "Pure Cold Pressed Virgin Coconut Oil", "is_detected": True, "confidence": 0.96, "bounding_box": {"x": 40, "y": 115, "w": 720, "h": 40}, "status": "DETECTED"},
                "net_quantity": {"field_label": "Net Quantity", "detected_value": "500 ml", "is_detected": True, "confidence": 0.96, "bounding_box": {"x": 40, "y": 165, "w": 720, "h": 40}, "status": "DETECTED"},
                "mrp": {"field_label": "Maximum Retail Price (MRP)", "detected_value": "₹240.00 incl. of all taxes", "is_detected": True, "confidence": 0.95, "bounding_box": {"x": 40, "y": 215, "w": 720, "h": 40}, "status": "DETECTED"},
                "mfg_date": {"field_label": "Month & Year of Manufacture/Packing", "detected_value": "MFD: 01/2026", "is_detected": True, "confidence": 0.94, "bounding_box": {"x": 40, "y": 265, "w": 720, "h": 40}, "status": "DETECTED"},
                "manufacturer_packer": {"field_label": "Manufacturer / Packer / Importer", "detected_value": "Kerala Gold Agro Farms, Alappuzha, Kerala 688001", "is_detected": True, "confidence": 0.91, "bounding_box": {"x": 40, "y": 315, "w": 720, "h": 40}, "status": "DETECTED"},
                "consumer_care": {"field_label": "Consumer Care Information", "detected_value": "Tel: 0477-2244888 | care@keralagold.in", "is_detected": True, "confidence": 0.90, "bounding_box": {"x": 40, "y": 365, "w": 720, "h": 40}, "status": "DETECTED"},
                "country_of_origin": {"field_label": "Country of Origin", "detected_value": "Made in India", "is_detected": True, "confidence": 0.97, "bounding_box": {"x": 40, "y": 415, "w": 720, "h": 40}, "status": "DETECTED"}
            }
        },
        {
            "id": "INSP-2026-F606",
            "title": "Herbal Ayurvedic Shampoo",
            "product_name": "VedaHerb Anti-Dandruff Herbal Shampoo",
            "brand": "VedaHerb Naturals",
            "category": "Personal Care & Cosmetics",
            "date": "2026-03-17 12:10:00",
            "filename": "sample_f_shampoo.png",
            "labels": [
                ("Generic Name", "Ayurvedic Hair Cleanser Shampoo"),
                ("Net Quantity", "200 ml"),
                ("MRP (incl. of taxes)", "Rs. 199.00 (incl. of all taxes)"),
                ("Date of Packing", "MFG: 02/2026"),
                ("Manufactured By", "VedaHerb Labs, Baddi, Solan, HP 173205"),
                ("Consumer Care", "Email: helpline@vedaherb.co.in"),
                ("Country of Origin", "Made in India")
            ],
            "extracted": {
                "commodity_name": {"field_label": "Commodity Name", "detected_value": "Ayurvedic Hair Cleanser Shampoo", "is_detected": True, "confidence": 0.94, "bounding_box": {"x": 40, "y": 115, "w": 720, "h": 40}, "status": "DETECTED"},
                "net_quantity": {"field_label": "Net Quantity", "detected_value": "200 ml", "is_detected": True, "confidence": 0.95, "bounding_box": {"x": 40, "y": 165, "w": 720, "h": 40}, "status": "DETECTED"},
                "mrp": {"field_label": "Maximum Retail Price (MRP)", "detected_value": "Rs. 199.00 (incl. of all taxes)", "is_detected": True, "confidence": 0.93, "bounding_box": {"x": 40, "y": 215, "w": 720, "h": 40}, "status": "DETECTED"},
                "mfg_date": {"field_label": "Month & Year of Manufacture/Packing", "detected_value": "MFG: 02/2026", "is_detected": True, "confidence": 0.91, "bounding_box": {"x": 40, "y": 265, "w": 720, "h": 40}, "status": "DETECTED"},
                "manufacturer_packer": {"field_label": "Manufacturer / Packer / Importer", "detected_value": "VedaHerb Labs, Baddi, Solan, HP 173205", "is_detected": True, "confidence": 0.90, "bounding_box": {"x": 40, "y": 315, "w": 720, "h": 40}, "status": "DETECTED"},
                "consumer_care": {"field_label": "Consumer Care Information", "detected_value": "Email: helpline@vedaherb.co.in", "is_detected": True, "confidence": 0.82, "bounding_box": {"x": 40, "y": 365, "w": 720, "h": 40}, "status": "REVIEW"},
                "country_of_origin": {"field_label": "Country of Origin", "detected_value": "Made in India", "is_detected": True, "confidence": 0.95, "bounding_box": {"x": 40, "y": 415, "w": 720, "h": 40}, "status": "DETECTED"}
            }
        }
    ]

    for sc in scenarios:
        # 1. Create label image
        img_path = create_sample_label_image(sc["filename"], sc["product_name"], sc["labels"])
        image_url = f"/api/uploads/{sc['filename']}"

        # 2. Insert inspection record
        cursor.execute("""
            INSERT INTO inspections (
                id, user_id, product_name, brand, category, image_url, processed_image_url,
                compliance_score, status, risk_level, ocr_confidence, ocr_raw_text, ocr_lines_json,
                processing_time_ms, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sc["id"],
            1,
            sc["product_name"],
            sc["brand"],
            sc["category"],
            image_url,
            image_url,
            0.0,
            "PENDING",
            "LOW",
            0.94,
            " ".join([f"{l}: {v}" for l, v in sc["labels"]]),
            json.dumps([{"text": f"{l}: {v}", "confidence": 0.95, "bbox": {"x": 40, "y": 115 + i*50, "w": 720, "h": 40}} for i, (l, v) in enumerate(sc["labels"])]),
            380,
            sc["date"]
        ))
        conn.commit()

        # 3. Evaluate rules & sync db
        compliance_service_instance.run_full_audit(
            inspection_id=sc["id"],
            extracted_fields=sc["extracted"],
            overall_ocr_conf=0.94,
            processing_time_ms=380
        )

        # 4. Generate real PDF report
        try:
            report_service_instance.generate_inspection_pdf(sc["id"], user_id=1)
        except Exception as e:
            print(f"Error generating seeded report for {sc['id']}: {e}")

    conn.close()
    print("Database seeding completed successfully with 6 realistic Legal Metrology inspection scenarios and PDF reports.")

if __name__ == "__main__":
    seed_database()
