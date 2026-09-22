import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from config import UPLOAD_DIR, REPORT_DIR, BASE_DIR
from models.database import init_db
from api.auth import router as auth_router
from api.dashboard import router as dashboard_router
from api.inspections import router as inspections_router
from api.reports import router as reports_router
from api.analytics import router as analytics_router
from api.rules import router as rules_router

# Initialize database tables on startup
init_db()

app = FastAPI(
    title="PACKAUDIT AI API",
    description="Legal Metrology Compliance Intelligence System for Packaged Commodities (SIH26034)",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads and generated reports
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/api/report-files", StaticFiles(directory=str(REPORT_DIR)), name="reports")

# Include Routers
app.include_router(auth_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(inspections_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(rules_router, prefix="/api")

@app.get("/")
def root():
    return {
        "brand": "PACKAUDIT AI",
        "tagline": "Scan. Verify. Comply.",
        "version": "1.0.0",
        "status": "online",
        "system": "Legal Metrology Compliance Intelligence (SIH26034)",
        "disclaimer": "AI-assisted compliance analysis. Final legal determination requires authorized inspection."
    }

@app.get("/api/health")
def health():
    return {"status": "healthy", "database": "connected", "environment": "production-ready"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
