/**
 * services/refreshBus.js
 *
 * A tiny event bus that lets any page trigger a data refresh on other pages.
 * Usage:
 *   - To signal that data has changed:   refreshBus.emit()
 *   - To listen for refresh signals:     refreshBus.on(fn) / refreshBus.off(fn)
 */

const listeners = new Set();

const refreshBus = {
  /** Call this after saving attendance (or any mutation) */
  emit() {
    listeners.forEach((fn) => fn());
  },

  /** Subscribe to refresh events. Returns an unsubscribe function. */
  on(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /** Unsubscribe a previously registered listener */
  off(fn) {
    listeners.delete(fn);
  },
};

export default refreshBus;
