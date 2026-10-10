import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.PORT) || 3000;

// Vercel mengimpor Express app sebagai handler serverless.
// Di komputer lokal, file ini menjalankan server HTTP biasa.
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`API Peminjaman Buku berjalan di http://localhost:${port}`);
  });
}

export default app;
