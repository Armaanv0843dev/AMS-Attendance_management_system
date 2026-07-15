// pages/Analytics.jsx — Attendance analytics with charts and stats table.

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { BarChart, PieChart, LineChart } from "../components/Charts";
import { InlineLoader } from "../components/Loader";
import { useToast } from "../components/Toast";
import api from "../services/api";
import refreshBus from "../services/refreshBus";

export default function Analytics() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading]     = useState(true);
  const toast = useToast();

  const loadRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/analytics/")
      .then((res) => setAnalytics(res.data.analytics || []))
      .catch(() => toast.error("Failed to load analytics."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadRef.current = load; }, [load]);

  useEffect(() => {
    load();
    // Use ref so subscription never goes stale
    const unsub = refreshBus.on(() => loadRef.current?.());
    return unsub;
  }, []);

  // ── ALL hooks must be called before any early return (Rules of Hooks) ──
  // Prepare chart data — memoized so it only recomputes when analytics changes
  const labels    = useMemo(() => analytics.map((a) => a.name || a.roll_no), [analytics]);
  const pcts      = useMemo(() => analytics.map((a) => parseFloat(a.percentage) || 0), [analytics]);

  const goodCount    = useMemo(() => analytics.filter((a) => a.status === "Good").length, [analytics]);
  const warningCount = useMemo(() => analytics.filter((a) => a.status === "Warning").length, [analytics]);
  const criticalCount= useMemo(() => analytics.filter((a) => a.status === "Critical").length, [analytics]);
  const noDataCount  = useMemo(() => analytics.filter((a) => a.status === "No Data").length, [analytics]);

  const barDataset = useMemo(() => [{
    label: "Attendance %",
    data: pcts,
    backgroundColor: pcts.map((p) =>
      p >= 75 ? "rgba(16, 185, 129, 0.7)"
      : p >= 60 ? "rgba(245, 158, 11, 0.7)"
      : "rgba(239, 68, 68, 0.7)"
    ),
    borderColor: pcts.map((p) =>
      p >= 75 ? "#10B981" : p >= 60 ? "#F59E0B" : "#EF4444"
    ),
    borderWidth: 1,
    borderRadius: 6,
  }], [pcts]);

  const lineDataset = useMemo(() => [{
    label: "Attendance %",
    data: [...pcts].sort((a, b) => b - a),
    borderColor: "#4F46E5",
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    fill: true,
    tension: 0.4,
  }], [pcts]);

  const statusBadge = (status) => {
    const map = {
      Good:     "badge badge-success",
      Warning:  "badge badge-warning",
      Critical: "badge badge-danger",
      "No Data":"badge",
    };
    return map[status] || "badge";
  };

  // Early return AFTER all hooks
  if (loading) return <InlineLoader label="Computing analytics…" />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Attendance statistics across all students</p>
        </div>
      </div>

      {/* Summary */}
      <div className="stat-cards-grid" style={{ marginBottom: 28 }}>
        {[
          { label: "Good (≥75%)",     value: goodCount,     accent: "var(--color-success)", accentBg: "var(--color-success-dim)", icon: "✅" },
          { label: "Warning (60–74%)", value: warningCount,  accent: "var(--color-warning)", accentBg: "var(--color-warning-dim)", icon: "⚠️" },
          { label: "Critical (<60%)",  value: criticalCount, accent: "var(--color-danger)",  accentBg: "var(--color-danger-dim)",  icon: "🚨" },
        ].map(({ label, value, accent, accentBg, icon }) => (
          <div
            key={label}
            className="stat-card"
            style={{ "--accent-color": accent, "--accent-bg": accentBg }}
          >
            <div className="stat-icon">{icon}</div>
            <div className="stat-info">
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {analytics.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">No analytics data yet. Mark some attendance first!</div>
        </div>
      ) : (
        <>
          <div className="charts-grid" style={{ marginBottom: 28 }}>
            <div className="chart-card">
              <h3 className="chart-title">📊 Attendance % by Student</h3>
              <BarChart labels={labels} datasets={barDataset} />
            </div>
            <div className="chart-card">
              <h3 className="chart-title">🥧 Status Distribution</h3>
              <PieChart
                labels={["Good (≥75%)", "Warning (60–74%)", "Critical (<60%)", "No Data"]}
                data={[goodCount, warningCount, criticalCount, noDataCount]}
              />
            </div>
          </div>
          <div className="chart-card" style={{ marginBottom: 28 }}>
            <h3 className="chart-title">📉 Attendance Distribution (Sorted)</h3>
            <LineChart labels={labels} datasets={lineDataset} />
          </div>

          {/* Detail table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Detailed Breakdown</h2>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Course</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Total</th>
                    <th>Attendance %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...analytics].sort((a, b) => b.percentage - a.percentage).map((a) => (
                    <tr key={a.id}>
                      <td><span className="badge badge-primary">{a.roll_no}</span></td>
                      <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{a.name}</td>
                      <td>{a.course || "—"}</td>
                      <td style={{ color: "var(--color-success)", fontWeight: 600 }}>{a.present}</td>
                      <td style={{ color: "var(--color-danger)",  fontWeight: 600 }}>{a.absent}</td>
                      <td style={{ color: "var(--color-warning)", fontWeight: 600 }}>{a.late}</td>
                      <td>{a.total}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: a.percentage >= 75 ? "var(--color-success)" : a.percentage >= 60 ? "var(--color-warning)" : "var(--color-danger)" }}>
                          {a.percentage?.toFixed(1)}%
                        </span>
                        <div className="progress-bar" style={{ marginTop: 4, width: 80 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(a.percentage, 100)}%`,
                              background: a.percentage >= 75 ? "var(--color-success)" : a.percentage >= 60 ? "var(--color-warning)" : "var(--color-danger)",
                            }}
                          />
                        </div>
                      </td>
                      <td><span className={statusBadge(a.status)}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
