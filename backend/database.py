import os
from typing import Generator
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./codenest.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema_columns() -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    if "courses" in table_names:
        existing_columns = {
            col["name"] for col in inspector.get_columns("courses")
        }
        if "video_url" not in existing_columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE courses ADD COLUMN video_url VARCHAR"))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
