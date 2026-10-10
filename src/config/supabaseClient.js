import { createClient } from "@supabase/supabase-js";
import { HttpError } from "../errors/HttpError.js";

let supabase;

export function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new HttpError(
      503,
      "Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_KEY pada file .env.",
    );
  }

  try {
    supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    throw new HttpError(503, "Konfigurasi Supabase tidak valid.");
  }
  return supabase;
}
