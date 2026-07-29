# Product Requirements Document (PRD) v2.0

## Aplikasi Manajemen Pembayaran SPP & Platform Manajemen Sekolah

**Versi Dokumen:** 2.0 (Perbandingan & Perancangan)  
**Status:** Draft  
**Tanggal:** Juli 2026  

---

## 1. Ringkasan Eksekutif

Dokumen PRD-v2 ini adalah **dokumen perbandingan** antara spesifikasi awal (**PRD-v1**) dengan implementasi aktual sistem saat ini (**TA SPP Payment System**), serta **dokumen perancangan** untuk fitur-fitur yang belum diimplementasikan.

PRD-v1 (Juli 2025) mendeskripsikan aplikasi **monolitik Laravel 12** dengan **Bootstrap 5**.  
Project saat ini (Juli 2026) adalah **rewrite total** menggunakan **FastAPI (Python) + React 19 (TypeScript)** dengan arsitektur **REST API + SPA**.

> **Catatan:** Tidak ada kode dari PRD-v1 yang digunakan kembali. Seluruh project saat ini dibangun dari nol dengan stack berbeda.

---

## 2. Perbandingan Tech Stack

| Komponen | PRD-v1 | Project Saat Ini |
|---|---|---|
| **Backend Framework** | Laravel 12 (PHP ^8.2) | FastAPI 0.115 (Python 3.12) |
| **ORM** | Eloquent | SQLModel 0.0.24 + SQLAlchemy 2.0 |
| **Database** | MySQL | PostgreSQL (prod) / SQLite (dev) |
| **Frontend** | Bootstrap 5 + Blade + custom CSS | React 19 + TypeScript + Tailwind CSS 3 |
| **Build Tool** | Vite 5 | Vite 8 |
| **State Management** | Livewire / jQuery | React Context + hooks |
| **Auth** | Laravel Sanctum (token-based) | JWT (python-jose, access + refresh token) |
| **Real-time** | Pusher + Laravel Echo | SSE (Server-Sent Events) via `sse-starlette` |
| **PDF Generation** | DomPDF (barryvdh/laravel-dompdf) | ReportLab 4.4 |
| **Excel Export** | Maatwebsite/Laravel-Excel | OpenPyXL 3.1 |
| **QR Code** | simplesoftwareio/simple-qrcode | qrcode 8.2 + Pillow 12.2 |
| **Chart/Grafik** | — | Recharts 3.10 |
| **HTTP Client** | Guzzle | Axios 1.18 |
| **Arsitektur** | Monolitik MVC (Blade SSR) | REST API + SPA (terpisah) |
| **Deployment** | — | Vercel (frontend + backend) |
| **Container** | — | Docker + Docker Compose |
| **Notifikasi Eksternal** | SMTP/Mailpit | WhatsApp Fonnte API |
| **Payment Gateway** | — (tidak ada) | Midtrans / Xendit / Simulator |

---

## 3. Perbandingan Arsitektur Sistem

### 3.1 PRD-v1 (Laravel Monolitik)

```
┌──────────────────────────────────────┐
│            Laravel 12 App            │
│  ┌──────────┐  ┌──────────────────┐  │
│  │  Blade   │  │   Controller     │  │
│  │  Views   │◄─┤   (MVC)          │  │
│  │(Bootstrap│  │                  │  │
│  │   5)     │  └────────┬─────────┘  │
│  └──────────┘           │            │
│               ┌─────────▼─────────┐  │
│               │  Model (Eloquent) │  │
│               │  MySQL Database   │  │
│               └───────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  Pusher (real-time)           │  │
│  │  Sanctum (API auth)           │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### 3.2 Project Saat Ini (FastAPI + React SPA)

```
┌──────────────────────┐    ┌──────────────────────────────┐
│   Frontend (React)   │    │    Backend (FastAPI)          │
│                      │    │                              │
│  ┌────────────────┐  │    │  ┌────────────────────────┐  │
│  │  AdminLayout   │  │    │  │  Routes (14 routers)   │  │
│  │  WaliLayout    │  │    │  │  • auth, users         │  │
│  │                │  │HTTP│  │  • students, bills     │  │
│  │  Pages:        │◄┼────┼─►│  • spp, events         │  │
│  │  • 14 Admin    │  │    │  │  • payments, receipts  │  │
│  │  • 5 Wali      │  │    │  │  • reports, dashboard  │  │
│  └────────────────┘  │    │  │  • audit, settings     │  │
│                      │    │  │  • my, sse             │  │
│  ┌────────────────┐  │    │  └───────────┬────────────┘  │
│  │  AuthContext   │  │    │              │               │
│  │  SettingsCtx   │  │    │  ┌───────────▼────────────┐  │
│  └────────────────┘  │    │  │  Services Layer        │  │
│                      │    │  │  • payment, spp        │  │
│  ┌────────────────┐  │    │  │  • receipt, report     │  │
│  │  SSE Client    │◄─┼────┼──┤  • notification, audit │  │
│  └────────────────┘  │    │  └───────────┬────────────┘  │
└──────────────────────┘    │              │               │
                            │  ┌───────────▼────────────┐  │
                            │  │  Models (SQLModel)     │  │
                            │  │  PostgreSQL / SQLite   │  │
                            │  └────────────────────────┘  │
                            │                              │
                            │  ┌────────────────────────┐  │
                            │  │  SSE Broadcast         │  │
                            │  │  WhatsApp Fonnte       │  │
                            │  │  Payment Gateway       │  │
                            │  │  JWT Auth              │  │
                            │  └────────────────────────┘  │
                            └──────────────────────────────┘
