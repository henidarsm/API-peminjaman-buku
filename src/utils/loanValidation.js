import { HttpError } from "../errors/HttpError.js";

const writableFields = new Set([
  "member_name",
  "member_email",
  "book_title",
  "author",
  "loan_date",
  "due_date",
  "returned_at",
  "status",
]);

const allowedStoredStatuses = new Set(["Dipinjam", "Dikembalikan"]);

export function getJakartaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getEffectiveLoanStatus(loan, today = getJakartaDate()) {
  if (loan.status === "Dikembalikan") return "Dikembalikan";
  return loan.due_date < today ? "Terlambat" : "Dipinjam";
}

export function parseStatusFilter(value) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(400, "Query status harus berupa satu nilai teks.");
  }

  const normalized = value.trim().toLocaleLowerCase("id-ID");
  const statuses = {
    dipinjam: "Dipinjam",
    dikembalikan: "Dikembalikan",
    terlambat: "Terlambat",
  };
  const status = statuses[normalized];
  if (!status) {
    throw new HttpError(
      400,
      "Status tidak valid. Gunakan Dipinjam, Dikembalikan, atau Terlambat.",
    );
  }
  return status;
}

export function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function requireObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Body request harus berupa object JSON.");
  }
}

function validateFields(body, { partial = false, today = getJakartaDate() } = {}) {
  requireObject(body);
  const keys = Object.keys(body);
  const unknown = keys.filter((key) => !writableFields.has(key));
  if (unknown.length) {
    throw new HttpError(400, `Field tidak dikenal: ${unknown.join(", ")}.`);
  }
  if (partial && keys.length === 0) {
    throw new HttpError(400, "Body update tidak boleh kosong.");
  }

  const result = {};
  const requiredText = ["member_name", "book_title"];
  for (const field of requiredText) {
    if (!partial || Object.hasOwn(body, field)) {
      const value = body[field];
      const maxLength = field === "member_name" ? 120 : 200;
      if (typeof value !== "string" || !value.trim()) {
        throw new HttpError(400, `${field} wajib berupa teks yang tidak kosong.`);
      }
      if (value.trim().length > maxLength) {
        throw new HttpError(400, `${field} maksimal ${maxLength} karakter.`);
      }
      result[field] = value.trim();
    }
  }

  for (const field of ["member_email", "author"]) {
    if (!Object.hasOwn(body, field)) continue;
    const value = body[field];
    if (value !== null && typeof value !== "string") {
      throw new HttpError(400, `${field} harus berupa teks atau null.`);
    }
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (field === "member_email" && trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new HttpError(400, "member_email bukan alamat email yang valid.");
    }
    if (trimmed.length > (field === "author" ? 160 : 254)) {
      throw new HttpError(400, `${field} terlalu panjang.`);
    }
    result[field] = trimmed || null;
  }

  for (const field of ["loan_date", "due_date", "returned_at"]) {
    if (!Object.hasOwn(body, field)) continue;
    const value = body[field];
    if (field === "returned_at" && value === null) {
      result[field] = null;
      continue;
    }
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) ||
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value
    ) {
      throw new HttpError(400, `${field} harus berupa tanggal valid berformat YYYY-MM-DD.`);
    }
    result[field] = value;
  }

  if (Object.hasOwn(body, "status")) {
    if (typeof body.status !== "string" || !allowedStoredStatuses.has(body.status)) {
      throw new HttpError(
        400,
        "status hanya boleh Dipinjam atau Dikembalikan. Terlambat dihitung dari due_date.",
      );
    }
    result.status = body.status;
  }

  if (!partial && !Object.hasOwn(result, "loan_date")) {
    result.loan_date = today;
  }
  return result;
}

function validateCombinedDates(record) {
  if (record.loan_date && record.due_date && record.due_date < record.loan_date) {
    throw new HttpError(400, "due_date tidak boleh lebih awal daripada loan_date.");
  }
  if (record.loan_date && record.returned_at && record.returned_at < record.loan_date) {
    throw new HttpError(400, "returned_at tidak boleh lebih awal daripada loan_date.");
  }
}

export function parseCreateLoan(body, today = getJakartaDate()) {
  const fields = validateFields(body, { today });
  if (!fields.due_date) {
    throw new HttpError(400, "due_date wajib diisi dengan format YYYY-MM-DD.");
  }
  const status = fields.status ?? (fields.returned_at ? "Dikembalikan" : "Dipinjam");
  const returnedAt =
    status === "Dikembalikan" ? (fields.returned_at ?? today) : (fields.returned_at ?? null);
  if ((status === "Dikembalikan") !== Boolean(returnedAt)) {
    throw new HttpError(400, "status dan returned_at harus konsisten.");
  }

  const loan = {
    member_name: fields.member_name,
    member_email: fields.member_email ?? null,
    book_title: fields.book_title,
    author: fields.author ?? null,
    loan_date: fields.loan_date ?? today,
    due_date: fields.due_date,
    returned_at: returnedAt,
    status,
  };
  validateCombinedDates(loan);
  return loan;
}

export function parseLoanUpdate(body, current, today = getJakartaDate()) {
  const fields = validateFields(body, { partial: true, today });
  const merged = { ...current, ...fields };
  const changedStatus = Object.hasOwn(fields, "status");
  const changedReturnDate = Object.hasOwn(fields, "returned_at");

  if (changedStatus && !changedReturnDate) {
    merged.returned_at =
      fields.status === "Dikembalikan" ? (current.returned_at ?? today) : null;
    fields.returned_at = merged.returned_at;
  } else if (changedReturnDate && !changedStatus) {
    merged.status = fields.returned_at ? "Dikembalikan" : "Dipinjam";
    fields.status = merged.status;
  } else if (changedStatus || changedReturnDate) {
    if ((merged.status === "Dikembalikan") !== Boolean(merged.returned_at)) {
      throw new HttpError(400, "status dan returned_at harus konsisten.");
    }
  }

  validateCombinedDates(merged);
  return fields;
}

export function serializeLoan(loan, today = getJakartaDate()) {
  return { ...loan, status: getEffectiveLoanStatus(loan, today) };
}
