// components/SectionCard.jsx — Collapsible card showing one section's students.

import { useState } from "react";

/** Generate a short 2-3 char abbreviation from a course/section name */
function getAbbr(name) {
  if (!name || name === "?") return "?";
  // Handle patterns like "B.Tech AI" → "BT", "B.Sc CS" → "BS", "MCA" → "MCA"
  const words = name.replace(/\./g, "").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  // Take first letter of each word, max 3
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

// Stable color palette — cycles through sections
const PALETTE = [
  { accent: "#4f46e5", bg: "rgba(79,70,229,0.12)" },
  { accent: "#10b981", bg: "rgba(16,185,129,0.12)" },
  { accent: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { accent: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  { accent: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  { accent: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  { accent: "#ec4899", bg: "rgba(236,72,153,0.12)" },
  { accent: "#f97316", bg: "rgba(249,115,22,0.12)" },
  { accent: "#14b8a6", bg: "rgba(20,184,166,0.12)" },
  { accent: "#6366f1", bg: "rgba(99,102,241,0.12)" },
];

export default function SectionCard({ sectionName, students, colorIndex = 0, onEditStudent, onDeleteStudent, deletingId }) {
  const [expanded, setExpanded] = useState(true);
  const color = PALETTE[colorIndex % PALETTE.length];
  const abbr  = getAbbr(sectionName);

  return (
    <div
      className="card"
      style={{
        marginBottom: 16,
        borderLeft: `3px solid ${color.accent}`,
        padding: 0,
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          cursor: "pointer",
          background: color.bg,
          borderBottom: expanded ? "1px solid var(--border-color)" : "none",
          transition: "background 0.2s ease",
        }}
        onClick={() => setExpanded(!expanded)}
        id={`section-card-${sectionName}`}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Icon — abbreviation only, fixed size */}
          <div
            style={{
              width: 44,
              height: 44,
              minWidth: 44,
              borderRadius: 10,
              background: color.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: abbr.length > 2 ? 11 : 14,
              color: "#fff",
              letterSpacing: "0.5px",
              flexShrink: 0,
            }}
          >
            {abbr}
          </div>

          {/* Title — course name directly, no "Section" prefix */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
              {sectionName === "?" ? "Unassigned" : sectionName}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {students.length} student{students.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Right side — count badge + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              background: color.accent,
              color: "#fff",
              borderRadius: 999,
              padding: "3px 12px",
              fontSize: 13,
              fontWeight: 700,
              minWidth: 32,
              textAlign: "center",
            }}
          >
            {students.length}
          </span>
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              display: "inline-block",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* ── Students Table ── */}
      {expanded && (
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ borderRadius: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Roll No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Semester</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <div className="empty-state-text">No students in this section.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => (
                  <tr key={student.id}>
                    <td style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                    <td>
                      <span className="badge badge-primary">{student.roll_no}</span>
                    </td>
                    <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{student.name}</td>
                    <td style={{ color: "var(--text-muted)" }}>{student.email || "—"}</td>
                    <td>{student.semester || "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => onEditStudent(student)}
                          id={`edit-section-student-${student.id}`}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => onDeleteStudent(student)}
                          disabled={deletingId === student.id}
                          id={`delete-section-student-${student.id}`}
                        >
                          {deletingId === student.id ? "…" : "🗑️"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
