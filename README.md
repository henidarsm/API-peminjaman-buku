# API Peminjaman Buku

## Deskripsi dan tujuan

Proyek ini membangun REST API sederhana untuk mencatat peminjaman buku oleh anggota perpustakaan. Tujuannya adalah menerapkan operasi CRUD dan filter status menggunakan **Node.js, Express.js, dan Supabase (PostgreSQL)**, dengan susunan `models`, `controllers`, dan `routes` mengikuti pola pada Modul 1. API disiapkan untuk deployment di Vercel.

## Fitur

- CRUD data peminjaman.
- Filter daftar berdasarkan status: `Dipinjam`, `Dikembalikan`, atau `Terlambat`.
- Status `Terlambat` dihitung otomatis bila tanggal jatuh tempo sudah lewat dan buku belum dikembalikan.
- Validasi input, format tanggal, UUID, serta error JSON.
- Siap dijalankan lokal dan dideploy sebagai serverless function di Vercel.

> **Catatan keamanan:** proyek responsi ini sengaja memakai kebijakan Supabase publik agar endpoint bisa diuji tanpa login. Siapa pun yang menemukan URL deployment dapat membaca, menambah, mengubah, dan menghapus data. Gunakan hanya untuk data contoh/tugas, jangan masukkan data anggota sungguhan. Untuk pemakaian nyata, tambahkan autentikasi dan kebijakan RLS per pengguna.

## Struktur data

Skema SQL ada di [`supabase/schema.sql`](supabase/schema.sql). Tabel `public.loans` memiliki kolom:

| Kolom | Tipe | Aturan |
| --- | --- | --- |
| `id` | UUID | Primary key, dibuat otomatis |
| `member_name` | text | Wajib |
| `member_email` | text | Opsional |
| `book_title` | text | Wajib |
| `author` | text | Opsional |
| `loan_date` | date | Tanggal pinjam, default hari ini |
| `due_date` | date | Wajib, tidak boleh sebelum tanggal pinjam |
| `returned_at` | date | Kosong selama belum dikembalikan |
| `status` | text | Nilai database `Dipinjam` atau `Dikembalikan` |
| `created_at` | timestamptz | Waktu data dibuat |
| `updated_at` | timestamptz | Waktu terakhir diperbarui |

API menampilkan status `Terlambat` secara otomatis jika `status` tersimpan `Dipinjam` dan `due_date` sudah lewat menurut tanggal Asia/Jakarta. Nilai `Terlambat` tidak disimpan sebagai status terpisah di database.

## Endpoint

Semua endpoint data memakai prefiks `/api/loans`.

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/` | Informasi API |
| `GET` | `/api/health` | Cek server |
| `GET` | `/api/loans` | Daftar semua peminjaman |
| `GET` | `/api/loans?status=Terlambat` | Filter status |
| `GET` | `/api/loans/:id` | Detail satu peminjaman |
| `POST` | `/api/loans` | Tambah peminjaman |
| `PUT` | `/api/loans/:id` | Ubah field yang dikirim |
| `PATCH` | `/api/loans/:id` | Ubah sebagian field |
| `DELETE` | `/api/loans/:id` | Hapus peminjaman |

Status filter tidak peka huruf besar-kecil. Nilai yang diterima: `Dipinjam`, `Dikembalikan`, dan `Terlambat`.

## Contoh request dan response

### Menambah peminjaman

```http
POST /api/loans
Content-Type: application/json
```

```json
{
  "member_name": "Budi Santoso",
  "member_email": "budi@example.com",
  "book_title": "Laskar Pelangi",
  "author": "Andrea Hirata",
  "loan_date": "2026-10-10",
  "due_date": "2026-10-17"
}
```

Response `201 Created`:

```json
{
  "message": "Data peminjaman berhasil ditambahkan.",
  "data": {
    "id": "acaf4f5f-b8de-48e5-b104-719b4c92bb84",
    "member_name": "Budi Santoso",
    "member_email": "budi@example.com",
    "book_title": "Laskar Pelangi",
    "author": "Andrea Hirata",
    "loan_date": "2026-10-10",
    "due_date": "2026-10-17",
    "returned_at": null,
    "status": "Dipinjam",
    "created_at": "2026-10-10T03:00:00.000Z",
    "updated_at": "2026-10-10T03:00:00.000Z"
  }
}
```

ID dan timestamp pada contoh hanya ilustrasi; Supabase menghasilkan nilai sebenarnya.

### Memfilter keterlambatan

```http
GET /api/loans?status=Terlambat
```

Response `200 OK`:

```json
{
  "data": [
    {
      "id": "acaf4f5f-b8de-48e5-b104-719b4c92bb84",
      "member_name": "Budi Santoso",
      "book_title": "Laskar Pelangi",
      "loan_date": "2026-10-01",
      "due_date": "2026-10-08",
      "returned_at": null,
      "status": "Terlambat"
    }
  ],
  "total": 1
}
```

### Memperbarui status

```http
PATCH /api/loans/acaf4f5f-b8de-48e5-b104-719b4c92bb84
Content-Type: application/json
```

```json
{ "status": "Dikembalikan" }
```

API mengisi `returned_at` dengan tanggal saat ini jika tanggal tersebut tidak dikirim.

## Tutorial instalasi dan menjalankan lokal

### 1. Persiapan

Pasang Node.js versi 20 atau lebih baru, lalu siapkan akun Supabase. Buka folder proyek ini di terminal.

### 2. Buat tabel di Supabase

1. Buat project baru di Supabase.
2. Buka **SQL Editor** → **New query**.
3. Salin seluruh isi `supabase/schema.sql`, lalu klik **Run**.
4. Buka **Table Editor** dan pastikan tabel `loans` sudah ada.

### 3. Isi variabel lingkungan

Salin `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Di Windows Command Prompt:

