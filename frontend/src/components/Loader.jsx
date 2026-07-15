// components/Loader.jsx — Reusable loading spinner components.

/**
 * Full-screen overlay spinner (for page-level loading)
 */
export function FullPageLoader() {
  return (
    <div className="spinner-overlay">
      <div className="spinner" />
    </div>
  );
}

/**
 * Inline spinner with optional label (for section-level loading)
 */
export function InlineLoader({ label = "Loading..." }) {
  return (
    <div className="spinner-inline">
      <div className="spinner spinner-sm" />
      <span>{label}</span>
    </div>
  );
}
