# 📋 Development Plan — TA SPP Payment System

> **Project:** Sistem Pembayaran SPP  
> **Stack:** FastAPI (Python) + React (Vite + TypeScript)  
> **Database:** PostgreSQL  
> **Task files:** `plan/backend/` | `plan/frontend/`

---

## Overview

Plan ini dibagi jadi **6 fase** berurutan. Tiap fase punya task **Backend** dan **Frontend** yang dipisah. Backend dikerjain duluan per fase karena frontend butuh API-nya.

```
Fase 1: Foundation          → Setup project, DB, config
Fase 2: Auth & Users        → Login, roles, data siswa & wali
Fase 3: Core Billing        → SPP, Non-SPP, Event
Fase 4: Payment System      → Gateway, manual, infaq, cicilan
Fase 5: Documents & Reports → Kuitansi, laporan, audit trail
Fase 6: Polish              → Dashboard final, refund, UX, testing
```

---

## Fase 1: Foundation 🏗️

> Setup dasar project, database, dan konfigurasi.

| # | Task | Type | Deps |
|---|------|------|------|
| B-01 | Setup project structure | Backend | — |
| B-02 | Database & Alembic | Backend | B-01 |
| B-03 | Models rewrite | Backend | B-02 |
| B-04 | Settings & school profile | Backend | B-03 |
| B-05 | File upload utility | Backend | B-01 |
| F-01 | Cleanup & setup | Frontend | — |
| F-02 | Design system | Frontend | F-01 |
| F-03 | Layout components | Frontend | F-02 |

---

## Fase 2: Auth & User Management 🔐

> Login system, kelola admin, siswa, dan wali.

| # | Task | Type | Deps |
|---|------|------|------|
| B-06 | Auth system | Backend | B-03 |
| B-07 | User management | Backend | B-06 |
| B-08 | Student CRUD | Backend | B-06 |
| B-09 | Student import (CSV/Excel) | Backend | B-08 |
| B-10 | Parent-student linking | Backend | B-07, B-08 |
| F-04 | Login page | Frontend | F-03 |
| F-05 | Auth context & guards | Frontend | F-04 |
| F-06 | Settings page (admin) | Frontend | F-05, B-04 |
| F-07 | Student management (admin) | Frontend | F-05, B-08, B-09 |
| F-08 | Parent management (admin) | Frontend | F-05, B-07, B-10 |

---

## Fase 3: Core Billing 💵

> SPP virtual bills, tagihan non-SPP, dan event/patungan.

| # | Task | Type | Deps |
|---|------|------|------|
| B-11 | SPP virtual bills | Backend | B-03, B-04 |
| B-12 | SPP semester grid | Backend | B-11 |
| B-13 | Non-SPP bills | Backend | B-05, B-08 |
| B-14 | Event CRUD | Backend | B-08 |
| B-15 | Event tracking | Backend | B-14 |
| B-16 | Event history | Backend | B-15 |
| B-17 | Wali: lihat tagihan | Backend | B-11, B-13, B-15 |
| F-09 | SPP grid page (admin) | Frontend | F-03, B-12 |
| F-10 | Non-SPP management (admin) | Frontend | F-03, B-13 |
| F-11 | Event management (admin) | Frontend | F-03, B-14, B-15, B-16 |
| F-12 | Event history (admin) | Frontend | F-11, B-16 |

---

## Fase 4: Payment System 💳

> Payment gateway, manual payment, infaq, cicilan.

| # | Task | Type | Deps |
|---|------|------|------|
| B-18 | Payment gateway integration | Backend | B-04, B-11, B-13, B-14 |
| B-19 | Manual payment (admin) | Backend | B-11, B-13, B-14 |
| B-20 | Installment logic | Backend | B-18, B-19 |
| B-21 | Infaq tracking | Backend | B-18, B-19 |
| B-22 | Wali: checkout flow | Backend | B-18 |
| F-13 | Manual payment form (admin) | Frontend | F-03, B-19 |
| F-14 | Wali dashboard | Frontend | F-05, B-17 |
| F-15 | Wali checkout & payment | Frontend | F-14, B-22 |
| F-16 | Payment history (wali) | Frontend | F-14, B-17 |

---

## Fase 5: Documents & Reports 📊

> Kuitansi PDF, laporan admin, audit trail.

| # | Task | Type | Deps |
|---|------|------|------|
| B-23 | Receipt/kuitansi generator | Backend | B-04, B-18, B-19 |
| B-24 | Reports | Backend | B-11, B-13, B-15, B-21 |
| B-25 | Audit trail | Backend | B-06 |
| F-17 | Receipt viewer | Frontend | B-23 |
| F-18 | Reports page (admin) | Frontend | B-24 |
| F-19 | Audit trail page (admin) | Frontend | B-25 |

---

## Fase 6: Polish & Optimization ✨

> Dashboard final, refund, UX improvements, testing.

| # | Task | Type | Deps |
|---|------|------|------|
| B-26 | Admin dashboard stats | Backend | B-11, B-18, B-19, B-21 |
| B-27 | Refund / void payment | Backend | B-19, B-25 |
| F-20 | Admin dashboard | Frontend | B-26 |
| F-21 | Refund UI (admin) | Frontend | B-27 |
| F-22 | Wali profile page | Frontend | F-05 |
| F-23 | Responsive & UX polish | Frontend | All |

---

## Summary

| Fase | Backend | Frontend | Total |
|------|:---:|:---:|:---:|
| 1. Foundation | 5 | 3 | 8 |
| 2. Auth & Users | 5 | 5 | 10 |
| 3. Core Billing | 7 | 4 | 11 |
| 4. Payment System | 5 | 4 | 9 |
| 5. Documents & Reports | 3 | 3 | 6 |
| 6. Polish | 2 | 4 | 6 |
| **TOTAL** | **27** | **23** | **50** |

---

## Notes

- **Backend duluan per fase** — Frontend butuh API yang sudah jalan
- **Fase 1-2 paling kritis** — Fondasi harus kokoh sebelum lanjut
- **Payment gateway (B-18)** bisa pakai sandbox dulu waktu development
- **Database migration** pakai Alembic supaya schema changes ter-track
- **Testing** bisa dilakukan parallel sama development
