from datetime import datetime, date
from decimal import Decimal
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


# ─── School Settings Schemas ─────────────────────────────────

class SchoolSettingItem(BaseModel):
    key: str
    value: str


class SchoolSettingUpdate(BaseModel):
    value: str


# ─── Bank Account Schemas ────────────────────────────────────

class BankAccountBase(BaseModel):
    bank_name: str = Field(..., max_length=50, example="BSI")
    account_number: str = Field(..., max_length=50, example="7123456789")
    account_holder: str = Field(..., max_length=100, example="Yayasan Darrahman")
    is_active: bool = True


class BankAccountCreate(BankAccountBase):
    pass


class BankAccountUpdate(BaseModel):
    bank_name: Optional[str] = Field(None, max_length=50)
    account_number: Optional[str] = Field(None, max_length=50)
    account_holder: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class BankAccountRead(BankAccountBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── SPP Setting Schemas ─────────────────────────────────────

class SppSettingBase(BaseModel):
    academic_year: str = Field(..., max_length=10, example="2025/2026")
    monthly_nominal: Decimal = Field(..., example="350000.00")
    due_day: int = Field(default=10, ge=1, le=31, example=10)
    is_active: bool = True
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None
    notes: Optional[str] = None


class SppSettingCreate(SppSettingBase):
    pass


class SppSettingUpdate(BaseModel):
    academic_year: Optional[str] = Field(None, max_length=10)
    monthly_nominal: Optional[Decimal] = None
    due_day: Optional[int] = Field(None, ge=1, le=31)
    is_active: Optional[bool] = None
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None
    notes: Optional[str] = None


class SppSettingRead(SppSettingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
