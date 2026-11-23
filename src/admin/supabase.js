import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../lib/config";

// Admin-only client (loaded only on /admin). It signs in with email + password; what it may change is decided
// by row-level security in the database, not by this code.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: "floral-admin-auth" },
});
