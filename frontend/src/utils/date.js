// utils/date.js — Shared date utility functions.

/**
 * Returns today's date in YYYY-MM-DD format using LOCAL timezone (not UTC).
 * Using toISOString() would give UTC date which can be wrong by ±1 day depending on timezone.
 */
export function getLocalToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
