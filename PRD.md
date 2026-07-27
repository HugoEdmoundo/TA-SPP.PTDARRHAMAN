# Product Requirements Document (PRD)
**Project Name:** TA SPP Payment System & School Management Platform  
**Document Version:** 1.0.0 (Production-Grade Upgrade / B-03 Rewrite)  
**Date:** Juli 2026  
**Target Audience:** Tim Pengembang, Manajemen Sekolah (PT Darrahman), Administrator Keuangan, dan Tim Quality Assurance  

---

## 1. Executive Summary & Product Overview
**TA SPP Payment System** adalah platform manajemen keuangan dan administrasi pendidikan berbasis web yang dirancang untuk mengotomatisasi, mengamankan, dan menyederhanakan alur pembayaran sekolah. Sistem ini mengatasi kelemahan sistem pencatatan manual/konvensional dengan menghadirkan arsitektur modern yang membedakan **Tagihan Rutin SPP** (bersifat *Virtual/Computed* tanpa mengotori tabel tagihan database) dan **Tagihan Non-SPP / Event** (bersifat *Ad-hoc* dan tersimpan dinamis).

Platform ini dilengkapi dengan portal ganda: **Portal Admin/Kasir** untuk pengelolaan manajemen sekolah secara menyeluruh dan **Portal Wali Murid (My Portal)** yang memungkinkan orang tua memantau kewajiban anak, berkontribusi pada event crowdfunding/patungan sekolah, melakukan pembayaran online melalui *Payment Gateway*, serta mengunduh kuitansi resmi bertanda tangan digital/QR Code kapan saja.

---

## 2. Product Goals & Key Performance Indicators (KPIs)
### 2.1. Product Goals
1. **Otomatisasi Kalkulasi SPP:** Menghilangkan kebutuhan generate tagihan statis bulanan untuk ribuan siswa melalui mesin kalkulasi *Virtual SPP Engine* yang mencocokkan riwayat pembayaran dengan *Master SppSetting*.
2. **Fleksibilitas Tagihan Non-SPP:** Memungkinkan admin sekolah membuat jenis tagihan dinamis (seragam, buku, denda, kegiatan) melalui master *Bill Category* tanpa intervensi pengembang/programmer.
3. **Transparansi & Partisipasi Wali Murid:** Memberikan akses real-time kepada wali murid atas rincian tagihan, riwayat pembayaran, dan progres *crowdfunding* event sekolah.
4. **Akuntabilitas & Keamanan Tingkat Tinggi:** Menerapkan sistem *Audit Log* yang mencatat seluruh modifikasi kritis (pembuatan tagihan, pembatalan/void kuitansi, pengaktifan/penonaktifan siswa).
5. **Kesiapan Produksi (Production-Ready):** Mendukung skalabilitas tinggi dengan arsitektur *backend* REST API + Real-Time Server-Sent Events (SSE) serta *frontend* reaktif berkinerja tinggi.

### 2.2. Key Performance Indicators (KPIs)
- **Waktu Pemrosesan Transaksi:** Rekonsiliasi pembayaran kasir atau online gateway selesai dalam waktu < 1 detik.
- **Akurasi Data Keuangan:** 0% selisih (*discrepancy*) antara catatan pembayaran, kuitansi yang diterbitkan, dan laporan arus kas.
- **Waktu Pembangkitan Laporan:** Generate laporan PDF/Excel untuk 500+ siswa selesai dalam waktu < 3 detik.
- **Ketersediaan Sistem (Uptime):** Target availability 99.9% di lingkungan container/cloud.

---

## 3. User Roles & Personas
Sistem ini membagi hak akses pengguna ke dalam 2 peran (*role*) utama yang diverifikasi melalui JWT Bearer Token:

