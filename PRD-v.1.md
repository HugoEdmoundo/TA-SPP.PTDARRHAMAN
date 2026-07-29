# Product Requirements Document (PRD)

## Aplikasi Manajemen Pembayaran SPP (Sekolah)

**Versi:** 1.0
**Status:** Draft
**Tanggal:** Juli 2025

---

## 1. Ringkasan Eksekutif

Aplikasi Manajemen Pembayaran SPP adalah sistem informasi berbasis web yang digunakan untuk mengelola pembayaran SPP (Sumbangan Pembinaan Pendidikan) dan tagihan lainnya di lingkungan sekolah. Aplikasi ini dikembangkan menggunakan Laravel 12 dengan database MySQL, menyediakan antarmuka terpisah untuk admin sekolah dan murid.

---

## 2. Tujuan dan Sasaran

### 2.1 Tujuan Bisnis
- Digitalisasi pencatatan pembayaran SPP sekolah
- Memudahkan admin dalam mengelola data murid, tagihan, dan pembayaran
- Memberikan transparansi kepada murid mengenai status pembayaran
- Menyediakan laporan keuangan yang akurat dan dapat diekspor

### 2.2 Sasaran
- Mengurangi kesalahan pencatatan manual
- Mempercepat proses verifikasi pembayaran
- Menyediakan riwayat pembayaran yang lengkap
- Memudahkan ekspor data ke format Excel dan PDF

---

## 3. Tech Stack

| Komponen | Teknologi |
|---|---|
| Backend Framework | Laravel 12 (PHP ^8.2) |
| Database | MySQL |
| Frontend | Bootstrap 5, DataTables, custom CSS |
| Build Tool | Vite 5 |
| Real-time | Pusher + Laravel Echo |
| PDF Generation | DomPDF (barryvdh/laravel-dompdf) |
| Excel Export | Maatwebsite/Laravel-Excel |
| QR Code | simplesoftwareio/simple-qrcode |
| Auth API | Laravel Sanctum |
| Email | SMTP/Mailpit |
| Backup | Spatie Laravel Backup |

---

## 4. Arsitektur Sistem

### 4.1 Struktur Aplikasi
- **Monolitik Web App** berbasis Laravel MVC
- Dua role pengguna: **Admin** dan **Murid**
- Middleware pemisah akses: `AdminMiddleware` dan `MuridMiddleware`
- Layout utama: `layouts/app.blade.php` dengan Bootstrap 5

### 4.2 Alur Data Utama
```
Admin buat tagihan → Murid bayar (upload bukti) → Admin verifikasi (approve/reject) → Status diperbarui
```
```
Murid bayar SPP (pilih range bulan) → Upload bukti → Admin approve → Status SPP terupdate
```

### 4.3 Diagram Database (Relasi Antar Model)

```
User (admin/murid)
  ├── Tagihan (1 user memiliki banyak tagihan)
  │     └── Pembayaran (1 tagihan memiliki banyak pembayaran)
  ├── Pembayaran (1 user memiliki banyak pembayaran SPP langsung)
  │     └── Admin (verifikator)
  └── Notification

SppSetting (konfigurasi nominal SPP per bulan)

Pengeluaran (dicatat oleh admin)
```

---

## 5. Fitur-Fitur

### 5.1 Autentikasi
- **Login** menggunakan username dan password
- **Logout**
- Redirect otomatis ke dashboard sesuai role
- Validasi status akun aktif/nonaktif

### 5.2 Role: Admin

#### 5.2.1 Dashboard Admin
- Total murid aktif
- Total tagihan belum dibayar
- Total pembayaran diterima
- Total pengeluaran
- Saldo akhir (pembayaran - pengeluaran)
- Jumlah pembayaran pending

#### 5.2.2 Manajemen Murid (CRUD)
- Lihat daftar murid
- Tambah murid baru (default password: 123456789)
- Edit data murid
- Aktifkan/Nonaktifkan akun murid
- Reset password murid
- Lihat detail tagihan per murid
- Lihat riwayat pembayaran per murid

#### 5.2.3 Manajemen Tagihan
- Lihat daftar tagihan
- Buat tagihan baru (jenis: custom, non-SPP)
- Hapus tagihan (hanya jika belum ada pembayaran)
- Status tagihan: unpaid, pending, success

#### 5.2.4 Manajemen Pembayaran
- Lihat daftar pembayaran pending
- Riwayat pembayaran
- **Approve** pembayaran (dengan opsi jenis bayar: lunas/cicilan)
- **Reject** pembayaran (dengan alasan)
- Lihat detail pembayaran + bukti upload
- **Pembayaran Manual** — admin dapat mencatat pembayaran langsung

#### 5.2.5 Manajemen Pengeluaran
- Kategori: Bayar Listrik, Sarapan, Bayar WiFi, Kebutuhan Osman, Other
- Tambah/edit/hapus pengeluaran
- Tanggal, kategori, keterangan, jumlah

#### 5.2.6 Pengaturan SPP
- Mengubah nominal SPP per bulan
- Masa berlaku pengaturan

