import urllib.request
import json
import urllib.parse

def test_endpoints():
    base = "http://127.0.0.1:8000"

    print("1. Testing Health...")
    with urllib.request.urlopen(f"{base}/api/health") as r:
        print("Health response:", json.loads(r.read().decode()))

    print("\n2. Testing Login...")
    login_data = json.dumps({"email": "inspector@packaudit.gov.in", "password": "audit2026!"}).encode()
    req = urllib.request.Request(f"{base}/api/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    token = None
    with urllib.request.urlopen(req) as r:
        res = json.loads(r.read().decode())
        print("Login success:", res["user"]["full_name"], "Role:", res["user"]["role"])
        token = res["access_token"]

    auth_headers = {"Authorization": f"Bearer {token}"}

    print("\n3. Testing Dashboard Stats...")
    req = urllib.request.Request(f"{base}/api/dashboard/stats", headers=auth_headers)
    with urllib.request.urlopen(req) as r:
        stats = json.loads(r.read().decode())
        print(f"Total Inspections: {stats['total_inspections']}, Compliance Rate: {stats['compliance_rate']}%, Violations: {stats['violations_detected_count']}")

    print("\n4. Testing Inspections List...")
    req = urllib.request.Request(f"{base}/api/inspections", headers=auth_headers)
    with urllib.request.urlopen(req) as r:
        insps = json.loads(r.read().decode())
        print(f"Fetched {len(insps)} inspections. First inspection: {insps[0]['id']} ({insps[0]['product_name']}) - Score: {insps[0]['compliance_score']}")

    print("\n5. Testing Rules API...")
    req = urllib.request.Request(f"{base}/api/rules", headers=auth_headers)
    with urllib.request.urlopen(req) as r:
        rules = json.loads(r.read().decode())
        print(f"Loaded {len(rules['rules'])} Legal Metrology rules codified under {rules['title']}")

    print("\n6. Testing Reports Archive...")
    req = urllib.request.Request(f"{base}/api/reports", headers=auth_headers)
    with urllib.request.urlopen(req) as r:
        reports = json.loads(r.read().decode())
        print(f"Found {len(reports)} generated PDF dossiers in archive.")

    print("\n7. Testing Compliance Analytics...")
    req = urllib.request.Request(f"{base}/api/analytics", headers=auth_headers)
    with urllib.request.urlopen(req) as r:
        analytics = json.loads(r.read().decode())
        print(f"Analytics: Total {analytics['total_inspections']}, Status share: {analytics['compliance_distribution']}")

    print("\nALL API ENDPOINTS TESTED AND FUNCTIONING PERFECTLY!")

if __name__ == "__main__":
    test_endpoints()
