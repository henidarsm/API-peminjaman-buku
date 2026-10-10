import express from "express";
import loanRoutes from "./routes/loanRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "API Peminjaman Buku aktif.",
    endpoints: {
      health: "/api/health",
      loans: "/api/loans",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "perpustakaan-api" });
});

app.use("/api/loans", loanRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
