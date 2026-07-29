# PERANCANGAN ULANG SISTEM SUMBANGAN PEMBINAAN PENDIDIKAN (SPP) PTDARRAHMAN

**Usulan Judul Tugas Akhir:**  
Perancangan Ulang Sistem Sumbangan Pembinaan Pendidikan (SPP) PTDARRAHMAN

---

## BAB 1: PENDAHULUAN

### 1.1 Latar Belakang

Perkembangan teknologi informasi telah mendorong transformasi digital di berbagai sektor, termasuk dunia pendidikan. Salah satu aspek penting dalam administrasi sekolah adalah pengelolaan pembayaran Sumbangan Pembinaan Pendidikan (SPP) dan tagihan-tagihan lainnya. Sistem pencatatan manual yang masih digunakan di banyak lembaga pendidikan seringkali menimbulkan berbagai permasalahan seperti kesalahan pencatatan, keterlambatan verifikasi, kurangnya transparansi bagi wali murid, serta sultinya pelacakan riwayat pembayaran secara akurat.

PTDARRAHMAN sebagai lembaga pendidikan membutuhkan sistem informasi yang mampu mengelola pembayaran SPP, tagihan non-SPP, event/patungan sekolah, serta pencatatan infaq secara terintegrasi. Sistem yang ada sebelumnya dirancang menggunakan teknologi Laravel 12 dengan pendekatan monolitik dan Bootstrap 5 untuk antarmuka pengguna. Seiring dengan bertambahnya kebutuhan dan kompleksitas bisnis, sistem tersebut mengalami berbagai keterbatasan dalam hal skalabilitas, fleksibilitas, dan kemudahan pemeliharaan.

Oleh karena itu, dilakukan perancangan ulang sistem menggunakan arsitektur yang lebih modern dengan pemisahan backend dan frontend (REST API + SPA). Backend dikembangkan menggunakan FastAPI (Python) yang dikenal dengan performa tinggi dan dokumentasi API otomatis, sementara frontend dibangun dengan React 19 dan TypeScript untuk memberikan pengalaman pengguna yang responsif dan interaktif. Database menggunakan PostgreSQL untuk keandalan dan skalabilitas data. Sistem baru ini juga mengintegrasikan payment gateway untuk pembayaran online, notifikasi real-time via Server-Sent Events (SSE), serta fitur-fitur tambahan seperti manajemen event, tracking infaq, dan audit trail yang tidak tersedia pada sistem sebelumnya.

### 1.2 Rumusan Masalah

Berdasarkan latar belakang di atas, rumusan masalah dalam tugas akhir ini adalah:

1. Bagaimana merancang ulang sistem pembayaran SPP PTDARRAHMAN yang sebelumnya berbasis Laravel monolitik menjadi arsitektur REST API dengan frontend terpisah?
2. Bagaimana mengimplementasikan sistem pembayaran SPP virtual yang tidak memerlukan pembuatan tagihan statis per bulan, melainkan dikalkulasi secara otomatis berdasarkan riwayat pembayaran?
3. Bagaimana mengintegrasikan payment gateway untuk memungkinkan pembayaran online oleh wali murid serta pencatatan pembayaran manual oleh admin?
4. Bagaimana merancang sistem notifikasi real-time dan manajemen event/patungan sekolah yang terintegrasi dengan pembayaran?
5. Bagaimana mengimplementasikan fitur manajemen pengeluaran, tracking infaq, dan audit trail untuk mendukung transparansi keuangan sekolah?

### 1.3 Batasan Masalah

Batasan masalah dalam tugas akhir ini adalah sebagai berikut:

1. Sistem dirancang khusus untuk kebutuhan PTDARRAHMAN dan tidak bersifat umum untuk semua lembaga pendidikan.
2. Role pengguna terbatas pada Admin, Superadmin, Wali (orang tua/wali murid), dan Bendahara. Tidak terdapat role Murid yang login langsung ke sistem.
3. Pembayaran online menggunakan payment gateway simulator (Midtrans/Xendit/Simulator) dan tidak membahas implementasi teknis kerjasama dengan penyedia jasa pembayaran secara langsung.
4. Range tahun akademik yang didukung adalah 2024 hingga 2030.
5. SPP hanya mendukung perhitungan per-bulan dalam satu tahun kalender.
6. Notifikasi eksternal terbatas pada WhatsApp Fonnte, sementara email notification tidak diimplementasikan.
7. Sistem tidak membahas integrasi dengan sistem akademik lain yang mungkin sudah ada di PTDARRAHMAN.
8. Pengujian sistem difokuskan pada fungsionalitas dan tidak mencakup pengujian keamanan secara mendalam (penetration testing).

### 1.4 Tujuan & Manfaat

#### 1.4.1 Tujuan