| Peran (Role) | Akses Modul Utama | Tanggung Jawab & Fitur Kunci |
| :--- | :--- | :--- |
| **Administrator (`admin`)** | Seluruh Modul Admin (`/dashboard`, `/students`, `/spp`, `/bills`, `/events`, `/payments`, `/receipts`, `/reports`, `/settings`, `/audit-logs`) | • Manajemen Master Data (Tahun Ajaran, Kategori Tagihan, Profil Sekolah, Rekening Bank)<br>• Manajemen CRUD Siswa & Bulk Import via CSV/Excel<br>• Kasir Penerimaan Pembayaran (Cash, Transfer, Online Gateway)<br>• Penerbitan Tagihan Non-SPP & Manajemen Patungan Event<br>• Manajemen Pembatalan Kuitansi (*Void Receipt*) dengan validasi alasan<br>• Ekspor Laporan Keuangan (JSON, PDF, Excel)<br>• Monitoring Audit Trail & Real-Time SSE |
| **Wali Murid (`wali`)** | Portal Wali (`/my`, `/my/spp`, `/my/events`, `/my/history`, `/my/profile`) | • Monitoring status akademik & keaktifan anak (dukungan *multi-student/siblings*)<br>• Melihat grid status pembayaran SPP per semester (Lunas / Sebagian / Belum Bayar)<br>• Melihat rincian tagihan Non-SPP & berpartisipasi dalam kontribusi Event/Patungan<br>• Melakukan pembayaran online secara mandiri via integrasi Gateway (Midtrans/Xendit/Simulator)<br>• Mengunduh e-Kuitansi resmi dalam format PDF |

---

## 4. Detailed Functional Requirements

### 4.1. Modul 1: Master Data Management (`/settings`)
- **REQ-MD-01 (Master Tahun Ajaran):** Admin dapat membuat, memperbarui, dan menonaktifkan tahun ajaran (contoh: `2025/2026`). Sistem menerapkan mekanisme *Tutup Buku* (jika `is_active = False`, transaksi baru untuk tahun tersebut tidak dapat diproses).
- **REQ-MD-02 (Master Kategori Tagihan):** Admin dapat menambah kategori tagihan dinamis (`code`, `name`, `default_amount`) untuk digunakan pada pembuatan tagihan Non-SPP.
- **REQ-MD-03 (Profil Sekolah):** Sistem menyediakan penyimpanan *key-value* (`SchoolSetting`) untuk menyimpan identitas sekolah (Nama Sekolah, Alamat, Logo URL, Kontak) yang tercetak otomatis di kop kuitansi dan laporan.
- **REQ-MD-04 (Rekening Bank):** Admin dapat mengelola daftar rekening bank resmi sekolah (`BankAccount`) yang akan ditampilkan di portal wali saat memilih metode transfer manual.

### 4.2. Modul 2: Administrasi Siswa & Orang Tua (`/students`, `/users`)
- **REQ-ST-01 (Manajemen Siswa):** Admin dapat melakukan CRUD data siswa (NIS, Nama Lengkap, Gender, Tempat/Tanggal Lahir, Alamat, Foto).
- **REQ-ST-02 (Siklus Hidup Status Siswa):** Sistem menggunakan *Enum Status Siswa* (`active`, `graduated`, `transferred`, `dropout`, `inactive`). Kolom legacy `is_active` dan string `academic_year` disinkronisasi secara otomatis saat operasi simpan untuk kompatibilitas ke belakang (*backward compatibility*).
- **REQ-ST-03 (Bulk Import Siswa):** Admin dapat mengunggah file CSV atau Excel (.xlsx) untuk mengimpor data siswa secara massal. Sistem wajib menyediakan fitur *Preview Validation* sebelum konfirmasi akhir ke database.
- **REQ-ST-04 (Relasi Wali - Siswa):** Admin dapat menghubungkan satu akun Wali (`User`) dengan satu atau lebih Siswa (`Student`) melalui tabel relasi `parent_student` (mendukung sistem kakak-adik).