```bat
copy .env.example .env
```

Isi file `.env` seperti berikut (nilai diambil dari Supabase → **Project Settings** → **API Keys**):

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
PORT=3000
NODE_ENV=development
```

`SUPABASE_KEY` diisi dengan **publishable/anon key** (diawali `sb_publishable_`). Jangan memakai atau membagikan `secret`/`service_role` key. File `.env` tidak ikut diunggah ke GitHub karena sudah tercantum di `.gitignore`.

### 4. Pasang dependency dan jalankan

```bash
npm install
npm run dev
```

Server lokal berjalan di `http://localhost:3000`. Cek `http://localhost:3000/api/health`; respons normal:

```json
{ "status": "ok", "service": "perpustakaan-api" }
```

### 5. Uji endpoint

Gunakan Postman, Insomnia, atau file `requests.http` (misalnya melalui REST Client extension di VS Code). Tambahkan satu data dengan `POST /api/loans`, lalu coba `GET`, filter `?status=Terlambat`, `PATCH`, dan `DELETE`. Isi ID pada URL dengan `id` dari response POST. Jalankan pemeriksaan validasi lokal dengan:

```bash
npm test
```

Tes ini memeriksa validasi dan aturan status tanpa perlu koneksi Supabase.

## Deploy ke GitHub dan Vercel

### GitHub

1. Buat repository baru yang **public** sesuai instruksi tugas.
2. Dari folder proyek, jalankan:

   ```bash
   git init
   git add .
   git commit -m "API peminjaman buku"
   git branch -M main
   git remote add origin https://github.com/henidarsm/API-peminjaman-buku.git
   git push -u origin main
   ```

3. Pastikan `.env` tidak ikut terunggah. File tersebut sudah masuk `.gitignore`; yang boleh diunggah hanya `.env.example` tanpa nilai rahasia.

### Vercel

1. Masuk ke Vercel dan pilih **Add New → Project**.
2. Import repository GitHub tadi; gunakan root folder repository.
3. Di **Environment Variables**, tambahkan:
   - `SUPABASE_URL` = Project URL Supabase
   - `SUPABASE_KEY` = anon/public key Supabase
4. Klik **Deploy**. `vercel.json` sudah mengarahkan request ke `src/index.js`.
5. Setelah berhasil, uji `https://LINK-VERCEL-KAMU.vercel.app/api/health`, lalu coba `/api/loans`.

## Susunan folder

```text
perpustakaan-api/
├── .env.example
├── .gitignore
├── README.md
├── TUTORIAL.md
├── package.json
├── requests.http
├── vercel.json
├── supabase/
│   └── schema.sql
├── src/
│   ├── app.js
│   ├── index.js
│   ├── config/supabaseClient.js
│   ├── controllers/loanController.js
│   ├── errors/HttpError.js
│   ├── middleware/errorHandler.js
│   ├── models/loanModel.js
│   ├── routes/loanRoutes.js
│   └── utils/loanValidation.js
└── test/
    └── loanValidation.test.js
```

## Link deployment

- **Base URL Vercel:** https://LINK-VERCEL-KAMU.vercel.app
- Cek server: https://LINK-VERCEL-KAMU.vercel.app/api/health
- Daftar peminjaman: https://LINK-VERCEL-KAMU.vercel.app/api/loans
- Filter terlambat: https://LINK-VERCEL-KAMU.vercel.app/api/loans?status=Terlambat

## Repository

- GitHub: https://github.com/henidarsm/API-peminjaman-buku