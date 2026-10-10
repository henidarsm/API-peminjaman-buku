-- Skema database API Peminjaman Buku.
-- Jalankan seluruh isi file ini di Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  member_name text not null check (char_length(trim(member_name)) between 1 and 120),
  member_email text,
  book_title text not null check (char_length(trim(book_title)) between 1 and 200),
  author text,
  loan_date date not null default current_date,
  due_date date not null,
  returned_at date,
  -- Status yang disimpan hanya Dipinjam atau Dikembalikan.
  -- Status Terlambat dihitung oleh API dari due_date dan status.
  status text not null default 'Dipinjam'
    check (status in ('Dipinjam', 'Dikembalikan')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loans_due_date_after_loan_date check (due_date >= loan_date),
  constraint loans_return_date_after_loan_date
    check (returned_at is null or returned_at >= loan_date),
  constraint loans_return_status_consistent check (
    (status = 'Dipinjam' and returned_at is null)
    or (status = 'Dikembalikan' and returned_at is not null)
  )
);

create index if not exists loans_status_due_date_idx
  on public.loans (status, due_date);
create index if not exists loans_created_at_idx
  on public.loans (created_at desc);

alter table public.loans enable row level security;

-- Kebijakan terbuka ini diperlukan agar API tugas dapat diuji tanpa login.
-- Jangan gunakan kebijakan publik ini untuk aplikasi perpustakaan sungguhan.
drop policy if exists "loans_public_select" on public.loans;
create policy "loans_public_select"
  on public.loans for select to anon, authenticated using (true);

drop policy if exists "loans_public_insert" on public.loans;
create policy "loans_public_insert"
  on public.loans for insert to anon, authenticated with check (true);

drop policy if exists "loans_public_update" on public.loans;
create policy "loans_public_update"
  on public.loans for update to anon, authenticated using (true) with check (true);

drop policy if exists "loans_public_delete" on public.loans;
create policy "loans_public_delete"
  on public.loans for delete to anon, authenticated using (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.loans to anon, authenticated;