#### 5.2.7 Laporan & Ekspor
- Laporan SPP per tahun per murid (per-bulan)
- Laporan tagihan non-SPP
- Laporan pengeluaran
- Ekspor SPP ke Excel & PDF
- Ekspor Tagihan ke Excel & PDF
- Ekspor Pengeluaran ke Excel & PDF

#### 5.2.8 Generate Kuitansi (PDF)
- Cetak kuitansi pembayaran dalam format PDF

#### 5.2.9 Profil Admin
- Edit profil
- Update foto profil

### 5.3 Role: Murid

#### 5.3.1 Dashboard Murid
- Total tagihan (belum + cicilan)
- Total sudah dibayar
- Jumlah tagihan unpaid
- Jumlah pembayaran pending
- Jumlah pembayaran ditolak
- Status SPP tahun berjalan (12 bulan)
- Tagihan terbaru
- Riwayat pembayaran terbaru

#### 5.3.2 Pembayaran SPP
- Pilih range bulan (mulai - akhir) untuk dibayar
- Sistem validasi: cek bulan yang sudah dibayar
- Cicilan SPP: bayar sebagian dari total
- Upload bukti pembayaran (file gambar)
- Keterangan tambahan

#### 5.3.3 Pembayaran Tagihan
- Lihat daftar tagihan biasa (non-SPP)
- Bayar tagihan (cicilan diperbolehkan)
- Minimal pembayaran: 10% dari sisa atau Rp 1.000
- Upload bukti pembayaran
- Upload ulang jika ditolak

#### 5.3.4 Riwayat Pembayaran
- Riwayat lengkap pembayaran yang sudah dilakukan
- Status: pending, accepted (lunas), rejected (ditolak)
- Detail pembayaran + bukti

#### 5.3.5 Rekap SPP
- Status SPP per bulan untuk tahun tertentu
- Detail cicilan jika ada

#### 5.3.6 Kuitansi
- Download/print kuitansi PDF

#### 5.3.7 Laporan Murid
- Lihat laporan pembayaran sendiri
- Ekspor laporan

#### 5.3.8 Profil
- Edit profil
- Update foto

### 5.4 Notifikasi
- **In-App Notification** via database (model Notification)
- **Real-time** via Pusher
- **Email** notification saat:
  - Pembayaran dibuat
  - Status pembayaran diupdate (accepted/rejected)

### 5.5 Events
- `PembayaranDibuat` — triggered saat murid upload bukti
- `PembayaranManualDibuat` — triggered saat admin buat pembayaran manual
- `StatusPembayaranDiupdate` — triggered saat admin approve/reject

---

## 6. Struktur Database

### 6.1 Tabel: `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint (PK) | |
| role | enum('admin','murid') | Default: murid |
| nama | varchar(100) | |
| email | varchar(100) | Unique |
| username | varchar(50) | Unique |
| password | varchar (hashed) | |
| nip | varchar(30) | Nullable (NIS/NIP) |
| foto | varchar | Nullable |
| aktif | boolean | Default: true |
| timestamps | | created_at, updated_at |

### 6.2 Tabel: `spp_settings`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint (PK) | |
| nominal | decimal(12,2) | Nominal SPP per bulan |
| berlaku_mulai | date | |
| timestamps | | |

### 6.3 Tabel: `tagihans`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint (PK) | |
| user_id | bigint (FK→users) | |
| jenis | enum('spp','custom') | |
| keterangan | varchar | Nullable |
| jumlah | decimal(12,2) | |
| status | enum('unpaid','pending','success','rejected') | |
| timestamps | | |

### 6.4 Tabel: `pembayarans`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint (PK) | |
| tagihan_id | bigint (FK→tagihans) | Nullable (untuk SPP murni) |
| user_id | bigint (FK→users) | |
| admin_id | bigint (FK→users) | Nullable (verifikator) |
| metode | varchar(50) | Nullable |
| bukti | varchar | Path file bukti |
| jumlah | decimal(12,2) | |
| status | enum('pending','accepted','rejected') | |
| alasan_reject | text | Nullable |
| keterangan | text | Nullable |
| jenis_bayar | enum('lunas','cicilan') | Nullable |
| tahun | integer | Nullable |
| bulan_mulai | integer | Nullable (1-12) |
| bulan_akhir | integer | Nullable (1-12) |
| tanggal_upload | timestamp | |
| tanggal_bayar | timestamp | Nullable |
| tanggal_proses | timestamp | Nullable (saat diverifikasi) |
| catatan_admin | text | Nullable |
| timestamps | | |

### 6.5 Tabel: `pengeluaran`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint (PK) | |
| kategori | varchar | |
| keterangan | varchar | |
| jumlah | decimal(12,2) | |
| tanggal | date | |
| admin_id | bigint (FK→users) | |
| timestamps | | |

### 6.6 Tabel: `notifications`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint (PK) | |
| user_id | bigint (FK→users) | |
| type | varchar | |
| title | varchar | |
| message | text | |
| data | json/text | Nullable |
| read_at | timestamp | Nullable |
| related_type | varchar | Nullable (polymorphic) |
| related_id | bigint | Nullable |
| timestamps | | |

---

## 7. Aturan Bisnis

