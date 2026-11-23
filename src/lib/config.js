// Browser-side configuration (all values are public by design; secrets live only in Vercel).
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
/** When false the site falls back to the sample data in src/data so local development works without any setup. */
export const hasBackend = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
