import logging
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

# Resolve the .env file from the project root (two levels above this file:
#   backend/app/core/config.py → backend/app/core/ → backend/app/ → backend/ → project_root/)
_THIS_FILE = Path(__file__).resolve()
_PROJECT_ROOT = _THIS_FILE.parent.parent.parent.parent  # tetrathon-2026/
_ENV_FILE = _PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), extra="ignore")

    # App
    app_name: str = "TetraTHON Credit Advisor"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: Literal["development", "production", "test"] = "development"

    # Database
    database_url: str = "sqlite:///./tetrathon.db"

    # JWT (supports JWT_SECRET_KEY or SECRET_KEY)
    secret_key: str = Field(
        default="change-me-to-a-random-256-bit-secret",
        validation_alias=AliasChoices("JWT_SECRET_KEY", "SECRET_KEY")
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # CORS
    frontend_url: str = "http://localhost:5173"

    # ML model paths
    model_path: str = "./ml/models/credit_model.joblib"
    shap_explainer_path: str = "./ml/models/shap_explainer.joblib"
    scaler_path: str = "./ml/models/scaler.joblib"
    model_meta_path: str = "./ml/models/model_meta.json"

    # Reports storage
    reports_dir: str = "./reports"

    # Google OAuth
    google_client_id: str = Field(default="", validation_alias=AliasChoices("GOOGLE_CLIENT_ID", "google_client_id"))
    google_client_secret: str = Field(default="", validation_alias=AliasChoices("GOOGLE_CLIENT_SECRET", "google_client_secret"))
    google_redirect_uri: str = Field(
        default="http://localhost:8000/api/v1/auth/google/callback",
        validation_alias=AliasChoices("GOOGLE_REDIRECT_URI", "google_redirect_uri")
    )

    # LLM Provider
    anthropic_api_key: str = ""

    # Admin Provisioning
    admin_seed_secret: str = "tetrathon_admin_2026"

    # PostgreSQL / Docker Production Config
    postgres_user: str = "tetrathon"
    postgres_password: str = "tetrathon_secret"
    postgres_db: str = "tetrathon_db"
    postgres_host: str = "db"
    postgres_port: int = 5432

    def check_startup_warnings(self):
        """Logs clear startup warnings if essential OAuth/JWT settings are unconfigured."""
        if not self.google_client_id:
            logger.warning("⚠️  [CONFIG WARNING] GOOGLE_CLIENT_ID is not configured in .env!")
        if not self.google_client_secret:
            logger.warning("⚠️  [CONFIG WARNING] GOOGLE_CLIENT_SECRET is not configured in .env!")
        if not self.google_redirect_uri:
            logger.warning("⚠️  [CONFIG WARNING] GOOGLE_REDIRECT_URI is not configured in .env!")
        if not self.secret_key or "change-me" in self.secret_key:
            logger.warning("⚠️  [SECURITY WARNING] JWT_SECRET_KEY is using a default insecure value!")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    s = Settings()
    s.check_startup_warnings()
    return s