### 4.3. Modul 3: Mesin Virtual SPP (`/spp`)
- **REQ-SPP-01 (Virtual SPP Engine):** Tagihan SPP bulan 1 hingga 12 **tidak disimpan sebagai baris tabel tagihan**. Status bulanan dihitung secara *real-time* dengan membandingkan akumulasi pembayaran sukses (`Payment` dengan `payment_type="spp"`) terhadap nominal aturan SPP (`SppSetting`).
- **REQ-SPP-02 (Pengaturan SPP):** Admin dapat menetapkan nominal bulanan SPP per tahun ajaran beserta tanggal jatuh tempo (`due_day`).
- **REQ-SPP-03 (SPP Semester Grid):** Sistem menyediakan antarmuka matriks 6 bulanan (Semester 1: Juli–Desember, Semester 2: Januari–Juni) yang memetakan status seluruh siswa aktif (Status: `paid`, `partial`, `unpaid`).

### 4.4. Modul 4: Tagihan Non-SPP & Crowdfunding Event (`/bills`, `/events`)
- **REQ-BILL-01 (Penerbitan Tagihan Non-SPP):** Admin dapat menerbitkan tagihan ad-hoc untuk satu siswa atau masal sekaligus berdasarkan Kategori Tagihan terpilih. Tagihan menyimpan total kewajiban (`amount`), sisa bayar (`remaining_amount`), dan status (`unpaid`, `partial`, `paid`).
- **REQ-EVT-01 (Crowdfunding Event / Patungan):** Admin dapat membuat event kegiatan sekolah (contoh: Study Tour, Renovasi Masjid) dengan target pengumpulan dana (`total_target`), nominal saran per siswa (`per_student_amount`), dan opsi izin cicilan (`allow_installment`).
- **REQ-EVT-02 (Progres Dana Real-Time):** Setiap pembayaran masuk yang terikat dengan event akan otomatis memperbarui akumulasi dana terkumpul (`total_collected`) dan mengubah status event (`draft`, `active`, `completed`, `cancelled`).

### 4.5. Modul 5: Pemrosesan Pembayaran & Gateway Online (`/payments`)
- **REQ-PAY-01 (Terminal Kasir Multi-Metode):** Kasir admin dapat mencatat pembayaran dengan metode `cash` (tunai) atau `transfer` (manual bank), dengan channel `manual` atau `gateway`.
- **REQ-PAY-02 (Dukungan Infaq Sukarela):** Setiap transaksi pembayaran mengizinkan penambahan nominal infaq sukarela (`infaq_amount`), yang dicatat terpisah dalam total pembayaran namun terintegrasi dalam satu kuitansi.
- **REQ-PAY-03 (Integrasi Payment Gateway):** Sistem menyediakan abstraksi checkout untuk payment gateway (`Midtrans`, `Xendit`, dan `Simulator`). Transaksi online dicatat di tabel `gateway_transactions` dengan status awal `pending` dan diperbarui menjadi `paid` melalui آلية callback/webhook atau simulasi konfirmasi.
- **REQ-PAY-04 (Proteksi Overpayment):** Sistem memvalidasi agar total pembayaran yang masuk tidak melebihi sisa kewajiban tagihan (mencegah kelebihan bayar yang tidak valid).

### 4.6. Modul 6: Kuitansi & Audit Log (`/receipts`, `/audit-logs`)
- **REQ-RCT-01 (Penerbitan Kuitansi Otomatis):** Setiap pembayaran sukses menghasilkan kuitansi unik dengan format penomoran standar: `KWT/{YYYY}/{MM}/{SEQUENCE:04d}`.
- **REQ-RCT-02 (Pembangkitan Dokumen PDF):** Menggunakan library `ReportLab`, sistem menghasilkan file PDF kuitansi formal bertanda tangan digital serta QR Code verifikasi.
- **REQ-RCT-03 (Pembatalan / Void Kuitansi):** Admin dapat membatalkan kuitansi (status `is_void = True`) dengan mewajibkan pengisian alasan pembatalan (`void_reason`). Pembatalan kuitansi secara otomatis memverifikasi ulang saldo tagihan siswa yang bersangkutan.
- **REQ-AUD-01 (Audit Trail Terdesentralisasi):** Seluruh aksi penting (Pembuatan Siswa, Modifikasi Tagihan, Pembatalan Kuitansi, Pengaktifan Siswa) otomatis direkam di tabel `audit_logs` (mengandung `user_id`, `action`, `entity_type`, `entity_id`, dan `detail`).

