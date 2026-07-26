from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, EmailStr


class UserBase(BaseModel):
    username: str = Field(..., max_length=50, example="wali_ahmad")
    email: Optional[str] = Field(None, max_length=100, example="ahmad@gmail.com")
    full_name: str = Field(..., max_length=100, example="Ahmad Fauzi")
    phone: Optional[str] = Field(None, max_length=20, example="08123456789")
    role: str = Field(default="wali", example="wali")  # "admin" atau "wali"
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, example="rahasia123")


class UserUpdate(BaseModel):
    email: Optional[str] = Field(None, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    role: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None


class UserResetPassword(BaseModel):
    new_password: str = Field(..., min_length=6, example="passwordbaru123")


class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
