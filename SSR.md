# System Specification Report (SSR) / Software System Requirements
**Project Name:** TA SPP Payment System & School Management Platform  
**Document Type:** System Specification Report (SSR) / Technical Architecture Document  
**Version:** 1.0.0 (Production-Grade Upgrade)  
**Date:** Juli 2026  

---

## 1. System Architecture & Topology
Sistem TA SPP dirancang menggunakan arsitektur **3-Tier Distributed Client-Server** dengan pola *decoupled* antara *Frontend Single Page Application* (SPA) dan *Backend REST API + Real-Time Streaming Server*.

```
+-----------------------------------------------------------------------------------+
|                                CLIENT LAYER (Browser)                             |
|  +-------------------------------------+   +-----------------------------------+  |
|  |     Admin / Kasir Portal (Vite)     |   |    Wali Murid My Portal (Vite)    |  |
|  |  React 19 + TS + Tailwind + Recharts|   | React 19 + TS + Tailwind + Axios  |  |
|  +------------------+------------------+   +-----------------+-----------------+  |
+---------------------|----------------------------------------|--------------------+
                      | [HTTP REST API / JSON]                 | [HTTP REST API / JSON]
                      | [SSE Real-Time Stream]                 | [Payment Checkout Redirect]
+---------------------v----------------------------------------v--------------------+
|                      API GATEWAY / REVERSE PROXY LAYER                            |
|                 Nginx Web Server / Docker Container Port Mapping                  |
+-------------------------------------+---------------------------------------------+
                                      |
+-------------------------------------v---------------------------------------------+
|                           APPLICATION LAYER (FastAPI)                             |
|  +-----------------------------------------------------------------------------+  |
|  | uvicorn (ASGI Engine) + FastAPI REST Router + SSE-Starlette Real-Time Engine |  |
|  +-----------------------------------------------------------------------------+  |
|  | Core Services: SPP Engine | Bills Engine | Payment Gateway | Receipt Engine |  |
|  | Security: OAuth2 Bearer JWT Auth | Passlib Bcrypt | CORS Middleware         |  |
|  | PDF/Excel Generators: ReportLab (PDF Kuitansi) | OpenPyXL (Excel Reports)   |  |
|  +-------------------------------------+---------------------------------------+  |
+----------------------------------------|------------------------------------------+
                                         | [SQLModel / SQLAlchemy ORM (TCP/IP)]
+----------------------------------------v------------------------------------------+
|                             DATA LAYER (Database Engine)                          |
|  +-----------------------------------------------------------------------------+  |
|  |      Production: PostgreSQL 16+ (Relational Database with Alembic Migrations)   |  |
|  |      Development / Container Dev: SQLite 3 (Automatic Metadata Create)      |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Database Schema Specifications & Entity Relationship Diagram (ERD)
Sistem menggunakan ORM **SQLModel** (menggabungkan Pydantic untuk validasi skema dan SQLAlchemy 2.0 untuk pemodelan relasional).

### 2.1. Tabel Master & Konfigurasi
#### 1. `academic_years` (Master Tahun Ajaran)
| Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | PK, Auto Increment | Identitas unik tahun ajaran |
| `name` | `String(20)` | Unique, Indexed, Not Null | Nama tahun ajaran (e.g., `"2025/2026"`) |
| `start_date` / `end_date` | `Date` | Nullable | Rentang tanggal kalender tahun ajaran |
| `is_active` | `Boolean` | Default: `True` | `False` menandakan status tutup buku |
| `created_at` | `DateTime` | Default: `utcnow()` | Waktu pembuatan record |

#### 2. `bill_categories` (Master Kategori Tagihan)
| Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | PK, Auto Increment | Identitas unik kategori |
| `code` | `String(30)` | Unique, Indexed, Not Null | Kode sistem (e.g., `"seragam"`, `"denda"`) |
| `name` | `String(100)` | Not Null | Nama publik (e.g., `"Seragam Sekolah"`) |
| `default_amount` | `Decimal(12,2)` | Nullable | Nominal default saat pembuatan tagihan |
| `is_active` | `Boolean` | Default: `True` | Status keaktifan kategori |

#### 3. `school_settings` & `bank_accounts`
- **`school_settings`**: Key-value store (`key: String(100) UNIQUE`, `value: String`) untuk informasi profil sekolah, logo, dan parameter cetak kuitansi.
- **`bank_accounts`**: Menyimpan rekening bank sekolah (`bank_name`, `account_number`, `account_holder`, `is_active`) untuk instruksi transfer pembayaran manual.

### 2.2. Tabel Pengguna & Entitas Utama
#### 4. `users` & 5. `parent_student` (Relasi Wali-Siswa)
- **`users`**: Akun pengguna sistem. Kolom: `id (PK)`, `username (UNIQUE)`, `email`, `hashed_password`, `full_name`, `phone`, `role (String: 'admin' / 'wali')`, `is_active (Boolean)`.
- **`parent_student`**: Tabel *Many-to-Many* penghubung akun Wali dengan Siswa. Kolom: `id (PK)`, `parent_id (FK -> users.id)`, `student_id (FK -> students.id)`.

#### 6. `students` (Data Induk Siswa)
| Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | PK, Auto Increment | Identitas unik siswa |
| `nis` | `String(20)` | Unique, Indexed, Not Null | Nomor Induk Siswa |
| `full_name` | `String(100)` | Not Null | Nama lengkap siswa |
| `gender`, `birth_place`, `birth_date`, `address`, `phone`, `photo_url` | Varied | Nullable | Informasi biodata siswa |
| `academic_year_id` | `Integer` | FK -> `academic_years.id`, Indexed | Referensi relasional ke tahun ajaran |
| `academic_year` | `String(10)` | Nullable | *Deprecated (Legacy string field)*, disinkronisasi otomatis |
| `status` | `Enum(StudentStatus)` | Indexed, Default: `'active'` | Nilai: `active`, `graduated`, `transferred`, `dropout`, `inactive` |
| `is_active` | `Boolean` | Default: `True` | *Deprecated*, disinkronisasi dengan kolom `status` |

### 2.3. Tabel Mesin Keuangan & Transaksi
#### 7. `spp_settings` (Aturan Nominal SPP)
Menyimpan nominal aturan SPP bulanan. Kolom: `id (PK)`, `monthly_nominal (Decimal(12,2))`, `due_day (Integer: default 10)`, `academic_year_id (FK -> academic_years.id)`, `effective_from`, `effective_to`, `is_active`.

#### 8. `events` (Crowdfunding & Patungan)
Menyimpan data kegiatan sekolah. Kolom: `id (PK)`, `name`, `description`, `per_student_amount (Decimal)`, `total_target (Decimal)`, `total_collected (Decimal)`, `status (Enum: draft/active/completed/cancelled)`, `deadline (Date)`, `allow_installment (Boolean)`, `min_installment_amount (Decimal)`.

#### 9. `bills` (Tagihan Non-SPP & Event)
*Catatan Kritis: Tagihan SPP bersifat VIRTUAL dan TIDAK disimpan dalam tabel ini.*
| Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | PK, Auto Increment | Identitas unik tagihan |
| `student_id` | `Integer` | FK -> `students.id`, Indexed | Siswa pemilik kewajiban |
| `category_id` | `Integer` | FK -> `bill_categories.id`, Indexed | Kategori tagihan |
| `bill_type` | `Enum(BillType)` | Indexed | Nilai: `non_spp`, `event` |
| `label`, `description`, `attachment_url`, `notes` | `String` / `Text` | Varied | Rincian keterangan tagihan |
| `amount` | `Decimal(12,2)` | Not Null | Total kewajiban bayar |
| `total_paid` | `Decimal(12,2)` | Default: `0` | Akumulasi pembayaran yang masuk |
| `status` | `Enum(BillStatus)` | Indexed, Default: `'unpaid'` | Nilai: `unpaid`, `partial`, `paid` |
| `due_date` | `Date` | Nullable | Tanggal batas waktu pembayaran |
| `event_id` | `Integer` | FK -> `events.id`, Nullable | Terisi jika terkait dengan event |

#### 10. `payments` (Catatan Pembayaran / Cicilan)
| Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | PK, Auto Increment | Identitas transaksi pembayaran |
| `student_id` | `Integer` | FK -> `students.id`, Indexed | Siswa yang dibayarkan |
| `bill_id` | `Integer` | FK -> `bills.id`, Nullable | Null jika pembayaran untuk SPP |
| `payment_type` | `Enum(PaymentType)` | Indexed | Nilai: `spp`, `non_spp`, `event` |
| `spp_month` / `spp_year` | `Integer` | Nullable | Terisi jika `payment_type == 'spp'` (Bulan 1-12) |
| `amount` / `infaq_amount` / `total_amount` | `Decimal(12,2)` | Not Null | `total_amount = amount + infaq_amount` |
| `method` / `channel` / `status` | `Enum` | Indexed | Method: `cash`/`transfer`; Channel: `manual`/`gateway` |
| `gateway_transaction_id` | `String(100)` | Nullable | ID referensi ke transaksi online |
| `created_by` | `Integer` | FK -> `users.id`, Nullable | ID Admin kasir yang mencatat |

#### 11. `receipts`, 12. `gateway_transactions`, & 13. `audit_logs`
- **`receipts`**: Kuitansi resmi pembayaran. Kolom: `id (PK)`, `payment_id (FK -> payments.id UNIQUE)`, `receipt_number (UNIQUE: KWT/YYYY/MM/XXXX)`, `pdf_url`, `is_void (Boolean: default False)`, `void_reason`, `voided_by (FK -> users.id)`, `voided_at`.
- **`gateway_transactions`**: Tracking sesi checkout payment gateway. Kolom: `id (PK)`, `transaction_id (UNIQUE: TRX-YYYYMMDD-XXXX)`, `student_id (FK)`, `gateway_name (midtrans/xendit/simulator)`, `checkout_url`, `total_amount`, `infaq_amount`, `items_json`, `status (pending/success/failed/expired)`.
- **`audit_logs`**: Log keamanan sistem. Kolom: `id (PK)`, `user_id (FK -> users.id)`, `action (String: CREATE_STUDENT, VOID_RECEIPT, dll)`, `entity_type`, `entity_id`, `detail`, `ip_address`, `created_at`.

---

## 3. REST API Endpoint Specifications

### 3.1. Authentication & Users (`/auth`, `/users`)
- `POST /auth/login`: Autentikasi username/password, menghasilkan JWT Bearer Token (`access_token`, `token_type`, `role`).
- `GET /auth/me`: Mengembalikan data profil pengguna yang sedang login beserta daftar hak akses.
- `GET /users/`, `POST /users/`, `PUT /users/{id}`, `DELETE /users/{id}`: CRUD manajemen akun admin dan wali murid.

### 3.2. Master Data Settings (`/settings`, `/academic-years`, `/bill-categories`)
- `GET|POST|PUT|DELETE /settings/academic-years`: Manajemen master tahun ajaran (dilengkapi rute alias `/api/v1/settings/academic-years`).
- `GET|POST|PUT|DELETE /settings/bill-categories`: Manajemen master kategori tagihan (dilengkapi rute alias `/api/v1/settings/bill-categories`).
- `GET|PUT /settings/school-profile`: Membaca dan memperbarui identitas dan logo sekolah.
- `GET|POST|PUT|DELETE /settings/bank-accounts`: Manajemen rekening bank resmi sekolah.

### 3.3. Students Administration (`/students`)
- `GET /students/`: Mengambil daftar siswa dengan dukungan filter `search`, `academic_year_id`, `status`, `is_active`, serta paginasi (`skip`, `limit`).
- `POST /students/`, `PUT /students/{id}`: Membuat atau mengubah data siswa (sinkronisasi otomatis `academic_year` ↔ `academic_year_id`).
- `DELETE /students/{id}`, `PUT /students/{id}/activate`: Menonaktifkan (soft delete) atau mengaktifkan kembali siswa.
- `POST /students/import/preview`, `POST /students/import/confirm`: Alur verifikasi 2 tahap untuk import siswa via CSV/Excel.
- `POST /students/parents/link`, `DELETE /students/parents/link`: Menghubungkan atau memutuskan tautan antara akun Wali dan Siswa.

### 3.4. SPP & Non-SPP Bills Engine (`/spp`, `/bills`)
- `GET /spp/status?student_id={id}&year={yyyy}`: Menghitung status pembayaran SPP virtual untuk bulan 1–12.
- `GET /spp/grid?year={yyyy}&semester={1|2}`: Menghasilkan matriks status SPP seluruh siswa untuk semester terpilih.
- `GET /spp/settings`, `POST /spp/settings`: Pengaturan nominal SPP per tahun ajaran.
- `GET /bills/non-spp`: Daftar tagihan Non-SPP dengan filter `status`, `student_id`, `category_id`, dan `search`.
- `POST /bills/non-spp`: Penerbitan tagihan Non-SPP tunggal atau masal (*bulk issuance*) ke banyak siswa.
- `PUT /bills/non-spp/{id}`: Mengubah tagihan (hanya diizinkan untuk tagihan dengan status `unpaid` dan belum ada cicilan masuk).

### 3.5. Events Crowdfunding (`/events`)
- `GET /events/`, `POST /events/`, `GET /events/{id}`, `PUT /events/{id}`, `DELETE /events/{id}`: Manajemen siklus hidup event crowdfunding sekolah.
- `GET /events/{id}/students`: Daftar status kontribusi/patungan masing-masing siswa pada suatu event.

### 3.6. Payments, Receipts & Audit Trail (`/payments`, `/receipts`, `/audit-logs`)
- `POST /payments/`: Terminal kasir untuk mencatat pembayaran SPP, Non-SPP, atau Event secara tunai/transfer manual.
- `POST /payments/gateway/checkout`: Memulai sesi pembayaran online gateway (menghasilkan `checkout_url` & `transaction_id`).
- `POST /payments/gateway/callback`: Endpoint Webhook untuk menerima notifikasi konfirmasi pembayaran dari Midtrans/Xendit/Simulator.
- `GET /receipts/{receipt_number}/pdf`: Pembangkitan dan pengunduhan dokumen Kuitansi PDF resmi ber-QR Code.
- `POST /receipts/{id}/void`: Membatalkan kuitansi beserta otomatisasi re-kalkulasi sisa tagihan dan pencatatan audit.
- `GET /audit-logs/`: Menampilkan daftar riwayat jejak audit sistem dengan filter pengguna, aksi, dan rentang waktu.

### 3.7. Financial Reports & Dashboard Analytics (`/reports`, `/dashboard`)
- `GET /dashboard/stats`: Mengembalikan matriks KPI keuangan sekolah secara real-time.
- `GET /reports/export?format={json|pdf|excel}&year={yyyy}&month={mm}&type={type}`: Ekspor laporan keuangan konsolidasi.
- `GET /reports/student/{student_id}?format={json|pdf|excel}`: Ekspor buku besar / riwayat kewajiban finansial individual siswa.

### 3.8. Portal Wali & Real-Time SSE (`/my`, `/sse`)
- `GET /my/children`: Daftar siswa yang terikat dengan akun Wali yang sedang login.
- `GET /my/spp`, `GET /my/bills`, `GET /my/events`, `GET /my/history`: Akses read-only ke data keuangan anak bagi Wali Murid.
- `GET /sse/events`: Kanal stream real-time berbasis Server-Sent Events untuk sinkronisasi UI admin dan wali murid.

---

## 4. Security, Authentication & Authorization Protocols
1. **Pola Autentikasi JWT Bearer:** Seluruh request ke endpoint terlindungi wajib menyertakan header `Authorization: Bearer <access_token>`. Token ditandatangani menggunakan algoritma `HS256`.
2. **Role-Based Access Control (RBAC):**
   - Dependency `require_admin`: Memastikan `user.role == 'admin'`. Mencegah akun Wali mengakses modul administrasi, kasir, laporan, dan pengaturan.
   - Dependency `require_wali`: Memperbolehkan akun Wali untuk melihat data, dengan proteksi ketat pada tingkat baris data (*Row-Level Security / Ownership Check*) di mana Wali hanya diperbolehkan mengambil data siswa yang terdaftar pada tabel `parent_student` miliknya.
3. **Password Security:** Seluruh kata sandi di-hash menggunakan algoritma `bcrypt` dengan parameter salt dinamis sebelum disimpan ke database.

---

## 5. System Environment & Configuration Specifications

### 5.1. Backend Environment Variables (`backend/.env`)
```ini
# Database Connection String
DATABASE_URL=sqlite:///./ta_spp.db
# Untuk Production PostgreSQL:
# DATABASE_URL=postgresql://postgres:password@db:5432/ta_spp