### 4.7. Modul 7: Laporan Keuangan & Dasbor Analitik (`/reports`, `/dashboard`)
- **REQ-REP-01 (Dasbor Eksekutif):** Menampilkan statistik real-time: Total Arus Kas Masuk, Tunggakan SPP, Rasio Kelunasan Tagihan Non-SPP, dan Progres Event.
- **REQ-REP-02 (Laporan Fleksibel Multi-Format):** Admin dapat menyaring laporan berdasarkan Tahun Ajaran, Bulan, Kategori, atau Siswa, dan mengunduhnya dalam format **JSON**, **PDF (ReportLab)**, atau **Excel (.xlsx via OpenPyXL)**.
- **REQ-REP-03 (Laporan Kewajiban Per Siswa):** Menampilkan rekapitulasi lengkap seluruh tagihan SPP, Non-SPP, dan riwayat pembayaran seorang siswa dalam satu lembar kerja laporan terpadu.

### 4.8. Modul 8: Notifikasi Real-Time Server-Sent Events (`/sse`)
- **REQ-SSE-01 (Real-Time UI Synchronizer):** Sistem mengaktifkan kanal SSE pada rute `/sse/events`. Setiap kali transaksi pembayaran baru berhasil dicatat atau kuitansi dibatalkan, server memancarkan event *broadcast* yang memicu frontend (React Query / State) untuk memperbarui tampilan tabel, grid SPP, dan angka dasbor tanpa perlu *refresh* halaman.

---

## 5. Non-Functional Requirements (NFR)
1. **Keamanan (Security):**
   - Autentikasi menggunakan JSON Web Token (JWT) dengan enkripsi rahasia (`HS256`).
   - Kata sandi pengguna disimpan menggunakan fungsi hashing satu arah `bcrypt` via `passlib`.
   - Implementasi spesifik CORS (*Cross-Origin Resource Sharing*) dengan validasi *regex* untuk domain vercel dan localhost.
   - Pencegahan SQL Injection sepenuhnya dijamin melalui penggunaan ORM SQLModel / SQLAlchemy parameterization.
2. **Keandalan & Integritas Data (Reliability & Integrity):**
   - Seluruh mutasi keuangan (pembayaran + kuitansi + audit log) harus dibungkus dalam satu transaksi database atomik (`session.commit()`). Jika salah satu gagal, seluruh transaksi di-*rollback*.
3. **Kinerja & Responsivitas (Performance):**
   - Query database menggunakan *index* pada kolom-kolom pencarian intensif (`nis`, `student_id`, `bill_type`, `status`, `category_id`, `academic_year_id`).
   - Paginasi wajib diterapkan pada endpoint yang mengembalikan daftar data masif (limit maksimal 500 baris per request).
4. **Usability & Aesthetics:**
   - Antarmuka Frontend dibangun dengan prinsip desain modern, mendukung dark mode, micro-animations, serta responsif sempurna di perangkat desktop, tablet, dan ponsel pintar.

---

## 6. Technology Stack & Technical Architecture
- **Backend Framework:** Python 3.12+, FastAPI (ASGI High Performance REST API).
- **Database & ORM:** SQLModel (kombinasi Pydantic + SQLAlchemy 2.0), PostgreSQL (Production) / SQLite (Local Dev).
- **Migration Engine:** Alembic (untuk manajemen skema evolusioner di produksi).
- **Document Generators:** ReportLab (PDF Generating), OpenPyXL (Excel Export/Import), Pillow & QRCode (Image processing).
- **Real-Time Engine:** SSE-Starlette (Server-Sent Events).
- **Frontend Framework:** React 19, TypeScript, Vite, Tailwind CSS, Axios dengan Interceptors (Auth & Error Handling), Recharts (Visualisasi Data), Lucide React (Icons).
- **Containerization:** Docker & Docker Compose (Multi-stage build untuk optimasi ukuran image produksi).

---
*Dokumen ini merupakan acuan spesifikasi fungsional dan produk final yang selaras 100% dengan implementasi kode pada repositori project /TA.*
