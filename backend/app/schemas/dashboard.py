from pydantic import BaseModel, Field
from typing import List, Dict


class ChannelBreakdown(BaseModel):
    spp: float = 0.0
    non_spp: float = 0.0
    event: float = 0.0
    infaq: float = 0.0


class DashboardBreakdown(BaseModel):
    gateway: ChannelBreakdown
    manual: ChannelBreakdown


class TrendItem(BaseModel):
    month: int
    year: int
    total: float
    month_name: str


class ActiveEventItem(BaseModel):
    id: int
    name: str
    progress_pct: float
    target: float
    collected: float


class AdminDashboardResponse(BaseModel):
    total_income_this_month: float
    students_paid_count: int
    students_unpaid_count: int
    total_students: int
    infaq_this_month: float
    breakdown: DashboardBreakdown
    trend_6_months: List[TrendItem]
    active_events: List[ActiveEventItem]
