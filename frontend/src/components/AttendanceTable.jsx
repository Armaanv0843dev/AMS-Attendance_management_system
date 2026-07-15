// components/AttendanceTable.jsx — Per-student attendance status selector.
// Used on the Attendance page to mark Present / Absent / Late.
//
// Optimizations:
// 1. AttendanceRow is memoized with React.memo — a single student's row only
//    re-renders when *its own* status changes, not when other students change.
// 2. counts is memoized with useMemo — avoids full Object.values scan every render.

import { memo, useMemo } from "react";

const STATUS_OPTIONS = ["Present", "Absent", "Late"];

/**
 * A single student attendance row — memoized to prevent unnecessary re-renders.
 * Only re-renders when this specific student's status changes.
 */
const AttendanceRow = memo(function AttendanceRow({ student, idx, currentStatus, onStatusChange }) {
  return (
    <div className="attendance-row">
      {/* Student info */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--color-primary-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-primary)",
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {idx + 1}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              color: "var(--text-primary)",
              fontSize: 14,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {student.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {student.roll_no} · {student.course || "—"}
          </div>
        </div>
      </div>

      {/* Status selector */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            className={`attendance-status-btn ${currentStatus === status ? status.toLowerCase() : ""}`}
            onClick={() => onStatusChange(student.id, status)}
            id={`attendance-${student.id}-${status.toLowerCase()}`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
});

/**
 * @param {Array}  students         — List of student objects
 * @param {Object} attendance       — { [student_id]: "Present"|"Absent"|"Late" }
 * @param {Function} onStatusChange — (studentId, newStatus) => void
 */
export default function AttendanceTable({ students, attendance, onStatusChange }) {
  if (!students.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <div className="empty-state-text">No students found. Add students first.</div>
      </div>
    );
  }

  // Memoized counts — avoids full Object.values scan on every render
  const counts = useMemo(
    () => ({
      Present: Object.values(attendance).filter((s) => s === "Present").length,
      Absent:  Object.values(attendance).filter((s) => s === "Absent").length,
      Late:    Object.values(attendance).filter((s) => s === "Late").length,
    }),
    [attendance]
  );

  return (
    <div>
      {/* Quick summary bar */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Present", count: counts.Present, color: "var(--color-success)" },
          { label: "Absent",  count: counts.Absent,  color: "var(--color-danger)"  },
          { label: "Late",    count: counts.Late,    color: "var(--color-warning)" },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--border-radius-sm)",
              padding: "8px 18px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
            }}
          >
            <span style={{ fontWeight: 700, color, fontSize: 18 }}>{count}</span>
            <span style={{ color: "var(--text-muted)" }}>{label}</span>
          </div>
        ))}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--border-radius-sm)",
            padding: "8px 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
          }}
        >
          <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 18 }}>
            {students.length}
          </span>
          <span style={{ color: "var(--text-muted)" }}>Total</span>
        </div>
      </div>

      {/* Student rows — each row is memoized individually */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {students.map((student, idx) => (
          <AttendanceRow
            key={student.id}
            student={student}
            idx={idx}
            currentStatus={attendance[student.id] || "Absent"}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
