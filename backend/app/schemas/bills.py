from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class StudentSimpleRead(BaseModel):
    id: int
    nis: str
    full_name: str

    model_config = ConfigDict(from_attributes=True)


class NonSppBillCreate(BaseModel):
    student_ids: List[int] = Field(..., min_length=1, description="Daftar ID siswa yang akan dibuatkan tagihan ini")
    category: str = Field(..., max_length=50, example="Seragam")
    label: str = Field(..., max_length=100, example="Seragam Batik & Olahraga Kelas 10")
    description: Optional[str] = Field(None, example="Pembayaran seragam untuk tahun ajaran baru")
    amount: Decimal = Field(..., gt=0, example=750000)
    due_date: Optional[date] = None
    attachment_url: Optional[str] = None


class BillUpdate(BaseModel):
    category: Optional[str] = Field(None, max_length=50)
    label: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    due_date: Optional[date] = None
    attachment_url: Optional[str] = None


class BillRead(BaseModel):
    id: int
    student_id: int
    event_id: Optional[int] = None
    bill_type: str
    category: Optional[str] = None
    label: str
    description: Optional[str] = None
    amount: Decimal
    remaining_amount: Decimal
    due_date: Optional[date] = None
    attachment_url: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    student: Optional[StudentSimpleRead] = None

    model_config = ConfigDict(from_attributes=True)
