from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class EventCreate(BaseModel):
    name: str = Field(..., max_length=100, example="Patungan Study Tour Jogja")
    description: Optional[str] = Field(None, example="Kegiatan study tour kelas 11 ke Yogyakarta selama 3 hari")
    per_student_amount: Decimal = Field(..., gt=0, example=1500000)
    student_ids: List[int] = Field(..., min_length=1, description="Daftar ID siswa peserta kegiatan")
    deadline: Optional[date] = None
    allow_installment: bool = True
    min_installment_amount: Optional[Decimal] = Field(None, example=300000)


class EventUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    deadline: Optional[date] = None
    allow_installment: Optional[bool] = None
    min_installment_amount: Optional[Decimal] = None
    status: Optional[str] = Field(None, description="'draft', 'active', atau 'completed'")


class EventRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    per_student_amount: Decimal
    total_target: Decimal
    deadline: Optional[date] = None
    allow_installment: bool
    min_installment_amount: Optional[Decimal] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── Tracking & History Schemas (B-15, B-16) ─────────────────

class StudentTrackingItem(BaseModel):
    student_id: int
    name: str
    nis: str
    target: Decimal
    paid: Decimal
    remaining: Decimal
    installment_count: int
    status: str


class EventTrackingResponse(BaseModel):
    event: EventRead
    total_target: Decimal
    total_collected: Decimal
    progress_pct: float
    students: List[StudentTrackingItem]


class InstallmentSummary(BaseModel):
    payment_id: int
    date: datetime
    amount: Decimal
    method: str


class StudentHistoryItem(BaseModel):
    student_id: int
    name: str
    nis: str
    total_paid: Decimal
    total_installments: int
    installments: List[InstallmentSummary]


class EventHistoryResponse(BaseModel):
    event: EventRead
    students: List[StudentHistoryItem]
