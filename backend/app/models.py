"""
TA SPP Payment System - Database Models (B-03 Rewrite + Production-Grade Upgrade)

Berdasarkan spesifikasi final:
  1. SPP        → Tagihan rutin bulanan bersifat VIRTUAL (tidak disimpan di tabel bills).
  2. Non-SPP    → Tagihan ad-hoc (denda, seragam, buku, dll) disimpan di tabel bills.
  3. Event      → Patungan besar disimpan di tabel events & bills.

Upgrade Production-Grade:
  - AcademicYear master table (anti-typo, tutup buku)
  - BillCategory master table (jenis tagihan dinamis)
  - StudentStatus enum (menggantikan is_active boolean)
  - PaymentStatus enum (tracking status pembayaran gateway)
"""

from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String


# ─── Enums ───────────────────────────────────────────────────

class Role(str, Enum):
    """Role pengguna sistem — selalu disimpan lowercase di DB."""
    superadmin = "superadmin"
    admin = "admin"
    wali = "wali"


class BillType(str, Enum):
    spp = "spp"          # Digunakan untuk referensi virtual atau tipe
    non_spp = "non_spp"
    event = "event"


class BillStatus(str, Enum):
    unpaid = "unpaid"
    partial = "partial"
    paid = "paid"


class PaymentType(str, Enum):
    spp = "spp"
    non_spp = "non_spp"
    event = "event"


class PaymentMethod(str, Enum):
    cash = "cash"
    transfer = "transfer"


class PaymentChannel(str, Enum):
    gateway = "gateway"
    manual = "manual"


class EventStatus(str, Enum):
    draft = "draft"
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class StudentStatus(str, Enum):
    """Status keaktifan siswa — menggantikan boolean is_active."""
    active = "active"             # Aktif bersekolah
    graduated = "graduated"       # Lulus
    transferred = "transferred"   # Pindah sekolah
    dropout = "dropout"           # Drop out
    inactive = "inactive"         # Nonaktif sementara


class PaymentStatus(str, Enum):
    """Status pembayaran — untuk integrasi payment gateway."""
    pending = "pending"           # Menunggu konfirmasi gateway
    paid = "paid"                 # Berhasil dikonfirmasi
    failed = "failed"             # Gagal
    expired = "expired"           # Expired di gateway
    cancelled = "cancelled"       # Dibatalkan user
    refunded = "refunded"         # Dana dikembalikan (void)


# ─── Parent-Student Link Table ───────────────────────────────

class ParentStudent(SQLModel, table=True):
    __tablename__ = "parent_student"

    id: Optional[int] = Field(default=None, primary_key=True)
    parent_id: int = Field(foreign_key="users.id", index=True)
    student_id: int = Field(foreign_key="students.id", index=True)


# ─── Master Tables ───────────────────────────────────────────

class AcademicYear(SQLModel, table=True):
    """Master tahun ajaran — anti-typo, tutup buku otomatis."""
    __tablename__ = "academic_years"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=20)   # "2025/2026"
    start_date: Optional[date] = Field(default=None)             # 2025-07-01
    end_date: Optional[date] = Field(default=None)               # 2026-06-30
    is_active: bool = Field(default=True)                        # False = tutup buku
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BillCategory(SQLModel, table=True):
    """Master kategori tagihan — admin bisa tambah jenis tagihan baru tanpa programmer."""
    __tablename__ = "bill_categories"

    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True, max_length=30)    # "spp", "seragam", "ujian_praktek"
    name: str = Field(max_length=100)                            # "SPP Bulanan", "Seragam Sekolah"
    description: Optional[str] = Field(default=None)
    default_amount: Optional[Decimal] = Field(default=None, max_digits=12, decimal_places=2)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Users ───────────────────────────────────────────────────

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, max_length=50)
    email: Optional[str] = Field(default=None, max_length=100)
    hashed_password: str
    full_name: str = Field(max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    role: Role = Field(default=Role.admin, max_length=20, sa_column=Column(String(20), nullable=False))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    students: List["Student"] = Relationship(
        back_populates="parents", link_model=ParentStudent
    )


# ─── Students ────────────────────────────────────────────────

class Student(SQLModel, table=True):
    __tablename__ = "students"

    id: Optional[int] = Field(default=None, primary_key=True)
    nis: str = Field(unique=True, index=True, max_length=20)
    full_name: str = Field(max_length=100)
    grade: Optional[str] = Field(default=None, max_length=20)  # Kelas, e.g. "VII-A"
    gender: Optional[str] = Field(default=None, max_length=10)
    birth_place: Optional[str] = Field(default=None, max_length=100)
    birth_date: Optional[date] = Field(default=None)
    address: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None, max_length=20)
    academic_year: Optional[str] = Field(default=None, max_length=10)  # DEPRECATED — gunakan academic_year_id
    academic_year_id: Optional[int] = Field(default=None, foreign_key="academic_years.id", index=True)
    photo_url: Optional[str] = Field(default=None)
    status: StudentStatus = Field(default=StudentStatus.active, index=True)
    is_active: bool = Field(default=True)  # DEPRECATED — computed dari status, tetap ada untuk backward compat
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    parents: List[User] = Relationship(
        back_populates="students", link_model=ParentStudent
    )
    bills: List["Bill"] = Relationship(back_populates="student")
    payments: List["Payment"] = Relationship(back_populates="student")


