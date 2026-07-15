// services/supabase.js — Initialize the Supabase client for the frontend.
// Uses the public anon key (safe for browser use).

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase credentials not set. Copy frontend/.env.example to frontend/.env and fill in your values."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
