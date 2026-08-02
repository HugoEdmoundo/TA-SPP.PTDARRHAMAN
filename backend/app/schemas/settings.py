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
    account_holder: str = Field(..., max_length=100, example="PTDARRAHMAN")
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
    academic_year: Optional[str] = Field(None, max_length=10, example="2025/2026")  # DEPRECATED — gunakan academic_year_id
    academic_year_id: Optional[int] = Field(None, description="ID tahun ajaran")
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
    academic_year_id: Optional[int] = None
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


class SppSettingLogRead(BaseModel):
    """Riwayat perubahan nominal SPP."""
    id: int
    spp_setting_id: Optional[int] = None
    old_nominal: Optional[Decimal] = None
    new_nominal: Decimal
    changed_by: Optional[int] = None
    changed_at: datetime
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ─── Academic Year Schemas ───────────────────────────────────

class AcademicYearBase(BaseModel):
    name: str = Field(..., max_length=20, example="2025/2026")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = True

class AcademicYearCreate(AcademicYearBase):
    pass

class AcademicYearUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=20)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class AcademicYearRead(AcademicYearBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── Bill Category Schemas ───────────────────────────────────

class BillCategoryBase(BaseModel):
    code: str = Field(..., max_length=30, example="seragam")
    name: str = Field(..., max_length=100, example="Seragam Sekolah")
    description: Optional[str] = None
    default_amount: Optional[Decimal] = None
    is_active: bool = True

class BillCategoryCreate(BillCategoryBase):
    pass

class BillCategoryUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=30)
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    default_amount: Optional[Decimal] = None
    is_active: Optional[bool] = None

class BillCategoryRead(BillCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

