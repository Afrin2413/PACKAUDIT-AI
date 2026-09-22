from datetime import datetime
import json
import sqlite3
from typing import Optional, List, Dict, Any
from pathlib import Path
from config import BASE_DIR

DB_PATH = BASE_DIR / "packaudit.db"

def get_db_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Inspector',
        badge_number TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Inspections table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inspections (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        product_name TEXT NOT NULL,
        brand TEXT,
        category TEXT DEFAULT 'General Packaged Commodity',
        image_url TEXT NOT NULL,
        processed_image_url TEXT,
        compliance_score REAL NOT NULL DEFAULT 0.0,
        status TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        ocr_confidence REAL NOT NULL DEFAULT 0.0,
        ocr_raw_text TEXT,
        ocr_lines_json TEXT,
        processing_time_ms INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    )
    """)

    # Extracted fields table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS extracted_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inspection_id TEXT NOT NULL,
        field_key TEXT NOT NULL,
        field_label TEXT NOT NULL,
        detected_value TEXT,
        is_detected BOOLEAN NOT NULL DEFAULT 0,
        confidence REAL DEFAULT 0.0,
        bounding_box_json TEXT,
        status TEXT NOT NULL,
        FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE CASCADE
    )
    """)

    # Compliance checks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS compliance_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inspection_id TEXT NOT NULL,
        rule_id TEXT NOT NULL,
        rule_code TEXT NOT NULL,
        rule_name TEXT NOT NULL,
        category TEXT NOT NULL,
        required BOOLEAN NOT NULL DEFAULT 1,
        status TEXT NOT NULL,
        score_contribution REAL NOT NULL DEFAULT 0.0,
        reason TEXT NOT NULL,
        citation TEXT NOT NULL,
        FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE CASCADE
    )
    """)

    # Violations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS violations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inspection_id TEXT NOT NULL,
        rule_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT NOT NULL,
        evidence_text TEXT,
        evidence_bbox_json TEXT,
        recommendation TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE CASCADE
    )
    """)

    # Reports table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        inspection_id TEXT NOT NULL,
        user_id INTEGER,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size_bytes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    )
    """)

    # Rule configuration / versions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rule_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL,
        rules_json TEXT NOT NULL,
        updated_by TEXT DEFAULT 'System Admin',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()
