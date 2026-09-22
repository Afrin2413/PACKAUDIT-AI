# PACKAUDIT AI
> **"Scan. Verify. Comply."**  
> *AI-Powered Legal Metrology Compliance for Packaged Commodities*

[![SIH Problem Statement: SIH26034](https://img.shields.io/badge/SIH-SIH26034-047857.svg)](https://smartindiahackathon.gov.in)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.110-0284c7.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript-10b981.svg)](https://react.dev)
[![Compliance Standard](https://img.shields.io/badge/Statute-PCR%202011%20Rule%206-f59e0b.svg)](https://consumeraffairs.nic.in)

---

## 1. Problem Statement (SIH26034)
Under the **Legal Metrology (Packaged Commodities) Rules, 2011 (PCR 2011)** enacted by the Department of Consumer Affairs, Government of India, every packaged commodity manufactured, packed, or imported in India must strictly bear mandatory declarations on the principal display panel.

Manual inspection of thousands of FMCG SKUs by enforcement officers and brand QA auditors is labor-intensive, error-prone, and slow. 

**PACKAUDIT AI** solves this with an enterprise-grade, full-stack intelligence platform that combines **OpenCV image preprocessing**, **optical character recognition (OCR)**, **Rule 6 statutory regex extraction**, a **versionable Legal Metrology Rule Engine**, an **interactive Evidence Viewer with bounding box overlays**, and automated **PDF Inspection Dossier generation**.

---

## 2. Key Capabilities & Workflow

```
[ Package Image Upload / Camera Scan ]
                ↓
[ OpenCV Preprocessing Pipeline ]
  • Aspect-aware scaling
  • Grayscale conversion & CLAHE contrast boost
  • Bilateral edge-preserving denoising
  • Adaptive Gaussian character segmentation
                ↓
[ Optical Character Recognition (OCR) ]
  • Extraction of text lines & bounding box coordinates [x, y, w, h]
  • Confidence score calculation per text region
                ↓
[ Statutory Field Extraction (Rule 6) ]
  • Manufacturer / Packer / Importer name & address
  • Generic commodity name
  • Net Quantity in standard Schedule II metric units (g, kg, ml, l, N)
  • Maximum Retail Price (MRP inclusive of all taxes)
  • Month & Year of packing/manufacture (MFD / PKD MM/YYYY)
  • Consumer Care helpline, email & nodal grievance address
  • Country of Origin declaration
                ↓
[ Legal Metrology Rule Engine ]
  • Weighted scoring algorithm
  • Unit standard compliance validation (flags illegal units like 'gms', 'ltrs', 'fl oz')
  • Mandatory vs. optional rule checks
  • Transparent mathematical scoring: Score = (Passed / Total Weights) * 100
                ↓
[ Interactive Evidence Viewer & PDF Dossier ]
  • Pan & Zoom original and preprocessed label images
  • Color-coded bounding box overlays (Green: Detected, Amber: Review, Red: Violation)
  • Downloadable, print-ready official PDF inspection certificate
```

---

## 3. Technology Stack

| Tier | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas/SVG |
| **Backend** | Python 3.11, FastAPI, Uvicorn, Pydantic v2, SQLite3, SQLAlchemy ORM |
| **Vision & OCR** | OpenCV (`opencv-python-headless`), Pillow, PyTesseract / Contour Vision OCR |
| **Document Generation** | ReportLab (PDF Certificates & Statutory Dossiers) |
| **Security & Auth** | Salted SHA-256 password hashing, PyJWT tokens, CORS, Protected Routes |

---

## 4. Directory Structure

```
PackAudit AI/
├── backend/
│   ├── api/
│   │   ├── auth.py              # JWT authentication & session routes
│   │   ├── dashboard.py         # Aggregated KPI stats & real-time trends
│   │   ├── inspections.py       # Create, list, inspect, and get evidence
│   │   ├── reports.py           # Generate, list, preview & download PDFs
│   │   ├── analytics.py         # Compliance distributions & rule matrices
│   │   └── rules.py             # Configurable Legal Metrology rule engine
│   ├── models/
│   │   ├── database.py          # SQLite schema & table initialization
│   │   └── schemas.py           # Pydantic validation schemas
│   ├── services/
│   │   ├── image_service.py     # OpenCV CLAHE, denoising & thresholding
│   │   ├── ocr_service.py       # OCR pipeline & bounding box mapper
│   │   ├── extraction_service.py# Rule 6 statutory field parser
│   │   ├── compliance_service.py# Rule evaluator & DB persistence
│   │   └── report_service.py    # ReportLab official PDF generator
│   ├── rules/
│   │   ├── rules.json           # Codified Legal Metrology (PCR 2011) rules
│   │   └── rule_engine.py       # Rule loader, evaluator & weight calculator
│   ├── utils/
│   │   └── security.py          # Salted password hashing & JWT token tools
│   ├── uploads/                 # Storage for scanned package label images
│   ├── reports/                 # Storage for generated official PDF files
│   ├── config.py                # Environment paths and configuration
│   ├── seed.py                  # Database seeder with realistic test scenarios
│   ├── requirements.txt         # Python backend dependencies
│   └── main.py                  # FastAPI application entry point
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, Sidebar, EvidenceViewer, ScoreGauge, etc.
│   │   ├── pages/               # Dashboard, Inspect, Result, History, Analytics, Rules, Reports
│   │   ├── context/             # AuthContext (login, demo mode, logout)
│   │   ├── services/            # apiClient.ts (centralized fetch client)
│   │   ├── types/               # TypeScript data models
│   │   ├── App.tsx              # Application layout & routing
│   │   └── index.css            # Dark graphite enterprise design tokens
│   ├── tailwind.config.js       # Custom slate, emerald, amber, crimson palette
│   └── package.json
└── README.md
```

---

## 5. Getting Started & Local Setup

### Prerequisites
- **Python 3.10+** (Tested on Python 3.11)
- **Node.js 18+ / 20+** and **npm**

---

### Step 1: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Seed the database with demo inspector and sample scenarios
python seed.py

# Start the FastAPI backend server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will run at `http://127.0.0.1:8000`.  
Swagger API Docs available at `http://127.0.0.1:8000/docs`.

---

### Step 2: Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start the Vite development server
npm run dev
```
The application will be live at `http://localhost:5173`.

---

## 6. Demo Credentials & Pre-configured Scenarios

### Authentication
- **Role**: Senior Legal Metrology Inspector
- **Email**: `inspector@packaudit.gov.in`
- **Password**: `audit2026!`
- **One-Click Access**: Click **"Use Demo Inspector"** on the login page for instant authentication.

### Bundled Test Scenarios
On the **Inspect** page (`/inspect`), you can test 3 ready-to-audit scenarios with a single click:
1. **Scenario A (Compliant FMCG Biscuits)**: 100% mandatory declarations present in valid metric units (`250 g`, `Rs. 60.00 incl of all taxes`, `PKD: 02/2026`, `Helpline: 1800-209-4455`, `NutriBake Foods Pvt Ltd`). Status: **COMPLIANT** (Score: 100/100).
2. **Scenario B (Review Needed - Spices)**: Missing consumer care redressal helpline and email under Rule 6(1)(g). Status: **REVIEW REQUIRED / NON-COMPLIANT** (Score: 78/100).
3. **Scenario C (Non-Compliant - Imported Beverage)**: Missing importer address, non-metric unit (`12 FL OZ`), ambiguous dual pricing (`$3.99 / ₹350`), missing packing date. Status: **NON-COMPLIANT** (Score: 42/100).

---

## 7. Legal Notice & Disclaimer

> **STATUTORY NOTICE**: PackAudit AI is an automated, AI-assisted computer vision and natural language screening system built for the Legal Metrology (Packaged Commodities) Rules, 2011. This platform is designed to accelerate audit throughput for enforcement officers and quality teams. Final statutory determination and legal certification require physical inspection by an authorized Legal Metrology Officer.
