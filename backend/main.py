
from pathlib import Path

import sqlite3
import duckdb
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import hmac
import os
from fastapi import Header


app = FastAPI(
    title="Local AI Cultural Analytics Dashboard",
    version="0.1.0",
)

def verify_local_secret(
    x_local_secret: str | None = Header(default=None),
):
    expected_secret = os.environ.get("LOCAL_APP_SECRET")

    if not expected_secret:
        raise HTTPException(
            status_code=503,
            detail="Local security secret is not configured.",
        )

    if x_local_secret is None or not hmac.compare_digest(
        x_local_secret,
        expected_secret,
    ):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid local security secret.",
        )

# this is CORS Configuration to allow request from the frontend running on localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:1420",
    "http://127.0.0.1:1420"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type"],
)



PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "cultural_analytics.duckdb"
SQLITE_DB_PATH = DATA_DIR / "app_state.sqlite3"


class CulturalRecord(BaseModel):
    id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    region: str = Field(min_length=1, max_length=100)


def initialize_sqlite_database():
    with sqlite3.connect(SQLITE_DB_PATH) as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)

        connection.execute("""
            INSERT OR IGNORE INTO app_settings (key, value)
            VALUES ('theme', 'light')
        """)

        connection.execute("""
            INSERT OR IGNORE INTO app_settings (key, value)
            VALUES ('language', 'en')
        """)


def initialize_database():
    with duckdb.connect(str(DB_PATH)) as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS cultural_records (
                id INTEGER PRIMARY KEY,
                name VARCHAR NOT NULL,
                category VARCHAR NOT NULL,
                region VARCHAR NOT NULL
            )
        """)

        count = connection.execute(
            "SELECT COUNT(*) FROM cultural_records"
        ).fetchone()[0]

        if count == 0:
            connection.executemany(
                """
                INSERT INTO cultural_records
                    (id, name, category, region)
                VALUES (?, ?, ?, ?)
                """,
                [
                    (1, "Traditional Pottery", "Craft", "Rajasthan"),
                    (2, "Classical Music", "Music", "Uttar Pradesh"),
                    (3, "Folk Dance", "Dance", "Gujarat"),
                ],
            )


@app.on_event("startup")
def startup():
    initialize_database()
    initialize_sqlite_database()    


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/cultural-records",dependencies=[Depends(verify_local_secret)],)
def get_cultural_records():
    with duckdb.connect(str(DB_PATH), read_only=True) as connection:
        rows = connection.execute("""
            SELECT id, name, category, region
            FROM cultural_records
            ORDER BY id
        """).fetchall()

    return [
        {
            "id": row[0],
            "name": row[1],
            "category": row[2],
            "region": row[3],
        }
        for row in rows
    ]


@app.post("/api/cultural-records", 
          status_code=201,dependencies=[Depends(verify_local_secret)],)
def create_cultural_record(record: CulturalRecord):
    try:
        with duckdb.connect(str(DB_PATH)) as connection:
            connection.execute(
                """
                INSERT INTO cultural_records
                    (id, name, category, region)
                VALUES (?, ?, ?, ?)
                """,
                [record.id, record.name, record.category, record.region],
            )
    except duckdb.ConstraintException:
        raise HTTPException(
            status_code=409,
            detail="A cultural record with this ID already exists.",
        )

    return {
        "message": "Cultural record created successfully",
        "record": record.model_dump(),
    }



@app.get("/api/settings",
         dependencies=[Depends(verify_local_secret)],)
def get_settings():
    with sqlite3.connect(SQLITE_DB_PATH) as connection:
        rows = connection.execute(
            "SELECT key, value FROM app_settings ORDER BY key"
        ).fetchall()

    return {key: value for key, value in rows}


@app.put("/api/settings/{key}",
         dependencies=[Depends(verify_local_secret)],)
def update_setting(key: str, value: str):
    allowed_keys = {"theme", "language"}

    if key not in allowed_keys:
        raise HTTPException(
            status_code=400,
            detail="Unsupported setting key.",
        )

    if not value.strip():
        raise HTTPException(
            status_code=400,
            detail="Setting value cannot be empty.",
        )

    with sqlite3.connect(SQLITE_DB_PATH) as connection:
        connection.execute(
            """
            INSERT INTO app_settings (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (key, value),
        )

    return {
        "message": "Setting updated successfully",
        "key": key,
        "value": value,
    }
