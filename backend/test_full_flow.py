import urllib.request
import json
import os
from pathlib import Path

def test_full_inspection_lifecycle():
    base = "http://127.0.0.1:8000"
    upload_sample = Path(__file__).parent / "uploads" / "sample_a_compliant_biscuits.png"

    # 1. Login
    login_data = json.dumps({"email": "inspector@packaudit.gov.in", "password": "audit2026!"}).encode()
    req = urllib.request.Request(f"{base}/api/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        token = json.loads(r.read().decode())["access_token"]

    # 2. Upload and Analyze new inspection using multipart
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    with open(upload_sample, "rb") as f:
        file_bytes = f.read()

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="live_audit_test.png"\r\n'
        f"Content-Type: image/png\r\n\r\n"
    ).encode('utf-8') + file_bytes + (
        f"\r\n--{boundary}\r\n"
        f'Content-Disposition: form-data; name="product_name"\r\n\r\n'
        f"NutriBake Almond Crunch Biscuits\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="brand"\r\n\r\n'
        f"NutriBake India Ltd\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="category"\r\n\r\n'
        f"Packaged Food & Confectionery\r\n"
        f"--{boundary}--\r\n"
    ).encode('utf-8')

    req = urllib.request.Request(
        f"{base}/api/inspections",
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}"
        }
    )

    print("Submitting live package inspection to /api/inspections...")
    with urllib.request.urlopen(req) as r:
        inspection = json.loads(r.read().decode())
        print(f"Inspection created successfully: {inspection['id']}")
        print(f"Score: {inspection['compliance_score']} / 100")
        print(f"Status: {inspection['status']}")
        print(f"Processing time: {inspection['processing_time_ms']} ms")
        print(f"Extracted {len(inspection['extracted_fields'])} declarations.")
        print(f"Rule checks: {len(inspection['compliance_checks'])}")
        insp_id = inspection['id']

    # 3. Generate PDF Report
    print(f"\nGenerating official PDF report for {insp_id}...")
    req = urllib.request.Request(
        f"{base}/api/inspections/{insp_id}/report",
        data=b"{}",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as r:
        report_res = json.loads(r.read().decode())
        print(f"Report Generated: {report_res['report_id']} ({report_res['file_size_bytes']} bytes)")

    # 4. Verify PDF Download
    download_url = f"{base}{report_res['download_url']}"
    print(f"Verifying PDF download from {download_url}...")
    with urllib.request.urlopen(download_url) as r:
        pdf_content = r.read()
        print(f"Downloaded PDF size: {len(pdf_content)} bytes (Starts with: {pdf_content[:4].decode('latin-1')})")
        assert pdf_content.startswith(b"%PDF"), "Downloaded file is not a valid PDF!"

    print("\nLIFECYCLE VERIFICATION 100% SUCCESSFUL!")

if __name__ == "__main__":
    test_full_inspection_lifecycle()
