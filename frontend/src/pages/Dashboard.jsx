// pages/Dashboard.jsx — Main dashboard with KPI stat cards + section-wise filter.

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import { InlineLoader } from "../components/Loader";
import api from "../services/api";
import refreshBus from "../services/refreshBus";
import { getLocalToday } from "../utils/date";

export default function Dashboard() {
  const [allStudents, setAllStudents]   = useState([]);
  const [allAnalytics, setAllAnalytics] = useState([]);
  const [todayAtt, setTodayAtt]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedSection, setSelectedSection] = useState(""); // "" = All

  // Use a ref so the refreshBus subscription always calls the latest load()
  // without needing to re-subscribe every render (fixes stale closure bug)
  const loadRef = useRef(null);

  const load = useCallback(async () => {
    // Compute today inside load() using LOCAL timezone (not UTC)
    const today = getLocalToday();
    setLoading(true);
    try {
      const [studentsRes, analyticsRes, attRes] = await Promise.all([
        api.get("/students/"),
        api.get("/analytics/"),
        api.get(`/attendance/?date=${today}`),
      ]);
      setAllStudents(studentsRes.data.students    || []);
      setAllAnalytics(analyticsRes.data.analytics || []);
      setTodayAtt(attRes.data.attendance          || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []); // no deps — today is computed inside

  // Keep ref always pointing to latest load
  useEffect(() => { loadRef.current = load; }, [load]);

  useEffect(() => {
    load();
    // Subscribe via ref so the listener is never stale
    const unsub = refreshBus.on(() => loadRef.current?.());
    return unsub;
  }, []); // run once only

  // ── Memoized derived values — only recompute when source data changes ──
  const allSections = useMemo(
    () =>
      [...new Set(allStudents.map((s) => s.section || s.course || "").filter(Boolean))].sort(),
    [allStudents]
  );

  const students = useMemo(
    () =>
      selectedSection
        ? allStudents.filter((s) => (s.section || s.course || "") === selectedSection)
        : allStudents,
    [allStudents, selectedSection]
  );

  const studentIds = useMemo(() => new Set(students.map((s) => s.id)), [students]);

  const filteredAtt = useMemo(
    () => todayAtt.filter((a) => studentIds.has(a.student_id)),
    [todayAtt, studentIds]
  );

  const filteredAnalytics = useMemo(
    () =>
      selectedSection
        ? allAnalytics.filter((a) => {
            const s = allStudents.find((st) => st.id === a.id);
            return s && (s.section || s.course || "") === selectedSection;
          })
        : allAnalytics,
    [allAnalytics, allStudents, selectedSection]
  );

  // ── Compute stats ──
  const presentToday = useMemo(
    () => filteredAtt.filter((a) => a.status === "Present").length,
    [filteredAtt]
  );
  const absentToday = useMemo(
    () => filteredAtt.filter((a) => a.status === "Absent").length,
    [filteredAtt]
  );
  const lateToday = useMemo(
    () => filteredAtt.filter((a) => a.status === "Late").length,
    [filteredAtt]
  );
  const markedToday = filteredAtt.length;

  const avgPct = useMemo(
    () =>
      filteredAnalytics.length > 0
        ? (
            filteredAnalytics.reduce((sum, a) => sum + (a.percentage || 0), 0) /
            filteredAnalytics.length
          ).toFixed(1)
        : "0.0",
    [filteredAnalytics]
  );

  const atRisk = useMemo(
    () => filteredAnalytics.filter((a) => a.status === "Critical").length,
    [filteredAnalytics]
  );

  if (loading) return <InlineLoader label="Loading dashboard…" />;


  return (
    <div className="page-content">

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {selectedSection ? `Section: ${selectedSection} · ` : ""}
            Overview for{" "}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>

        {/* Section Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            id="dashboard-section-filter"
            className="form-control form-select"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{ width: 220, marginBottom: 0 }}
          >
            <option value="">All Sections ({allStudents.length})</option>
            {allSections.map((sec) => {
              const count = allStudents.filter(
                (s) => (s.section || s.course || "") === sec
              ).length;
              return (
                <option key={sec} value={sec}>
                  {sec} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="stat-cards-grid">
        <StatCard
          icon="👥"
          label={selectedSection ? "Students in Section" : "Total Students"}
          value={students.length}
          accent="var(--color-primary)"
          accentBg="var(--color-primary-dim)"
        />
        <StatCard
          icon="✅"
          label="Present Today"
          value={presentToday}
          accent="var(--color-success)"
          accentBg="var(--color-success-dim)"
        />
        <StatCard
          icon="❌"
          label="Absent Today"
          value={absentToday}
          accent="var(--color-danger)"
          accentBg="var(--color-danger-dim)"
        />
        <StatCard
          icon="🕐"
          label="Late Today"
          value={lateToday}
          accent="var(--color-warning)"
          accentBg="var(--color-warning-dim)"
        />
        <StatCard
          icon="📊"
          label="Avg Attendance %"
          value={`${avgPct}%`}
          accent="var(--color-primary)"
          accentBg="var(--color-primary-dim)"
        />
        <StatCard
          icon="⚠️"
          label="At Risk Students"
          value={atRisk}
          accent="var(--color-danger)"
          accentBg="var(--color-danger-dim)"
        />
      </div>

      {/* ── Bottom Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>

        {/* Today's Summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              📋 Today's Summary
              {selectedSection && (
                <span style={{
                  marginLeft: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  background: "var(--color-primary-dim)",
                  padding: "2px 8px",
                  borderRadius: 999,
                }}>
                  {selectedSection}
                </span>
              )}
            </h2>
            <span className="badge badge-primary">
              {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
            </span>
          </div>

          {markedToday === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              {selectedSection
                ? `No attendance marked yet for ${selectedSection} today.`
                : "No attendance marked yet for today. Go to the "
              }
              {!selectedSection && (
                <a href="/attendance" style={{ color: "var(--color-primary)" }}>Attendance</a>
              )}{!selectedSection && " page to mark it."}
            </p>
          ) : (
            <div>
              {[
                { label: "Present", value: presentToday, color: "var(--color-success)" },
                { label: "Absent",  value: absentToday,  color: "var(--color-danger)"  },
                { label: "Late",    value: lateToday,    color: "var(--color-warning)"  },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${markedToday ? (value / markedToday) * 100 : 0}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Attendance rate */}
              <div style={{
                marginTop: 16,
                padding: "10px 14px",
                background: "var(--bg-input)",
                borderRadius: "var(--border-radius-sm)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Today's Attendance Rate</span>
                <span style={{
                  fontWeight: 800,
                  fontSize: 16,
                  color: presentToday / markedToday >= 0.75 ? "var(--color-success)" : "var(--color-danger)",
                }}>
                  {markedToday ? ((presentToday / markedToday) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">⚡ Quick Actions</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { to: "/attendance", icon: "✅", label: "Mark Today's Attendance" },
              { to: "/students",   icon: "➕", label: "Manage Students & Sections"  },
              { to: "/analytics",  icon: "📈", label: "View Analytics Charts"   },
              { to: "/prediction", icon: "🤖", label: "Run AI Prediction"        },
              { to: "/reports",    icon: "📄", label: "Download Reports"         },
            ].map(({ to, icon, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  background: "var(--bg-input)",
                  borderRadius: "var(--border-radius-sm)",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  border: "1px solid var(--border-color)",
                  transition: "all 0.2s ease",
                }}
              >
                <span>{icon}</span> {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