# Security & JWT Token
SECRET_KEY=super-secret-key-for-jwt-signing-production-grade
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# File Storage Configuration
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=5
```

### 5.2. Frontend Environment Variables (`spp/.env`)
```ini
# Base URL API Gateway / Backend REST API
VITE_API_URL=http://localhost:8000
# Pada lingkungan Docker/Production dengan Reverse Proxy:
# VITE_API_URL=/api
```

---

## 6. Containerization & Deployment Specifications (Docker Setup)
Sistem dikonfigurasi menggunakan standar **Docker Multi-Stage Build** dan dikoordinasikan melalui `docker-compose.yml` pada direktori akar `/TA`:
1. **Layanan Backend (`backend` service):**
   - Dibangun menggunakan base image `python:3.12-slim`.
   - Menjalankan server asinkron `uvicorn main:app --host 0.0.0.0 --port 8000`.
   - Memasang *volume persistence* pada `./backend/uploads` (untuk menyimpan foto siswa, kuitansi, dan lampiran) serta `./backend/ta_spp.db` (untuk penyimpanan SQLite default jika tidak menggunakan kontainer PostgreSQL terpisah).
2. **Layanan Frontend (`frontend` service):**
   - **Stage 1 (Builder):** Menggunakan `node:20-alpine`, menjalankan kompilasi TypeScript (`tsc -b`) dan optimasi bundel Vite (`vite build`).
   - **Stage 2 (Production Server):** Menggunakan `nginx:alpine` super ringan untuk menyajikan berkas statis hasil build (`/dist`) pada port `80` (dimapping ke port host `3000`), dilengkapi konfigurasi fallback routing `try_files` untuk mendukung React Router SPA.
3. **Isolasi Jaringan (`ta_network`):** Seluruh layanan terhubung dalam jaringan bridge internal Docker, memungkinkan komunikasi antar-kontainer yang aman dan cepat.
