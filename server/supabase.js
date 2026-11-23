import { createClient } from "@supabase/supabase-js";

let client;
/** Service-role client. Bypasses row-level security, so it must only ever run on the server. */
export function db() {
  if (!client) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Vercel.");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

/** Verifies the admin's Supabase login token and checks the email is in the admins table. */
export async function requireAdmin(req) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const { data, error } = await db().auth.getUser(token);
  const email = data?.user?.email;
  if (error || !email) return null;
  const { data: rows } = await db().from("admins").select("email");
  const ok = (rows || []).some((r) => r.email.toLowerCase() === email.toLowerCase());
  return ok ? { email } : null;
}
