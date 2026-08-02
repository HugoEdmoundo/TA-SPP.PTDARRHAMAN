from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ParentRead(BaseModel):
    id: int
    username: str
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class StudentBase(BaseModel):
    nis: str = Field(..., max_length=20, example="2025001")
    full_name: str = Field(..., max_length=100, example="Budi Santoso")
    grade: Optional[str] = Field(None, max_length=20, example="VII-A")
    gender: Optional[str] = Field(None, max_length=10, example="Laki-laki")
    birth_place: Optional[str] = Field(None, max_length=100, example="Jakarta")
    birth_date: Optional[date] = None
    address: Optional[str] = Field(None, example="Jl. Merdeka No. 10")
    phone: Optional[str] = Field(None, max_length=20, example="08123456789")
    academic_year: Optional[str] = Field(None, max_length=10, example="2025/2026")
    academic_year_id: Optional[int] = None
    photo_url: Optional[str] = None
    is_active: bool = True
    status: Optional[str] = "active"


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    nis: Optional[str] = Field(None, max_length=20)
    full_name: Optional[str] = Field(None, max_length=100)
    grade: Optional[str] = Field(None, max_length=20)
    gender: Optional[str] = Field(None, max_length=10)
    birth_place: Optional[str] = Field(None, max_length=100)
    birth_date: Optional[date] = None
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    academic_year: Optional[str] = Field(None, max_length=10)
    academic_year_id: Optional[int] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None
    status: Optional[str] = None



class StudentRead(StudentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    parents: List[ParentRead] = []

    model_config = ConfigDict(from_attributes=True)


# ─── Import Schemas ──────────────────────────────────────────

class StudentImportRow(BaseModel):
    row_index: int
    nis: str
    full_name: str
    grade: Optional[str] = None
    gender: Optional[str] = None
    birth_place: Optional[str] = None
    birth_date: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    academic_year: Optional[str] = None
    status: Optional[str] = None
    is_valid: bool
    errors: List[str] = []



class StudentImportPreviewResponse(BaseModel):
    total_rows: int
    valid_rows: int
    error_rows: int
    data: List[StudentImportRow]


class StudentImportConfirmRequest(BaseModel):
    data: List[StudentCreate]


# ─── Parent Linking Schemas ──────────────────────────────────

class ParentLinkRequest(BaseModel):
    parent_id: int