```

### 3.3 Alur Data

**Flow PRD-v1:**
```
Admin buat tagihan → Murid bayar (upload bukti) → Admin verifikasi (approve/reject) → Status diperbarui
```

**Flow Project Saat Ini:**
```
Admin/Superadmin kelola master data (siswa, kategori, tahun ajaran, bank)
    │
    ├── SPP: Virtual engine hitung otomatis per bulan berdasarkan pembayaran
    │
    ├── Non-SPP: Admin buat tagihan → Wali bayar via Gateway / Admin input manual
    │
    ├── Event: Admin buat event + generate bill per siswa → Wali kontribusi via Gateway / Admin manual
    │
    └── Infaq: Otomatis tercatat dari pembayaran (infaq_amount) + pencatatan penyaluran manual
```

---

## 4. Perbandingan Role & Model Pengguna

| Aspek | PRD-v1 | Project Saat Ini |
|---|---|---|
| **Role** | Admin, Murid | Admin, Superadmin, Wali (orang tua), Bendahara |
| **Login Murid** | Murid login langsung dengan username/password | **Tidak ada role Murid.** Siswa adalah entitas `Student` yang dikelola oleh Wali |
| **Relasi** | User (admin/murid) langsung memiliki tagihan | `User` (Wali) terhubung ke `Student` via tabel `parent_student` (many-to-many) |
| **Default Password** | 123456789 (hardcoded) | Tidak ada (admin buat akun Wali manual) |
| **Status Akun** | aktif (boolean) | `StudentStatus` enum: active, graduated, transferred, dropout, inactive |

### Perubahan Signifikan pada Role Model

**PRD-v1** menyatukan murid dan admin dalam satu tabel `users` dengan field `role` (enum: admin/murid). Murid login langsung dan melihat tagihan sendiri.

**Project saat ini** memisahkan:
- **User** → admin, superadmin, wali (orang tua/wali murid)
- **Student** → data siswa dengan NIS, status, kelas, tahun ajaran
- **ParentStudent** → tabel link many-to-many antara wali dan siswa
- Satu wali bisa memiliki banyak anak; satu anak bisa memiliki banyak wali

Ini adalah perubahan fundamental yang membuat sistem lebih cocok untuk **sekolah/pesantren** di mana orang tua/wali yang bertanggung jawab atas pembayaran, bukan murid itu sendiri.

---

## 5. Perbandingan Struktur Database

### 5.1 Tabel PRD-v1 (9 tabel)

| No | Tabel | Fungsi |
|----|-------|--------|
| 1 | `users` | Admin & Murid (role enum: admin/murid) |
| 2 | `spp_settings` | Konfigurasi nominal SPP per bulan |
| 3 | `tagihans` | Tagihan SPP & custom |
| 4 | `pembayarans` | Pembayaran + upload bukti |
| 5 | `pengeluaran` | Pencatatan pengeluaran sekolah |
| 6 | `notifications` | Notifikasi in-app |

### 5.2 Tabel Project Saat Ini (14 tabel)

| No | Tabel | Fungsi | Status Migrasi |
|----|-------|--------|----------------|
| 1 | `users` | Admin, Superadmin, Wali, Bendahara | ✅ migrated |
| 2 | `students` | Data siswa (NIS, nama, status, kelas) | ✅ migrated |
| 3 | `parent_student` | Relasi many-to-many wali ↔ siswa | ✅ migrated |
| 4 | `academic_years` | **BARU** — Master tahun ajaran | ✅ migrated |
| 5 | `bill_categories` | **BARU** — Kategori tagihan dinamis | ✅ migrated |
| 6 | `spp_settings` | Konfigurasi SPP (dengan academic_year_id) | ✅ migrated |
| 7 | `bills` | Tagihan Non-SPP & Event (SPP bersifat virtual) | ✅ migrated |
| 8 | `events` | **BARU** — Event/patungan sekolah | ✅ migrated |
| 9 | `payments` | Pembayaran (gateway + manual, cicilan, infaq) | ✅ migrated |
| 10 | `receipts` | **BARU** — Kuitansi digital (dengan void) | ✅ migrated |
| 11 | `bank_accounts` | **BARU** — Rekening sekolah untuk transfer | ✅ migrated |
| 12 | `school_settings` | **BARU** — Key-value store profil sekolah | ✅ migrated |
| 13 | `audit_logs` | **BARU** — Audit trail keamanan | ✅ migrated |
| 14 | `gateway_transactions` | **BARU** — Transaksi payment gateway | ⚠️ **belum ada migration file** |

### 5.3 Perbedaan Detail PER Tabel

#### `users` (PRD-v1) vs `users` (Sekarang)

| Kolom PRD-v1 | Tipe v1 | Kolom Sekarang | Tipe Sekarang |
|---|---|---|---|
| id | bigint PK | id | INTEGER PK |
| role | enum('admin','murid') | role | VARCHAR(20): 'admin', 'superadmin', 'wali', 'bendahara' |
| nama | varchar(100) | full_name | VARCHAR(100) |
| email | varchar(100) unique | email | VARCHAR(100) nullable |
| username | varchar(50) unique | username | VARCHAR(50) UNIQUE INDEX |
| password | varchar (hashed) | hashed_password | TEXT |
| nip | varchar(30) nullable | — | — |
| foto | varchar nullable | — (ada di avatar_url?) | — |
| aktif | boolean default true | is_active | BOOLEAN |
| — | — | phone | VARCHAR(20) nullable |
| timestamps | created_at, updated_at | created_at, updated_at | DATETIME |

#### `spp_settings`

| Kolom PRD-v1 | Sekarang | Keterangan |
|---|---|---|
| nominal | monthly_nominal | Sama, numeric(12,2) |
| berlaku_mulai | effective_from, effective_to | v1 hanya 1 tanggal; sekarang ada range |
| — | due_day | **BARU** — tanggal jatuh tempo (default 10) |
| — | academic_year | varchar(10) — DEPRECATED |
| — | academic_year_id | **BARU** — FK ke academic_years |
| — | is_active | **BARU** |
| — | notes | **BARU** |

#### `tagihans` (PRD-v1) vs `bills` (Sekarang)

Perubahan paling signifikan: **SPP tidak lagi disimpan sebagai baris di tabel tagihan.**

| Aspek | PRD-v1 (tagihans) | Sekarang (bills) |
|---|---|---|
| SPP | Disimpan sebagai baris dengan `jenis='spp'` | **VIRTUAL** — tidak disimpan, dihitung otomatis |
| Non-SPP | `jenis='custom'` | Disimpan dengan `bill_type='non_spp'` |
| Event | — (tidak ada) | Disimpan dengan `bill_type='event'` dan `event_id` |
| Foreign Key | `user_id` → users | `student_id` → students |
| Status | unpaid, pending, success, rejected | unpaid, partial, paid |
| Cicilan | — | `total_paid` + `remaining_amount` (property) |
| Kategori | — | `category_id` → bill_categories (dinamis) |
| Tahun Ajaran | — | `academic_year_id` → academic_years |

#### `pembayarans` (PRD-v1) vs `payments` (Sekarang)

| Aspek | PRD-v1 | Sekarang |
|---|---|---|
| Status | pending, accepted, rejected | pending, paid, failed, expired, cancelled, refunded |
| Verifikasi | Admin approve/reject | Gateway callback otomatis + manual admin |
| Metode | — (upload bukti) | cash, transfer |
| Channel | — | gateway, manual |
| Infaq | — | `infaq_amount` + `total_amount` (amount + infaq) |
| Cicilan | — | Cicilan via partial payment ke bill yang sama |
| Foreign Key | `tagihan_id`, `user_id`, `admin_id` | `student_id`, `bill_id`, `created_by` |
| Bukti | `bukti` (file upload) | — (tidak ada upload bukti, pakai gateway/manual) |
| Waktu | `tanggal_upload`, `tanggal_bayar`, `tanggal_proses` | `created_at` (saat bayar) |

#### `pengeluaran` (PRD-v1) — **BELUM ADA di project saat ini**

| Kolom PRD-v1 | Tipe v1 |
|---|---|
| id | bigint PK |
| kategori | varchar |
| keterangan | varchar |
| jumlah | decimal(12,2) |
| tanggal | date |
| admin_id | bigint (FK→users) |

Fitur ini belum diimplementasikan. Lihat **Bab 10** untuk desain.

#### Tabel BARU di Project Saat Ini

| Tabel | Fungsi |
|---|---|
| `students` | Data siswa terpisah dari users |
| `parent_student` | Relasi wali ↔ siswa (many-to-many) |
| `academic_years` | Master tahun ajaran (anti-typo, tutup buku) |
| `bill_categories` | Kategori tagihan dinamis (admin bisa tambah sendiri) |
| `events` | Event/patungan dengan target donasi |
| `receipts` | Kuitansi digital (nomor unik, void) |
| `bank_accounts` | Rekening sekolah untuk pembayaran transfer |
| `school_settings` | Key-value store (nama sekolah, logo, dll) |
| `audit_logs` | Catatan aktivitas admin untuk audit |
| `gateway_transactions` | Sesi checkout payment gateway |

### 5.4 Diagram Relasi Database (Saat Ini)

```
academic_years
    ├── students.academic_year_id
    ├── spp_settings.academic_year_id
    ├── bills.academic_year_id
    ├── payments.academic_year_id
    └── events.academic_year_id

