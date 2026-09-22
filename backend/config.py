import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
REPORT_DIR = BASE_DIR / "reports"
TEST_SAMPLES_DIR = BASE_DIR / "test_samples"
RULES_FILE = BASE_DIR / "rules" / "rules.json"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'packaudit.db'}")

# Security
JWT_SECRET = os.getenv("JWT_SECRET", "packaudit_enterprise_secret_key_sih2026_metrology_998811")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60 * 24 * 7  # 7 days

# Ensure runtime directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)
TEST_SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
(BASE_DIR / "rules").mkdir(parents=True, exist_ok=True)
