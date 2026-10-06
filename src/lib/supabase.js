import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "[Kilala] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. " +
    "Copy .env.example to .env.local and fill in your Supabase project keys."
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");

export const isSupabaseConfigured = Boolean(url && anonKey);
