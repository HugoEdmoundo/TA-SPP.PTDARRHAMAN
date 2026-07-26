from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class PaymentItemRequest(BaseModel):
    type: str = Field(..., description="'spp', 'non_spp', atau 'event'")
    month: Optional[int] = Field(None, ge=1, le=12, description="Bulan SPP (1-12), wajib jika type='spp'")
    year: Optional[int] = Field(None, description="Tahun SPP, wajib jika type='spp'")
    bill_id: Optional[int] = Field(None, description="ID tagihan, wajib jika type='non_spp' atau 'event'")
    amount: Decimal = Field(..., gt=0, description="Nominal yang dibayarkan untuk item ini")


class GatewayCreateRequest(BaseModel):
    student_id: int
    items: List[PaymentItemRequest] = Field(..., min_length=1)
    infaq_amount: Decimal = Field(default=Decimal("0"), ge=0)
    gateway_name: str = Field(default="midtrans", max_length=50, description="'midtrans', 'xendit', atau 'simulator'")


class GatewayCreateResponse(BaseModel):
    transaction_id: str
    redirect_url: str
    total_amount: Decimal
    infaq_amount: Decimal
    status: str


class GatewayCallbackRequest(BaseModel):
    transaction_id: str
    status_code: str
    signature_key: Optional[str] = None
    gross_amount: Optional[str] = None
    transaction_status: Optional[str] = Field(None, description="'settlement', 'capture', 'success', 'pending', 'deny', 'expire', 'cancel'")


class ManualPaymentRequest(BaseModel):
    student_id: int
    items: List[PaymentItemRequest] = Field(..., min_length=1)
    infaq_amount: Decimal = Field(default=Decimal("0"), ge=0)
    payment_method: str = Field(default="cash", description="'cash' atau 'transfer'")
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None


class ReceiptRead(BaseModel):
    id: int
    payment_id: int
    receipt_number: str
    pdf_url: Optional[str] = None
    is_void: bool
    void_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentRead(BaseModel):
    id: int
    student_id: int
    bill_id: Optional[int] = None
    payment_type: str
    spp_month: Optional[int] = None
    spp_year: Optional[int] = None
    amount: Decimal
    infaq_amount: Decimal
    total_amount: Decimal
    method: str
    channel: str
    gateway_transaction_id: Optional[str] = None
    notes: Optional[str] = None
    status: str = "paid"
    created_at: datetime
    receipt: Optional[ReceiptRead] = None

    model_config = ConfigDict(from_attributes=True)


class InfaqSummaryRead(BaseModel):
    total_collected_all_time: Decimal
    total_collected_this_month: Decimal
    transactions_count: int
    recent_transactions: List[PaymentRead]
