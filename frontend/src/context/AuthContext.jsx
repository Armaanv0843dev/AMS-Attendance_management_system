// context/AuthContext.jsx — Shared auth state for the entire app.
//
// Previously, Sidebar and Navbar each independently called
// supabase.auth.getSession() on mount, causing 2+ redundant async calls
// on every page load. Now they consume this shared context instead.
//
// App.jsx already tracks the session for route guarding — this context
// simply exposes that same session + derived user info to any component.

import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

/**
 * useAuth — consume the shared auth context.
 * Returns { session, user, email, displayName }
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