users (admin/superadmin/wali)
    └── parent_student.parent_id ──┐
                                   ├── students
    └── parent_student.student_id ─┘
         ├── bills.student_id
         ├── payments.student_id
         └── gateway_transactions.student_id

bill_categories
    └── bills.category_id

events
    └── bills.event_id

bills
    └── payments.bill_id

payments
    └── receipts.payment_id (one-to-one)

bank_accounts
school_settings
audit_logs
```

---

## 6. Perbandingan Fitur — Detail

### 6.1 Autentikasi

| Fitur | PRD-v1 | Sekarang |
|---|---|---|
| Login username/password | ✅ | ✅ (plus OAuth2 form untuk Swagger) |
| Logout | ✅ | ✅ (dicatat ke audit log) |
| Redirect sesuai role | ✅ | ✅ (admin → /admin, wali → /wali) |
| Validasi status aktif | ✅ | ✅ (is_active + StudentStatus) |
| Refresh token | — | ✅ (JWT refresh token 7 hari) |
| Demo/login test | — | ✅ (built-in demo accounts) |

### 6.2 Dashboard Admin

| Fitur | PRD-v1 | Sekarang |
|---|---|---|
| Total murid aktif | ✅ | ✅ |
| Total tagihan belum dibayar | ✅ | ✅ (outstanding amount) |
| Total pembayaran diterima | ✅ | ✅ (income bulan ini) |
| Total pengeluaran | ✅ | ❌ **Belum ada** |
| Saldo akhir | ✅ | ❌ **Belum ada** (karena belum ada pengeluaran) |
| Jumlah pembayaran pending | ✅ | ✅ |
| — | — | ✅ Channel breakdown (gateway vs manual) |
| — | — | ✅ Trend 6 bulan (grafik) |
| — | — | ✅ Progress active events |

### 6.3 Manajemen Siswa/Murid

| Fitur | PRD-v1 | Sekarang |
|---|---|---|
| CRUD murid/siswa | ✅ | ✅ |
| Default password 123456789 | ✅ | ❌ (tidak relevan — tidak ada role murid) |
| Aktif/Nonaktifkan | ✅ | ✅ (StudentStatus enum: active/graduated/dropout/dll) |
| Reset password | ✅ | ✅ (hanya untuk user, bukan student) |
| Lihat tagihan per murid | ✅ | ✅ (via student history) |
| Lihat riwayat pembayaran | ✅ | ✅ (via student history) |
| Import Excel/CSV | — | ✅ (dengan preview sebelum simpan) |
| Upload foto siswa | — | ✅ |
| Kelola orang tua/wali | — | ✅ (link/unlink parent-student) |
| Status siswa (lulus/keluar) | — | ✅ (StudentStatus enum) |

### 6.4 Manajemen Tagihan

| Fitur | PRD-v1 | Sekarang |
|---|---|---|
| Buat tagihan (jenis: custom/non-SPP) | ✅ | ✅ (dengan kategori dinamis) |
| Buat tagihan (jenis: SPP) | ✅ | ❌ SPP **VIRTUAL** — tidak perlu dibuat |
| Hapus tagihan (jika belum dibayar) | ✅ | ✅ |
| Status: unpaid, pending, success | ✅ | ✅ (unpaid, partial, paid) |
| — | — | ✅ Cicilan (partial payment) |
| — | — | ✅ Kategori tagihan dinamis (BillCategory) |
| — | — | ✅ Tagihan massal ke banyak siswa |
| — | — | ✅ Event/patungan dengan bill otomatis |

### 6.5 Manajemen Pembayaran

| Fitur | PRD-v1 | Sekarang |
|---|---|---|
| Lihat daftar pembayaran pending | ✅ | ✅ (status pending dari gateway) |
| Riwayat pembayaran | ✅ | ✅ |
| Approve pembayaran (lunas/cicilan) | ✅ | ✅ (manual payment) |
| Reject dengan alasan | ✅ | ✅ (via void, dengan alasan) |
| Detail + bukti upload | ✅ | ✅ (receipt detail) |
| Pembayaran Manual oleh Admin | ✅ | ✅ |
| Payment Gateway | — | ✅ (Midtrans/Xendit/Simulator) |
| Infaq sukarela | — | ✅ (infaq_amount per pembayaran) |
| Void pembayaran | — | ✅ (dengan audit trail) |
| Cicilan (installment) | — | ✅ (untuk SPP, Non-SPP, Event) |

### 6.6 Manajemen Pengeluaran

| Fitur | PRD-v1 | Sekarang |
|---|---|---|
| Kategori pengeluaran | ✅ (Listrik, Sarapan, WiFi, Osman, Other) | ❌ **Belum ada** |
| CRUD pengeluaran | ✅ | ❌ **Belum ada** |
| Laporan pengeluaran | ✅ | ❌ **Belum ada** |
| Ekspor pengeluaran | ✅ (Excel/PDF) | ❌ **Belum ada** |

> **Catatan:** Halaman Infaq saat ini memiliki fitur pencatatan "pengeluaran infaq" yang disimpan di localStorage (bukan database). Ini bersifat sementara dan perlu migrasi ke sistem database.

### 6.7 Pengaturan SPP

| Fitur | PRD-v1 | Sekarang |
|---|---|---|
| Ubah nominal SPP per bulan | ✅ | ✅ |
| Masa berlaku | ✅ (berlaku_mulai) | ✅ (effective_from, effective_to) |
| Due date (jatuh tempo) | — | ✅ (due_day) |
| Per tahun ajaran | — | ✅ (academic_year_id) |

### 6.8 Laporan & Ekspor

| Fitur | PRD-v1 | Sekarang |
|---|---|---|
| Laporan SPP per tahun per murid | ✅ | ✅ (via SPP grid + report) |
| Laporan tagihan non-SPP | ✅ | ✅ |
| Laporan pengeluaran | ✅ | ❌ **Belum ada** |
| Ekspor Excel | ✅ | ✅ (OpenPyXL) |
| Ekspor PDF | ✅ | ✅ (ReportLab) |
| — | — | ✅ Laporan infaq |
| — | — | ✅ Laporan event |
| — | — | ✅ Laporan bulanan (all types) |

### 6.9 Kuitansi

| Fitur | PRD-v1 | Sekarang |
|---|---|---|
| Cetak kuitansi PDF | ✅ | ✅ (ReportLab + QR code) |
| — | — | ✅ Kuitansi PNG (WhatsApp-friendly) |
| — | — | ✅ Nomor kuitansi unik otomatis |
| — | — | ✅ Void kuitansi (dengan alasan) |
| — | — | ✅ QR code verifikasi |
| — | — | ✅ Share kuitansi via ReceiptShareCard |

### 6.10 Notifikasi

| Fitur | PRD-v1 | Sekarang |
|---|---|---|
| In-App Notification | ✅ (database) | ✅ (SSE real-time) |
| Real-time via Pusher | ✅ | ❌ (diganti SSE) |
| Email notification | ✅ (SMTP/Mailpit) | ❌ **Belum ada** |
| — | — | ✅ WhatsApp Fonnte |
| — | — | ✅ Notifikasi saat pembayaran dibuat |
| — | — | ✅ Notifikasi saat status diupdate |

### 6.11 Event & Infaq (Fitur Baru)

| Fitur | PRD-v1 | Sekarang |
|---|---|---|
| Event/Patungan sekolah | — | ✅ |
| Crowdfunding per event | — | ✅ |
| Tracking kontribusi per siswa | — | ✅ |
| Infaq sukarela per pembayaran | — | ✅ |
| Buku kas infaq (inflow/outflow) | — | ⚠️ Sebagian (outflow masih localStorage) |

---

## 7. Perbandingan Endpoint API

### 7.1 PRD-v1 (Rute Web — Blade)

```
Auth:
  GET  /                          → Login page
  POST /                          → Login process
  POST /logout                    → Logout