Tujuan dari tugas akhir ini adalah:

1. Menghasilkan sistem informasi pembayaran SPP berbasis web dengan arsitektur REST API (FastAPI) dan SPA (React 19) yang menggantikan sistem monolitik sebelumnya.
2. Mengimplementasikan Virtual SPP Engine yang mampu menghitung status pembayaran SPP per bulan secara otomatis tanpa penyimpanan tagihan statis.
3. Mengintegrasikan payment gateway untuk pembayaran online serta menyediakan fitur pembayaran manual oleh admin.
4. Menyediakan portal wali murid yang memungkinkan pemantauan tagihan, pembayaran, dan unduh kuitansi secara mandiri.
5. Mengimplementasikan fitur manajemen pengeluaran, pencatatan infaq, manajemen event/patungan, serta audit trail untuk mendukung tata kelola keuangan yang transparan.

#### 1.4.2 Manfaat

Manfaat dari tugas akhir ini adalah:

1. **Bagi Sekolah (PTDARRAHMAN):**
   - Digitalisasi pencatatan pembayaran SPP yang akurat dan real-time.
   - Mengurangi kesalahan pencatatan manual dan mempercepat proses verifikasi.
   - Menyediakan laporan keuangan yang komprehensif dan dapat diekspor ke Excel/PDF.
   - Meningkatkan transparansi keuangan melalui audit trail.

2. **Bagi Wali Murid:**
   - Memantau status pembayaran SPP dan tagihan lainnya secara real-time.
   - Melakukan pembayaran online melalui payment gateway.
   - Mengunduh kuitansi digital kapan saja.
   - Melihat riwayat pembayaran yang lengkap.

3. **Bagi Admin Sekolah:**
   - Mengelola data siswa, tagihan, dan pembayaran dalam satu platform terintegrasi.
   - Mencatat pembayaran manual dengan cepat.
   - Memantau progres event/patungan sekolah.
   - Mengelola pengeluaran dan kas infaq secara digital.

---

### 1.5 Metode Pengembangan Sistem

Metode pengembangan yang digunakan dalam perancangan ulang sistem ini adalah **Extreme Programming (XP)** dengan pendekatan iteratif dan berorientasi pada kualitas kode.

#### Tahapan Pengembangan:

1. **Planning** — Identifikasi kebutuhan berdasarkan sistem sebelumnya (PRD-v1) dan kebutuhan baru, menyusun prioritas fitur.
2. **Design** — Perancangan arsitektur REST API, desain database menggunakan SQLModel, perancangan antarmuka React.
3. **Coding** — Implementasi backend dengan FastAPI dan frontend dengan React + TypeScript, menerapkan prinsip clean code dan test-driven development.
4. **Testing** — Pengujian API endpoint, validasi alur bisnis, pengujian integrasi frontend-backend.
5. **Deployment** — Deployment ke Vercel dengan container Docker.

#### Algoritma yang Digunakan:

1. **Virtual SPP Engine** — Algoritma kalkulasi status SPP per bulan yang mencocokkan total pembayaran sukses dengan nominal SPP setting tanpa menyimpan tagihan statis.
2. **Installment/Payment Allocation** — Algoritma alokasi pembayaran cicilan ke tagihan yang sesuai dengan perhitungan sisa tagihan.
3. **Receipt Number Generation** — Algoritma pembuatan nomor kuitansi unik dengan format KWT/YYYY/MM/XXX.

### 1.6 Database & Stack Teknologi

#### Database

| Komponen | Teknologi |
|---|---|
| Database Utama | PostgreSQL (production), SQLite (development) |
| ORM | SQLModel 0.0.24 + SQLAlchemy 2.0 |
| Migration Tool | Alembic 1.15 |
| Jumlah Tabel | 14 tabel |

#### Stack Teknologi

| Lapisan | Teknologi |
|---|---|
| **Backend Framework** | FastAPI 0.115 (Python 3.12) |
| **Frontend Framework** | React 19 + TypeScript 6.0 |
| **CSS Framework** | Tailwind CSS 3.4 |
| **Build Tool** | Vite 8 |
| **Autentikasi** | JWT (python-jose, access + refresh token) |
| **Real-time** | SSE (Server-Sent Events) via sse-starlette |
| **PDF Generation** | ReportLab 4.4 |
| **Excel Export** | OpenPyXL 3.1 |
| **QR Code** | qrcode 8.2 + Pillow 12.2 |
| **Chart/Grafik** | Recharts 3.10 |
| **Payment Gateway** | Midtrans / Xendit / Simulator |
| **Notifikasi Eksternal** | WhatsApp Fonnte API |
| **HTTP Client** | Axios 1.18 |
| **Routing** | React Router DOM 7 |
| **Deployment** | Vercel, Docker |
