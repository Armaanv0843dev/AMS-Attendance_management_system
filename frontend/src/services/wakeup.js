// services/wakeup.js — Ping the backend on app init to wake Render from sleep.
//
// Render free-tier instances spin down after 15 min of inactivity.
// The first request can take 30–90 seconds. This module fires a cheap
// health-check ping as early as possible (before the user navigates anywhere)
// so the backend is warm by the time real data is needed.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let _wakeupPromise = null;

/**
 * Initiates (or returns the existing) backend wake-up ping.
 * Safe to call multiple times — only one request is ever made.
 *
 * @returns {Promise<boolean>} true if backend responded, false on timeout/error
 */
export function pingBackend() {
  if (_wakeupPromise) return _wakeupPromise;

  _wakeupPromise = fetch(`${API_URL}/`, {
    method: "GET",
    signal: AbortSignal.timeout(90_000), // 90 second max wait
  })
    .then((res) => res.ok)
    .catch(() => false);

  return _wakeupPromise;
}
