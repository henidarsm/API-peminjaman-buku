# Tutorial Menjalankan API Peminjaman Buku

Ikuti urutan ini dari awal. Jangan unggah file `.env` ke GitHub.

## A. Siapkan Supabase

1. Buat project di Supabase.
2. Pilih **SQL Editor** → **New query**.
3. Buka `supabase/schema.sql` dari folder ini, salin seluruh isinya, tempel ke SQL Editor, lalu pilih **Run**.
4. Pastikan `public.loans` muncul di **Table Editor**.
5. Di **Project Settings** → **API** (nama menu dapat berbeda), catat **Project URL** dan **anon/public key**. Jangan pakai `service_role` key.

## B. Jalankan di laptop

1. Instal Node.js versi 20 atau lebih baru.
2. Buka terminal di folder `perpustakaan-api`.
3. Buat file `.env` dari contoh:

   macOS/Linux:

   ```bash
   cp .env.example .env
   ```

   Windows:

   ```bat
   copy .env.example .env
   ```

4. Buka `.env` dan ganti placeholder dengan nilai Supabase milikmu:

   ```env
   SUPABASE_URL=https://PROJECT_ID.supabase.co
   SUPABASE_KEY=ANON_PUBLIC_KEY_MILIKMU
   PORT=3000
   NODE_ENV=development
   ```

5. Instal dependency dan nyalakan server:

   ```bash
   npm install
   npm run dev
   ```

6. Buka `http://localhost:3000/api/health`. Jika `status` bernilai `ok`, server Express berjalan.

## C. Tes CRUD

### 1. Buat peminjaman

Kirim `POST http://localhost:3000/api/loans` dengan header `Content-Type: application/json` dan body:

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

Simpan `data.id` dari response. Itu adalah ID untuk tes detail, update, dan hapus.

### 2. Baca data

- Semua peminjaman: `GET http://localhost:3000/api/loans`
- Satu peminjaman: `GET http://localhost:3000/api/loans/ID_DARI_RESPONSE`
- Status tertentu: `GET http://localhost:3000/api/loans?status=Dipinjam`
- Yang terlambat: `GET http://localhost:3000/api/loans?status=Terlambat`

Status menjadi `Terlambat` otomatis jika `due_date` sudah lewat dan buku belum dikembalikan, dihitung berdasarkan tanggal Asia/Jakarta. Agar bisa langsung mencoba filter, buat data dengan `due_date` tanggal kemarin.

### 3. Ubah data

Kirim `PATCH http://localhost:3000/api/loans/ID_DARI_RESPONSE`:

```json
{ "status": "Dikembalikan" }
```

`returned_at` otomatis diisi hari ini. Untuk mengubah detail anggota atau buku, kirim field yang ingin diubah, contohnya:

```json
{ "member_name": "Budi Santoso Update" }
```

Route `PUT` juga tersedia dan menerima field yang ingin diubah.

### 4. Hapus data

Kirim `DELETE http://localhost:3000/api/loans/ID_DARI_RESPONSE`. Hapus bersifat permanen.

## D. Jalankan tes kode

Di terminal:

```bash
npm test
```

Tes bawaan memeriksa validasi tanggal, UUID, perubahan status, dan filter tanpa menghubungi Supabase.

## E. Publikasikan

1. Buat repository GitHub publik, lalu dari terminal di folder proyek:

   ```bash
   git init
   git add .
   git commit -m "Build API peminjaman buku"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPOSITORY.git
   git push -u origin main
   ```

2. Di Vercel pilih **Add New → Project**, lalu import repository tersebut.
3. Tambahkan Environment Variables `SUPABASE_URL` dan `SUPABASE_KEY` dengan nilai dari Supabase. Jangan masukkan file `.env` ke GitHub.
4. Pilih **Deploy** dan tunggu selesai.
5. Uji URL yang diberikan Vercel dengan `/api/health`, lalu `/api/loans`.
6. Salin URL repository dan Base URL Vercel yang sudah diuji ke form responsi.

Untuk tugas saja, kebijakan database pada `schema.sql` membuka CRUD publik agar penguji bisa mencoba API. Jangan gunakan data anggota sungguhan dan jangan biarkan kebijakan itu aktif untuk aplikasi produksi.
