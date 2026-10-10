import test from "node:test";
import assert from "node:assert/strict";
import {
  getEffectiveLoanStatus,
  isUuid,
  parseCreateLoan,
  parseLoanUpdate,
  parseStatusFilter,
  serializeLoan,
} from "../src/utils/loanValidation.js";

const today = "2026-10-10";

const validBody = {
  member_name: "  Budi Santoso ",
  member_email: "budi@example.com",
  book_title: "Laskar Pelangi",
  author: "Andrea Hirata",
  due_date: "2026-10-15",
};

test("membuat data pinjaman dengan default tanggal dan status", () => {
  const result = parseCreateLoan(validBody, today);
  assert.equal(result.member_name, "Budi Santoso");
  assert.equal(result.loan_date, today);
  assert.equal(result.status, "Dipinjam");
  assert.equal(result.returned_at, null);
});

test("status pinjaman otomatis menjadi Terlambat setelah due_date", () => {
  assert.equal(
    getEffectiveLoanStatus(
      { status: "Dipinjam", due_date: "2026-10-09" },
      today,
    ),
    "Terlambat",
  );
  assert.equal(
    getEffectiveLoanStatus(
      { status: "Dikembalikan", due_date: "2026-10-09" },
      today,
    ),
    "Dikembalikan",
  );
});

test("filter status menerima nilai yang tidak peka huruf besar-kecil", () => {
  assert.equal(parseStatusFilter("terlambat"), "Terlambat");
  assert.equal(parseStatusFilter("DIPINJAM"), "Dipinjam");
  assert.equal(parseStatusFilter(undefined), undefined);
  assert.throws(() => parseStatusFilter("hilang"), /Status tidak valid/);
});

test("validasi menolak tanggal jatuh tempo sebelum tanggal pinjam", () => {
  assert.throws(
    () =>
      parseCreateLoan(
        { ...validBody, due_date: "2026-10-09" },
        today,
      ),
    /tidak boleh lebih awal/,
  );
});

test("validasi menolak tanggal kalender yang tidak valid", () => {
  assert.throws(
    () => parseCreateLoan({ ...validBody, due_date: "2026-02-30" }, today),
    /tanggal valid/,
  );
});

test("mengubah status menjadi Dikembalikan mengisi returned_at", () => {
  const current = parseCreateLoan(validBody, today);
  const patch = parseLoanUpdate({ status: "Dikembalikan" }, current, today);
  assert.deepEqual(patch, {
    status: "Dikembalikan",
    returned_at: today,
  });
  assert.equal(
    serializeLoan({ ...current, ...patch }, today).status,
    "Dikembalikan",
  );
});

test("mengubah returned_at ke null mengembalikan status menjadi Dipinjam", () => {
  const current = {
    ...parseCreateLoan(validBody, today),
    status: "Dikembalikan",
    returned_at: "2026-10-10",
  };
  assert.deepEqual(parseLoanUpdate({ returned_at: null }, current, today), {
    returned_at: null,
    status: "Dipinjam",
  });
});

test("validasi menolak ID yang bukan UUID", () => {
  assert.equal(isUuid("acaf4f5f-b8de-48e5-b104-719b4c92bb84"), true);
  assert.equal(isUuid("bukan-uuid"), false);
});