# ─── SPP Settings ────────────────────────────────────────────

class SppSetting(SQLModel, table=True):
    """Pengaturan nominal SPP per tahun ajaran."""
    __tablename__ = "spp_settings"

    id: Optional[int] = Field(default=None, primary_key=True)
    monthly_nominal: Decimal = Field(max_digits=12, decimal_places=2)
    due_day: int = Field(default=10)                    # Tanggal jatuh tempo per bulan (1-31)
    academic_year: str = Field(max_length=10)           # DEPRECATED — gunakan academic_year_id
    academic_year_id: Optional[int] = Field(default=None, foreign_key="academic_years.id", index=True)
    is_active: bool = Field(default=True)
    effective_from: Optional[date] = Field(default=None) # Mulai berlaku
    effective_to: Optional[date] = Field(default=None)   # Berakhir
    notes: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Events (Patungan) ───────────────────────────────────────

class Event(SQLModel, table=True):
    """Event / patungan besar yang butuh tracking khusus."""
    __tablename__ = "events"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200)
    description: Optional[str] = Field(default=None)
    per_student_amount: Decimal = Field(max_digits=12, decimal_places=2)
    total_target: Decimal = Field(default=Decimal("0"), max_digits=15, decimal_places=2)
    total_collected: Decimal = Field(default=Decimal("0"), max_digits=15, decimal_places=2)
    status: EventStatus = Field(default=EventStatus.draft)
    academic_year_id: Optional[int] = Field(default=None, foreign_key="academic_years.id", index=True)
    deadline: Optional[date] = Field(default=None)
    allow_installment: bool = Field(default=True)
    min_installment_amount: Optional[Decimal] = Field(default=None, max_digits=12, decimal_places=2)
    created_by: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    bills: List["Bill"] = Relationship(back_populates="event")


# ─── Bills (Tagihan) ─────────────────────────────────────────

class Bill(SQLModel, table=True):
    """
    Satu tagihan = satu siswa + satu kewajiban bayar.
    NOTE: SPP bills are VIRTUAL — not stored. Only non_spp and event bills are stored in this table.
    """
    __tablename__ = "bills"

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="students.id", index=True)
    bill_type: BillType = Field(index=True)             # DEPRECATED — gunakan category_id untuk fleksibilitas
    category_id: Optional[int] = Field(default=None, foreign_key="bill_categories.id", index=True)
    academic_year_id: Optional[int] = Field(default=None, foreign_key="academic_years.id", index=True)

    # Identifiers & Category
    label: str = Field(max_length=200)                  # "Denda Buku", "Study Tour Bali"
    description: Optional[str] = Field(default=None)
    category: Optional[str] = Field(default=None, max_length=50) # DEPRECATED — gunakan category_id
    attachment_url: Optional[str] = Field(default=None)

    # Amounts
    amount: Decimal = Field(max_digits=12, decimal_places=2)
    total_paid: Decimal = Field(default=Decimal("0"), max_digits=12, decimal_places=2)
    status: BillStatus = Field(default=BillStatus.unpaid, index=True)

    # References
    event_id: Optional[int] = Field(default=None, foreign_key="events.id")
    notes: Optional[str] = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def remaining_amount(self) -> Decimal:
        return self.amount - (self.total_paid or Decimal("0"))

    # Relationships
    student: Optional[Student] = Relationship(back_populates="bills")
    event: Optional[Event] = Relationship(back_populates="bills")
    payments: List["Payment"] = Relationship(back_populates="bill")


# ─── Payments (Pembayaran / Cicilan) ─────────────────────────

