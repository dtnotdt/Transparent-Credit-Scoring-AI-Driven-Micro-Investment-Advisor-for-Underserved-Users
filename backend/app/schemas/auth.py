"""
schemas/auth.py  —  Authentication request/response schemas.
"""
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=100)
    role: str = Field(default="USER")
    admin_secret: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    email: str
    role: str = "USER"
    auth_provider: str = "local"
    preferred_language: str = "en"


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool
    role: str = "USER"
    auth_provider: str = "local"
    preferred_language: str = "en"

    model_config = {"from_attributes": True}


class LanguagePreferenceRequest(BaseModel):
    language: str = Field(pattern="^(en|hi|gu)$")

