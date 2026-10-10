import { HttpError } from "../errors/HttpError.js";
import { LoanModel } from "../models/loanModel.js";
import {
  isUuid,
  parseCreateLoan,
  parseLoanUpdate,
  parseStatusFilter,
} from "../utils/loanValidation.js";

function requireValidId(id) {
  if (!isUuid(id)) {
    throw new HttpError(400, "ID peminjaman harus berupa UUID yang valid.");
  }
}

export const LoanController = {
  async getAll(req, res) {
    const status = parseStatusFilter(req.query.status);
    const loans = await LoanModel.getAll(status);
    res.status(200).json({ data: loans, total: loans.length });
  },

  async getById(req, res) {
    requireValidId(req.params.id);
    const loan = await LoanModel.getById(req.params.id);
    if (!loan) throw new HttpError(404, "Data peminjaman tidak ditemukan.");
    res.status(200).json({ data: loan });
  },

  async create(req, res) {
    const loanInput = parseCreateLoan(req.body);
    const loan = await LoanModel.create(loanInput);
    res.location(`/api/loans/${loan.id}`).status(201).json({
      message: "Data peminjaman berhasil ditambahkan.",
      data: loan,
    });
  },

  async update(req, res) {
    requireValidId(req.params.id);
    const current = await LoanModel.getById(req.params.id);
    if (!current) throw new HttpError(404, "Data peminjaman tidak ditemukan.");
    const changes = parseLoanUpdate(req.body, current);
    const loan = await LoanModel.update(req.params.id, changes);
    res.status(200).json({
      message: "Data peminjaman berhasil diperbarui.",
      data: loan,
    });
  },

  async remove(req, res) {
    requireValidId(req.params.id);
    const deleted = await LoanModel.remove(req.params.id);
    if (!deleted) throw new HttpError(404, "Data peminjaman tidak ditemukan.");
    res.status(200).json({ message: "Data peminjaman berhasil dihapus." });
  },
};
