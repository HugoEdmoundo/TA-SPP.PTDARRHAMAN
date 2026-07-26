from typing import Optional
from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: str
    user_id: int


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    username: str = Field(..., example="admin")
    password: str = Field(..., example="secret123")


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(...)
