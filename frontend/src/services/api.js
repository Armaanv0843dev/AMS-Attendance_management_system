// services/api.js — Axios instance pre-configured for the Flask backend.
//
// Optimizations:
// 1. Session caching: the Supabase session is cached in a module-level variable.
//    Previously, supabase.auth.getSession() was called on EVERY API request
//    (an extra async roundtrip). Now it only re-fetches on auth state changes.
// 2. Removed redundant _t cache-buster: the Flask backend already sets
//    Cache-Control: no-cache on all responses, so the timestamp param
//    was never needed.

import axios from "axios";
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  },
});

// Module-level session cache — refreshed via Supabase auth state listener
let _cachedSession = null;

// Keep session cache in sync with Supabase auth events (login/logout)
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedSession = session;
});

// Warm up the cache immediately on module load
supabase.auth.getSession().then(({ data }) => {
  _cachedSession = data?.session ?? null;
});

// Request interceptor: attach auth token + teacher ID from cached session
api.interceptors.request.use((config) => {
  const session = _cachedSession;
  const token  = session?.access_token;
  const userId = session?.user?.id;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Inject teacher's UID so backend can scope all queries to this teacher
  if (userId) {
    config.headers["X-Teacher-ID"] = userId;
  }

  return config;
});

export default api;
