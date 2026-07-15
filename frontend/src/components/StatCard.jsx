// components/StatCard.jsx — Dashboard KPI card component.

/**
 * @param {string}  icon    — Emoji or icon character
 * @param {string}  label   — Card label
 * @param {string|number} value — Displayed number/value
 * @param {string}  accent  — CSS color variable value for the accent stripe
 * @param {string}  accentBg — CSS color for icon background
 */
export default function StatCard({ icon, label, value, accent, accentBg }) {
  return (
    <div
      className="stat-card"
      style={{ "--accent-color": accent, "--accent-bg": accentBg }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value ?? "—"}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
