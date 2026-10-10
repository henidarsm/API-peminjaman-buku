import { HttpError } from "../errors/HttpError.js";

export function notFoundHandler(req, res, next) {
  next(new HttpError(404, `Endpoint ${req.method} ${req.path} tidak ditemukan.`));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error instanceof HttpError ? error.status : 500;
  let message = error instanceof HttpError ? error.message : "Terjadi kesalahan pada server.";

  if (error?.type === "entity.parse.failed") {
    status = 400;
    message = "Body JSON tidak valid.";
  } else if (error?.code === "23505") {
    status = 409;
    message = "Data bertentangan dengan data yang sudah ada.";
  } else if (error?.code === "23503" || error?.code === "23514") {
    status = 400;
    message = "Data tidak memenuhi aturan database.";
  }

  if (status >= 500) console.error(error);
  res.status(status).json({
    error: {
      status,
      message,
      ...(process.env.NODE_ENV === "development" && error?.code
        ? { code: error.code }
        : {}),
    },
  });
}
