import { getSupabase } from "../config/supabaseClient.js";
import { getJakartaDate, serializeLoan } from "../utils/loanValidation.js";

export const LoanModel = {
  async getAll(status) {
    const today = getJakartaDate();
    let query = getSupabase()
      .from("loans")
      .select("*")
      .order("created_at", { ascending: false });

    if (status === "Dikembalikan") {
      query = query.eq("status", "Dikembalikan");
    } else if (status === "Dipinjam") {
      query = query.eq("status", "Dipinjam").gte("due_date", today);
    } else if (status === "Terlambat") {
      query = query.eq("status", "Dipinjam").lt("due_date", today);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((loan) => serializeLoan(loan, today));
  },

  async getById(id) {
    const { data, error } = await getSupabase()
      .from("loans")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? serializeLoan(data) : null;
  },

  async create(loan) {
    const { data, error } = await getSupabase()
      .from("loans")
      .insert(loan)
      .select("*")
      .single();
    if (error) throw error;
    return serializeLoan(data);
  },

  async update(id, changes) {
    const { data, error } = await getSupabase()
      .from("loans")
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return serializeLoan(data);
  },

  async remove(id) {
    const { data, error } = await getSupabase()
      .from("loans")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  },
};