1. **SPP per bulan**: Nominal ditentukan via `spp_settings`, bisa diubah kapan saja
2. **Pembayaran SPP** bisa dilakukan untuk range beberapa bulan sekaligus
3. **Cicilan SPP**: Murid bisa membayar sebagian dari total tagihan SPP
4. **Validasi SPP**: Sistem otomatis cek bulan yang sudah dibayar sebelum memproses pembayaran baru
5. **Default password murid**: `123456789` saat pertama dibuat
6. **Tagihan non-SPP** bisa dicicil dengan minimal 10% dari sisa tagihan
7. **Pembayaran** harus diverifikasi (approve/reject) oleh admin
8. **Murid nonaktif** tidak bisa login ke sistem
9. **Penghapusan tagihan** hanya bisa jika belum ada pembayaran terkait

---

## 8. Hak Akses

| Fitur | Admin | Murid |
|---|---|---|
| Dashboard | ✅ | ✅ |
| Manajemen Murid | ✅ | ❌ |
| Manajemen Tagihan (buat) | ✅ | ❌ |
| Bayar Tagihan | ❌ | ✅ |
| Bayar SPP | ❌ | ✅ |
| Verifikasi Pembayaran | ✅ | ❌ |
| Pembayaran Manual | ✅ | ❌ |
| Manajemen Pengeluaran | ✅ | ❌ |
| Pengaturan SPP | ✅ | ❌ |
| Laporan & Ekspor | ✅ | ✅ (terbatas) |
| Cetak Kuitansi | ✅ | ✅ |
| Profil | ✅ | ✅ |

---

## 9. Mockup / Antarmuka (Ringkasan)

### 9.1 Halaman Login
- Form login dengan username & password
- Redirect ke dashboard sesuai role

### 9.2 Dashboard Admin
- 5 kartu statistik (total murid, total tagihan, total pembayaran, total pengeluaran, saldo akhir)
- Tabel pembayaran pending terbaru

### 9.3 Dashboard Murid
- Kartu statistik (total tagihan, total dibayar)
- Status SPP tahun berjalan (grid 12 bulan)
- Tagihan belum bayar
- Riwayat pembayaran terbaru

### 9.4 Layout Umum
- Sidebar navigasi (berbeda untuk admin/murid)
- Header dengan notifikasi
- Footer
- Tema warna hijau (primary: #1E8449)

---

## 10. Rute API / Endpoint

### 10.1 Web Routes (halaman)

Semua rute didefinisikan di `routes/web.php`:

**Auth:**
- `GET /` — Halaman login
- `POST /` — Proses login
- `POST /logout` — Logout

**Admin (prefix: `/admin`, middleware: auth + admin):**
- Dashboard, CRUD murid, CRUD tagihan, CRUD pengeluaran
- Manajemen pembayaran (index, approve, reject, manual)
- Pengaturan SPP, Profil
- Laporan & ekspor (Excel/PDF)
- Generate kuitansi PDF

**Murid (prefix: `/murid`, middleware: auth + murid):**
- Dashboard, lihat tagihan, bayar SPP
- Upload bukti, upload ulang
- Riwayat pembayaran, rekap SPP
- Kuitansi PDF, laporan, profil

### 10.2 API Routes
- `GET /api/user` — Data user (auth:sanctum)
- `GET /validate-spp` — Validasi pembayaran SPP

---

## 11. Milestone

| Fase | Fitur | Status |
|---|---|---|
| Fase 1 | Autentikasi & Role Management | ✅ Selesai |
| Fase 2 | Manajemen Murid | ✅ Selesai |
| Fase 3 | Manajemen Tagihan & Pembayaran SPP | ✅ Selesai |
| Fase 4 | Verifikasi Pembayaran (approve/reject) | ✅ Selesai |
| Fase 5 | Manajemen Pengeluaran | ✅ Selesai |
| Fase 6 | Laporan & Ekspor (Excel/PDF) | ✅ Selesai |
| Fase 7 | Notifikasi (real-time + email) | ✅ Selesai |
| Fase 8 | Cetak Kuitansi PDF | ✅ Selesai |
| Fase 9 | Pengaturan SPP & Profil | ✅ Selesai |
| Fase 10 | Cicilan SPP & Tagihan | ✅ Selesai |

---

## 12. Batasan (Constraints)

- Default password untuk murid baru adalah `123456789` (hardcoded)
- Range tahun yang didukung: 2024 - 2030
- SPP hanya mendukung perhitungan per-bulan dalam satu tahun kalender
- Pembayaran SPP murni dipisahkan dari tagihan (NULL tagihan_id)
- Export PDF menggunakan DomPDF (tidak mendukung styling CSS kompleks)
- Tidak ada fitur payment gateway otomatis (mengandalkan upload bukti manual)

---

## 13. Metrik Kesuksesan

- Semua pembayaran SPP tercatat secara digital
- Murid dapat melihat status pembayaran secara real-time
- Admin dapat memverifikasi pembayaran dengan cepat
- Laporan keuangan dapat diekspor kapan saja
- Riwayat pembayaran tersimpan lengkap dan dapat diaudit
