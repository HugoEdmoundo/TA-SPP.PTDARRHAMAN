from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator

from app.models import Role


class UserBase(BaseModel):
    username: str = Field(..., max_length=50, example="wali_ahmad")
    email: Optional[str] = Field(None, max_length=100, example="ahmad@gmail.com")
    full_name: str = Field(..., max_length=100, example="Ahmad Fauzi")
    phone: Optional[str] = Field(None, max_length=20, example="08123456789")
    role: str = Field(default="admin", example="admin")  # admin / superadmin / wali
    is_active: bool = True

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        try:
            return Role(v.lower()).value
        except ValueError:
            raise ValueError(f"Role tidak valid. Pilihan: {[r.value for r in Role]}.")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, example="rahasia123")


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    role: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v is None:
            return v
        try:
            return Role(v.lower()).value
        except ValueError:
            raise ValueError(f"Role tidak valid. Pilihan: {[r.value for r in Role]}.")


class UserResetPassword(BaseModel):
    new_password: str = Field(..., min_length=6, example="passwordbaru123")


class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