Admin (/admin/*):
  Dashboard, CRUD murid, CRUD tagihan, CRUD pengeluaran
  Manajemen pembayaran (index, approve, reject, manual)
  Pengaturan SPP, Profil
  Laporan & ekspor (Excel/PDF)
  Generate kuitansi PDF

Murid (/murid/*):
  Dashboard, lihat tagihan, bayar SPP
  Upload bukti, upload ulang
  Riwayat pembayaran, rekap SPP
  Kuitansi PDF, laporan, profil

API:
  GET /api/user
  GET /validate-spp
```

### 7.2 Project Saat Ini (105 Endpoint REST API)

**Auth (5):** `POST /auth/login`, `/auth/token`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`

**Settings (38):** CRUD academic years, bill categories, bank accounts, spp settings, school settings, logo upload

**SSE (1):** `GET /sse/events` — real-time streaming

**Users (5):** CRUD user admin/wali, reset password

**Students (13):** CRUD siswa, import Excel/CSV, upload foto, link/unlink parent, lihat anak (wali)

**SPP (2):** `GET /spp/status/{student_id}`, `GET /spp/grid`

**Bills (5):** CRUD tagihan non-SPP (massal)

**Events (9):** CRUD event, tracking progress, complete event, history

**Wali Portal (4):** `GET /my/children`, `/my/bills`, `/my/payments`, `POST /my/checkout`

**Payments (10):** Gateway create, callback webhook, manual payment, receipt detail, void receipt, infaq summary, student history, void payment, list payments

**Receipts (2):** `GET /receipts/{id}/pdf`, `GET /receipts/{id}/image`

**Reports (5):** SPP semester, monthly, student, infaq, events (format: json/pdf/excel)

**Audit Logs (2):** List + filter audit logs

**Dashboard (1):** `GET /dashboard/admin` — stats + trends + breakdown

> **Detail lengkap:** 105 endpoint tersebar di 14 router file.

---

## 8. Perbandingan Halaman Frontend

### 8.1 Halaman Login

| Aspek | PRD-v1 | Sekarang |
|---|---|---|
| Form | Username + Password | Username + Password |
| Redirect | Berdasarkan role | Berdasarkan role (admin → /admin, wali → /wali) |
| Tema | Hijau (#1E8449) | Hijau emerald (Tailwind: emerald) |

### 8.2 Halaman Admin

| Halaman PRD-v1 | Halaman Sekarang |
|---|---|
| Dashboard (5 kartu statistik) | ✅ DashboardPage (lebih lengkap: trend, breakdown, events) |
| Daftar murid | ✅ StudentsPage (CRUD + import + filter status) |
| Tambah murid | ✅ (bagian dari StudentsPage) |
| Detail tagihan per murid | ✅ StudentHistoryPage |
| Riwayat pembayaran per murid | ✅ StudentHistoryPage |
| Daftar tagihan | ✅ NonSppPage + SppGridPage |
| Buat tagihan | ✅ NonSppPage (massal) |
| Pembayaran pending | ✅ PaymentKasirPage |
| Approve/reject | ✅ PaymentKasirPage (void) |
| Pembayaran manual | ✅ PaymentKasirPage |
| Manajemen pengeluaran | ❌ **Belum ada** |
| Pengaturan SPP | ✅ SettingsPage + SppGridPage |
| Laporan | ✅ ReportsPage (4 jenis) |
| Cetak kuitansi | ✅ Receipts (PDF + PNG + share) |
| Profil admin | ✅ AdminProfilePage |
| — | ✅ EventsPage (**BARU**) |
| — | ✅ InfaqPage (**BARU**) |
| — | ✅ ParentsPage (**BARU** — kelola wali) |
| — | ✅ UsersPage (**BARU** — superadmin only) |
| — | ✅ AuditLogPage (**BARU** — superadmin only) |

### 8.3 Halaman Murid/Wali

| Aspek | PRD-v1 (Murid) | Sekarang (Wali) |
|---|---|---|
| Login | Murid login langsung | Wali login, pilih anak |
| Dashboard | ✅ | ✅ WaliDashboardPage (pilih anak, lihat summary) |
| Bayar SPP | ✅ Pilih range bulan + upload bukti | ✅ WaliSppPage (bayar via gateway) |
| Bayar tagihan | ✅ Upload bukti | ✅ (via gateway, gabung di WaliSppPage + WaliEventPage) |
| Riwayat | ✅ | ✅ WaliHistoryPage |
| Rekap SPP | ✅ | ✅ (via dashboard & SPP page) |
| Kuitansi | ✅ Download PDF | ✅ (PDF + PNG + share) |
| Laporan | ✅ | ✅ (via reports) |
| Profil | ✅ | ✅ WaliProfilePage |
| — | — | ✅ WaliEventPage (**BARU** — lihat event anak) |

### 8.4 Layout

| Aspek | PRD-v1 | Sekarang |
|---|---|---|
| Sidebar | Sidebar navigasi (berbeda admin/murid) | AdminLayout: sidebar collapsible + mobile bottom dock (Telegram-style 5 tab) |
| Header | Header dengan notifikasi | Header + spotlight search (Ctrl+K) |
| Footer | Footer | — |
| Tema | Hijau (#1E8449) | Emerald (Tailwind), glass morphism, gradient |
| Wali Layout | — | Bottom dock 5 tab + child selector dropdown |

---

## 9. Perubahan Alur Bisnis Signifikan

### 9.1 SPP: Dari Tersimpan ke Virtual

**PRD-v1:** Admin membuat tagihan SPP per bulan untuk setiap murid → murid bayar → admin verifikasi.

**Sekarang:** SPP tidak disimpan sebagai baris tagihan. Sistem menghitung status per bulan berdasarkan:
1. Nominal SPP dari `spp_settings` (berdasarkan tahun ajaran)
2. Total pembayaran sukses dengan `payment_type='spp'` per bulan
3. Status: `unpaid` (0), `partial` (>0 tapi <nominal), `paid` (>=nominal)

### 9.2 Pembayaran: Dari Upload Bukti ke Gateway + Manual

**PRD-v1:** Murid upload bukti transfer (file gambar) → Admin approve/reject.

**Sekarang:**
- **Gateway:** Wali bayar online (Midtrans/Xendit) → callback otomatis → status update → kuitansi terbit
- **Manual:** Admin/Kasir input pembayaran langsung (cash/transfer) → kuitansi terbit
- **Tidak ada upload bukti** oleh wali/murid

### 9.3 Role: Dari Murid ke Wali

**PRD-v1:** Murid adalah user yang login langsung.

**Sekarang:** Wali (orang tua) adalah user. Student adalah data terpisah. Satu wali bisa memiliki banyak anak. Pendekatan ini lebih sesuai untuk konteks sekolah/pesantren.

### 9.4 Real-time: Dari Pusher ke SSE

**PRD-v1:** Pusher (third-party service).

**Sekarang:** SSE (Server-Sent Events) — built-in, tidak perlu third-party, lebih sederhana.

### 9.5 Verifikasi: Dari Manual ke Otomatis

**PRD-v1:** Admin harus approve/reject setiap pembayaran.

**Sekarang:** Pembayaran gateway terverifikasi otomatis via webhook. Hanya pembayaran manual yang butuh input admin.

---

## 10. Fitur yang Belum Diimplementasi — Desain Manajemen Pengeluaran

Berdasarkan analisis, fitur **Manajemen Pengeluaran** dari PRD-v1 belum ada di project saat ini. Berikut desain untuk implementasinya.

### 10.1 Deskripsi Fitur

Manajemen Pengeluaran mencatat semua pengeluaran operasional sekolah. Data ini akan ditampilkan di dashboard admin (total pengeluaran, saldo akhir) dan tersedia dalam laporan yang bisa diekspor.

### 10.2 Database Model

**Tabel: `expenses`**

```sql
CREATE TABLE expenses (
    id              INTEGER PRIMARY KEY,
    category        VARCHAR(50) NOT NULL,     -- listrik, sarapan, wifi, osman, other
    description     TEXT NOT NULL,             -- keterangan pengeluaran
    amount          NUMERIC(12,2) NOT NULL,   -- jumlah nominal
    expense_date    DATE NOT NULL,             -- tanggal pengeluaran
    payment_method  VARCHAR(20),              -- cash / transfer (nullable)
    receipt_url     TEXT,                      -- bukti/foto struk (nullable)
    notes           TEXT,                      -- catatan tambahan
    created_by      INTEGER NOT NULL,         -- FK -> users.id (admin yg mencatat)
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL,
    
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);
```

### 10.3 Kategori Pengeluaran (dari PRD-v1 + tambahan)

| Kode | Label | Default |
|---|---|---|
| `listrik` | Bayar Listrik | ✅ |
| `sarapan` | Sarapan | ✅ |
| `wifi` | Bayar WiFi | ✅ |
| `osman` | Kebutuhan Osman | ✅ |
| `other` | Other | ✅ |
| `gaji` | Gaji Karyawan | ➕ tambahan |
| `operasional` | Operasional Harian | ➕ tambahan |
| `infaq` | Penyaluran Infaq | ➕ tambahan (hubungkan dengan infaq outflow) |

### 10.4 Relasi ke Infaq

Halaman Infaq saat ini memiliki fitur "pencatatan pengeluaran infaq" yang masih disimpan di localStorage. Desain baru:

1. Semua pencatatan outflow infaq akan disimpan ke tabel `expenses` dengan `category='infaq'`
2. Data infaq inflow tetap dari `payments.infaq_amount`
3. Halaman Infaq tetap menampilkan inflow + outflow, tapi datanya dari database bukan localStorage

### 10.5 API Endpoint

Semua endpoint di bawah router `/expenses` — restricted ke admin:

| Method | Path | Deskripsi |
|---|---|---|
| `GET` | `/expenses` | List semua pengeluaran (dengan filter: kategori, tanggal range, search) |
| `POST` | `/expenses` | Buat pengeluaran baru |
| `GET` | `/expenses/{id}` | Detail pengeluaran |
| `PUT` | `/expenses/{id}` | Update pengeluaran (jika belum ada relasi) |
| `DELETE` | `/expenses/{id}` | Hapus pengeluaran |
| `GET` | `/expenses/categories` | List kategori yang tersedia |
| `GET` | `/expenses/report` | Laporan pengeluaran (format: json/pdf/excel) |

### 10.6 Skema Request/Response

```json
POST /expenses
{
    "category": "listrik",
    "description": "Pembayaran tagihan listrik bulan Juli 2026",
    "amount": 1500000.00,
    "expense_date": "2026-07-15",
    "payment_method": "transfer",
    "notes": "ID Pelanggan: 123456789"
}

Response:
{
    "id": 1,
    "category": "listrik",
    "description": "Pembayaran tagihan listrik bulan Juli 2026",
    "amount": 1500000.00,
    "expense_date": "2026-07-15",
    "payment_method": "transfer",
    "created_by": { "id": 1, "full_name": "Admin Sekolah" },
    "created_at": "2026-07-15T10:30:00Z"
}
```

### 10.7 Frontend Pages

**Halaman Baru: `ExpensesPage.tsx`** (di `src/pages/admin/`)

- **List view:** Tabel dengan filter kategori, range tanggal, search
- **Create:** Modal form dengan field: kategori (dropdown), deskripsi, jumlah, tanggal, metode bayar, notes
- **Edit:** Modal form yang sama (pre-filled)
- **Delete:** Konfirmasi sebelum hapus
- **Summary cards:** Total bulan ini, per kategori
- **Export:** Tombol ekspor ke Excel/PDF

**Integrasi Dashboard:**
- Dashboard admin akan menampilkan **total pengeluaran bulan ini**
- **Saldo akhir** = total pemasukan - total pengeluaran

**Integrasi Laporan:**
- Tab baru di halaman ReportsPage: "Laporan Pengeluaran"
- Format: Excel + PDF

### 10.8 Update ke Dashboard Admin

Response `GET /dashboard/admin` perlu ditambah field:

```json
{
    "total_expense_this_month": 5000000.00,
    "net_balance": 15000000.00,
    "expense_breakdown": {
        "listrik": 1500000,
        "sarapan": 2000000,
        "wifi": 500000,
        "osman": 500000,
        "other": 500000
    }
}
```

### 10.9 Migrasi Data Infaq Outflow dari localStorage

1. Buat migration untuk tabel `expenses`
2. Buat endpoint `/expenses/migrate-from-localstorage` untuk import data lama
3. Atau buat API endpoint yang menyimpan outflow langsung ke `expenses` dengan `category='infaq'`
4. Update InfaqPage untuk membaca outflow dari API (bukan localStorage)

---

## 11. Catatan Tambahan & Issues

### 11.1 Gateway Transactions — Migration Hilang

Tabel `gateway_transactions` didefinisikan di `models.py` (baris 344-363) tapi **tidak ada file migration Alembic** untuk tabel ini. 

**Dampak:**
- Di development (SQLite): aman karena `create_all()` jalan otomatis
- Di production (PostgreSQL): tabel ini **tidak akan ada** sampai migration dibuat

**Rekomendasi:** Buat migration baru untuk `gateway_transactions`.

### 11.2 Deprecated Columns

Beberapa kolom di database saat ini sudah deprecated (masih ada untuk backward compatibility):

| Tabel | Kolom Deprecated | Pengganti |
|---|---|---|
| `students` | `academic_year` (varchar) | `academic_year_id` (FK) |
| `students` | `is_active` (boolean) | `status` (enum) |
| `spp_settings` | `academic_year` (varchar) | `academic_year_id` (FK) |
| `bills` | `category` (varchar) | `category_id` (FK) |
| `bills` | `bill_type` (spp/non_spp/event) | `category_id` (FK) |

### 11.3 Email Notification — Belum Ada

PRD-v1 menyebutkan email notification via SMTP/Mailpit. Project saat ini hanya punya WhatsApp Fonnte. Email notification belum diimplementasikan.

### 11.4 File Upload — Tidak Ada

PRD-v1 memiliki flow upload bukti bayar oleh murid. Project saat ini tidak memiliki fitur upload file untuk pembayaran. Jika diperlukan, perlu ditambahkan endpoint upload + kolom `proof_url` di payment.

---

## 12. Kesimpulan & Rekomendasi

### 12.1 Perubahan Fundamental dari PRD-v1

1. **Tech stack:** Laravel PHP → FastAPI Python + React TypeScript
2. **Arsitektur:** Monolitik → REST API + SPA
3. **Database:** 9 tabel → 14 tabel dengan relasi lebih kompleks
4. **Role model:** Admin + Murid → Admin/Superadmin/Wali/Bendahara + Student
5. **SPP:** Tersimpan di tabel → Virtual/computed
6. **Pembayaran:** Upload bukti manual → Gateway otomatis + manual
7. **Real-time:** Pusher (third-party) → SSE (built-in)

### 12.2 Fitur yang Harus Ditambahkan

| Prioritas | Fitur | Estimasi |
|---|---|---|
| 🔴 Tinggi | Manajemen Pengeluaran (tabel `expenses`) | 3-5 hari |
| 🔴 Tinggi | Migration untuk `gateway_transactions` | 0.5 hari |
| 🟡 Sedang | Bersihkan deprecated columns | 1-2 hari |
| 🟢 Rendah | Email notifications | 2-3 hari |
| 🟢 Rendah | Upload bukti pembayaran (opsional) | 2-3 hari |

### 12.3 Catatan Akhir

Project saat ini secara keseluruhan sudah **jauh lebih maju** dari spesifikasi PRD-v1 dalam hal:
- Fitur (lebih banyak: event, infaq, audit, gateway, dll)
- Arsitektur (lebih modern: API + SPA)
- Keamanan (JWT, audit trail)
- Deployment (Docker, Vercel)

Satu fitur PRD-v1 yang hilang (**Manajemen Pengeluaran**) sudah didesain di Bab 10 dan siap diimplementasikan.

---

*Dokumen ini disusun berdasarkan analisis kode terhadap:*
- *`PRD-v.1.md` — spesifikasi awal (Juli 2025)*
- *`backend/` — FastAPI backend (105 endpoint, 14 tabel)*
- *`spp/` — React frontend (14 halaman admin, 5 halaman wali)*
