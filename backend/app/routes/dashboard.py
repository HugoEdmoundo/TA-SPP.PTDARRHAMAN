from datetime import datetime, date
from decimal import Decimal
from typing import List, Dict, Any, Tuple
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.models import User, Student, Payment, Receipt, Event, StudentStatus, PaymentStatus
from app.dependencies import require_admin
from app.schemas.dashboard import (
    AdminDashboardResponse,
    DashboardBreakdown,
    ChannelBreakdown,
    TrendItem,
    ActiveEventItem,
)

router = APIRouter(dependencies=[Depends(require_admin)])

MONTH_NAMES = {
    1: "Januari", 2: "Februari", 3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
    7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober", 11: "November", 12: "Desember"
}


@router.get("/admin", response_model=AdminDashboardResponse)
def get_admin_dashboard_stats(session: Session = Depends(get_session)):
    """
    Mengambil data statistik lengkap untuk dashboard Admin (B-26).
    Dioptimalkan untuk performa tinggi & re-fetch otomatis dari SSE.
    """
    now = datetime.utcnow()
    curr_month = now.month
    curr_year = now.year

    # 1. Active students count
    active_students = session.exec(select(Student).where(Student.is_active == True, Student.status == StudentStatus.active)).all()
    total_students = len(active_students)
    active_student_ids = set(st.id for st in active_students)

    # 2. Get all voided payment IDs (from Receipt table)
    voided_receipts = session.exec(select(Receipt).where(Receipt.is_void == True)).all()
    voided_payment_ids = set(r.payment_id for r in voided_receipts)

    # 3. Income & Infaq this month
    start_of_month = datetime(curr_year, curr_month, 1, 0, 0, 0)
    if curr_month == 12:
        next_month = datetime(curr_year + 1, 1, 1, 0, 0, 0)
    else:
        next_month = datetime(curr_year, curr_month + 1, 1, 0, 0, 0)

    month_payments = session.exec(
        select(Payment).where(
            Payment.created_at >= start_of_month,
            Payment.created_at < next_month,
            Payment.status == PaymentStatus.paid,
        )
    ).all()

    valid_month_payments = [p for p in month_payments if p.id not in voided_payment_ids]

    total_income_this_month = float(sum(p.total_amount for p in valid_month_payments))
    infaq_this_month = float(sum(p.infaq_amount for p in valid_month_payments))

    # 4. Students paid SPP this month count
    spp_paid_student_ids = set(
        p.student_id for p in valid_month_payments
        if p.payment_type == "spp" and p.spp_month == curr_month and p.spp_year == curr_year
    )
    # Also include students who paid in general this month if spp not specifically marked
    paid_student_ids = set(p.student_id for p in valid_month_payments).intersection(active_student_ids)
    students_paid_count = len(paid_student_ids)
    students_unpaid_count = max(0, total_students - students_paid_count)

    # 5. Channel & Type Breakdown (This month or recent active transactions)
    # To give a rich breakdown, let's analyze all valid payments this month (if > 0, else all-time valid)
    breakdown_source = valid_month_payments
    if not breakdown_source:
        all_pmts = session.exec(select(Payment).where(Payment.status == PaymentStatus.paid)).all()
        breakdown_source = [p for p in all_pmts if p.id not in voided_payment_ids]

    gw_spp, gw_non, gw_ev, gw_inf = Decimal("0"), Decimal("0"), Decimal("0"), Decimal("0")
    mn_spp, mn_non, mn_ev, mn_inf = Decimal("0"), Decimal("0"), Decimal("0"), Decimal("0")

    for p in breakdown_source:
        is_gw = p.channel in ("gateway", "qris", "virtual_account") or p.gateway_transaction_id is not None
        
        if is_gw:
            gw_inf += p.infaq_amount
            if p.payment_type == "spp":
                gw_spp += p.amount
            elif p.payment_type == "event":
                gw_ev += p.amount
            else:
                gw_non += p.amount
        else:
            mn_inf += p.infaq_amount
            if p.payment_type == "spp":
                mn_spp += p.amount
            elif p.payment_type == "event":
                mn_ev += p.amount
            else:
                mn_non += p.amount

    breakdown = DashboardBreakdown(
        gateway=ChannelBreakdown(
            spp=float(gw_spp), non_spp=float(gw_non), event=float(gw_ev), infaq=float(gw_inf)
        ),
        manual=ChannelBreakdown(
            spp=float(mn_spp), non_spp=float(mn_non), event=float(mn_ev), infaq=float(mn_inf)
        )
    )

    # 6. Trend 6 Months (including current month)
    trend_months: List[Tuple[int, int]] = []
    y, m = curr_year, curr_month
    for _ in range(6):
        trend_months.append((y, m))
        m -= 1
        if m < 1:
            m = 12
            y -= 1
    trend_months.reverse()

    oldest_y, oldest_m = trend_months[0]
    start_6m = datetime(oldest_y, oldest_m, 1, 0, 0, 0)
    recent_all = session.exec(select(Payment).where(Payment.created_at >= start_6m, Payment.status == PaymentStatus.paid)).all()
    valid_recent = [p for p in recent_all if p.id not in voided_payment_ids]

    # Aggregate by (year, month)
    monthly_totals: Dict[Tuple[int, int], Decimal] = {tm: Decimal("0") for tm in trend_months}
    for p in valid_recent:
        key = (p.created_at.year, p.created_at.month)
        if key in monthly_totals:
            monthly_totals[key] += p.total_amount

    trend_6_months = [
        TrendItem(
            month=tm[1],
            year=tm[0],
            total=float(monthly_totals[tm]),
            month_name=MONTH_NAMES.get(tm[1], str(tm[1]))
        )
        for tm in trend_months
    ]

    # 7. Active Events progress
    active_events_db = session.exec(select(Event).where(Event.status == "active").order_by(Event.id.desc())).all()
    active_events = []
    for ev in active_events_db:
        pct = float((ev.total_collected / ev.total_target * 100) if ev.total_target > 0 else Decimal("0"))
        active_events.append(
            ActiveEventItem(
                id=ev.id,
                name=ev.name,
                progress_pct=round(pct, 1),
                target=float(ev.total_target),
                collected=float(ev.total_collected)
            )
        )

    return AdminDashboardResponse(
        total_income_this_month=total_income_this_month,
        students_paid_count=students_paid_count,
        students_unpaid_count=students_unpaid_count,
        total_students=total_students,
        infaq_this_month=infaq_this_month,
        breakdown=breakdown,
        trend_6_months=trend_6_months,
        active_events=active_events
    )
