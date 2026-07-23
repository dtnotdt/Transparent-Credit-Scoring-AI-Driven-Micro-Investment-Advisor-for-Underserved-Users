"""
core/database.py  —  SQLAlchemy async engine setup.
Supports both SQLite (dev) and PostgreSQL (prod) via DATABASE_URL.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# SQLite needs check_same_thread=False
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables on startup (idempotent) and apply lightweight migrations."""
    from app.models import User, CreditAssessment, RiskAssessment, FinancialTwin, LoginHistory, ActivityLog, ReportHistory, InvestmentPlan
    from sqlalchemy import inspect, text
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("users")]
        if "role" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'USER'"))
        if "auth_provider" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'local'"))
        if "preferred_language" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en'"))
                
    # Feature 3: Admin Account Bootstrap
    with SessionLocal() as db:
        admin_email = "admin@tetrascore.ai"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            from app.core.security import hash_password
            admin_user = User(
                email=admin_email,
                username="admin",
                hashed_password=hash_password("Admin@123"),
                role="ADMIN",
                auth_provider="local",
                preferred_language="en",
            )
            db.add(admin_user)
            db.commit()