class Payment(SQLModel, table=True):
    """
    Satu payment = satu kali bayar.
    NOTE: Untuk SPP, bill_id bernilai null karena tagihan SPP bersifat virtual.
    """
    __tablename__ = "payments"

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="students.id", index=True)
    bill_id: Optional[int] = Field(default=None, foreign_key="bills.id", index=True)
    academic_year_id: Optional[int] = Field(default=None, foreign_key="academic_years.id", index=True)
    payment_type: PaymentType = Field(index=True)       # spp, non_spp, event
    status: PaymentStatus = Field(default=PaymentStatus.paid, index=True)  # Status pembayaran

    # Period (untuk SPP)
    spp_month: Optional[int] = Field(default=None)      # 1-12
    spp_year: Optional[int] = Field(default=None)       # 2025

    # Amounts
    amount: Decimal = Field(max_digits=12, decimal_places=2) # Nominal bayar tagihan
    infaq_amount: Decimal = Field(default=Decimal("0"), max_digits=12, decimal_places=2) # Infaq sukarela
    total_amount: Decimal = Field(max_digits=12, decimal_places=2) # amount + infaq_amount

    # Method & Channel
    method: PaymentMethod                               # cash / transfer
    channel: PaymentChannel                             # gateway / manual
    gateway_transaction_id: Optional[str] = Field(default=None, max_length=100)

    # Meta
    notes: Optional[str] = Field(default=None)
    created_by: Optional[int] = Field(default=None, foreign_key="users.id") # Admin yang mencatat
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    student: Optional[Student] = Relationship(back_populates="payments")
    bill: Optional[Bill] = Relationship(back_populates="payments")
    receipt: Optional["Receipt"] = Relationship(back_populates="payment")


# ─── Receipts (Kuitansi) ─────────────────────────────────────

class Receipt(SQLModel, table=True):
    __tablename__ = "receipts"

    id: Optional[int] = Field(default=None, primary_key=True)
    payment_id: int = Field(foreign_key="payments.id", unique=True, index=True)
    receipt_number: str = Field(unique=True, index=True, max_length=50) # e.g. KWT/2025/07/001
    pdf_url: Optional[str] = Field(default=None)
    is_void: bool = Field(default=False)
    void_reason: Optional[str] = Field(default=None)
    voided_by: Optional[int] = Field(default=None, foreign_key="users.id")
    voided_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    payment: Optional[Payment] = Relationship(back_populates="receipt")


# ─── School Settings (Key-Value Store) ───────────────────────

class SchoolSetting(SQLModel, table=True):
    """Key-value store untuk profil sekolah, logo, alamat, dll."""
    __tablename__ = "school_settings"

    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(unique=True, index=True, max_length=100)
    value: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Bank Accounts ───────────────────────────────────────────

class BankAccount(SQLModel, table=True):
    """Daftar rekening sekolah untuk pembayaran via transfer."""
    __tablename__ = "bank_accounts"

    id: Optional[int] = Field(default=None, primary_key=True)
    bank_name: str = Field(max_length=50)               # e.g., "BSI", "BCA", "Mandiri"
    account_number: str = Field(max_length=50)
    account_holder: str = Field(max_length=100)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Gateway Transactions (Transaksi Online Gateway) ─────────

class GatewayTransaction(SQLModel, table=True):
    """
    Menyimpan data sesi checkout online via payment gateway (Midtrans / Xendit / Simulator)
    sebelum callback konfirmasi diterima (B-18, B-22).
    """
    __tablename__ = "gateway_transactions"

    id: Optional[int] = Field(default=None, primary_key=True)
    transaction_id: str = Field(unique=True, index=True, max_length=100) # e.g. TRX-20250725-1001
    student_id: int = Field(foreign_key="students.id", index=True)
    gateway_name: str = Field(default="midtrans", max_length=50)         # midtrans, xendit, simulator
    checkout_url: Optional[str] = Field(default=None)
    total_amount: Decimal = Field(max_digits=12, decimal_places=2)
    infaq_amount: Decimal = Field(default=Decimal("0"), max_digits=12, decimal_places=2)
    items_json: str                                                      # JSON string dari daftar tagihan yang dibayar
    status: str = Field(default="pending", index=True)                   # pending, success, failed, expired
    paid_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Audit Log ───────────────────────────────────────────────

class AuditLog(SQLModel, table=True):
    """Pencatatan aktivitas untuk keamanan dan tracking."""
    __tablename__ = "audit_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    action: str = Field(max_length=50)                  # e.g., "CREATE_PAYMENT", "UPDATE_STUDENT", "VOID_RECEIPT"
    entity_type: str = Field(max_length=50)             # e.g., "payment", "student", "bill"
    entity_id: Optional[int] = Field(default=None)
    detail: Optional[str] = Field(default=None)
    ip_address: Optional[str] = Field(default=None, max_length=45)
    created_at: datetime = Field(default_factory=datetime.utcnow)
