// pages/Attendance.jsx — Mark attendance for a selected date, with course-wise section filter.

import { useEffect, useState, useMemo, useCallback } from "react";
import AttendanceTable from "../components/AttendanceTable";
import { InlineLoader } from "../components/Loader";
import { useToast } from "../components/Toast";
import api from "../services/api";
import refreshBus from "../services/refreshBus";
import { getLocalToday } from "../utils/date";

export default function Attendance() {
  const today = getLocalToday();
  const [date, setDate]             = useState(today);
  const [students, setStudents]     = useState([]);
  const [attendance, setAttendance] = useState({}); // { student_id: status }
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [selectedSection, setSelectedSection] = useState(""); // "" = All
  const toast = useToast();

  // Load students once
  useEffect(() => {
    api.get("/students/")
      .then((res) => setStudents(res.data.students || []))
      .catch(() => toast.error("Failed to load students."));
  }, []);

  // Load existing attendance when date changes
  useEffect(() => {
    if (!students.length) return;
    loadAttendanceForDate(date);
  }, [date, students]);

  const loadAttendanceForDate = async (d) => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await api.get(`/attendance/?date=${d}`);
      const existingRecords = res.data.attendance || [];

      // Build map from existing records
      const map = {};
      existingRecords.forEach((r) => {
        map[r.student_id] = r.status;
      });

      // Default to "Absent" for any students not yet marked
      const finalMap = {};
      students.forEach((s) => {
        finalMap[s.id] = map[s.id] || "Absent";
      });

      setAttendance(finalMap);
    } catch {
      toast.error("Failed to load attendance for this date.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = useCallback((studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
    setSaved(false);
  }, []);

  // ── Save only the visible (filtered) students ──
  const handleSave = async () => {
    const targetStudents = filteredStudents;
    if (!targetStudents.length) {
      toast.error("No students to save attendance for.");
      return;
    }

    setSaving(true);
    try {
      const records = targetStudents.map((s) => ({
        student_id: s.id,
        status:     attendance[s.id] || "Absent",
      }));

      await api.post("/attendance/", { date, records });
      setSaved(true);
      toast.success(
        selectedSection
          ? `Attendance saved for ${selectedSection} (${records.length} students)!`
          : `Attendance saved for all ${records.length} students!`
      );
      // Small delay so Supabase write fully propagates before other pages refetch
      setTimeout(() => refreshBus.emit(), 300);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  // ── Compute unique sections/courses from students ──
  const allSections = useMemo(
    () =>
      [...new Set(students.map((s) => s.section || s.course || "").filter(Boolean))].sort(),
    [students]
  );

  // ── Filter students by selected section ──
  const filteredStudents = useMemo(
    () =>
      selectedSection
        ? students.filter((s) => (s.section || s.course || "") === selectedSection)
        : students,
    [students, selectedSection]
  );

  // ── Live stats for visible students ──
  const presentCount = useMemo(
    () => filteredStudents.filter((s) => attendance[s.id] === "Present").length,
    [filteredStudents, attendance]
  );
  const absentCount = useMemo(
    () => filteredStudents.filter((s) => attendance[s.id] === "Absent").length,
    [filteredStudents, attendance]
  );
  const lateCount = useMemo(
    () => filteredStudents.filter((s) => attendance[s.id] === "Late").length,
    [filteredStudents, attendance]
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mark Attendance</h1>
          <p className="page-subtitle">Select a date and section, then mark status for each student</p>
        </div>
      </div>

      {/* ── Controls: Date + Section Filter + Save ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>

          {/* Date picker */}
          <div>
            <label className="form-label">Select Date</label>
            <input
              id="attendance-date-picker"
              type="date"
              className="form-control"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: 200 }}
            />
          </div>

          {/* Section / Course filter */}
          <div>
            <label className="form-label">Filter by Section / Course</label>
            <select
              id="attendance-section-filter"
              className="form-control form-select"
              value={selectedSection}
              onChange={(e) => { setSelectedSection(e.target.value); setSaved(false); }}
              style={{ width: 240 }}
            >
              <option value="">All Students ({students.length})</option>
              {allSections.map((sec) => {
                const count = students.filter((s) => (s.section || s.course || "") === sec).length;
                return (
                  <option key={sec} value={sec}>
                    {sec} ({count} students)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Save button */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              id="save-attendance-btn"
              className="btn btn-success"
              onClick={handleSave}
              disabled={saving || loading || !filteredStudents.length}
            >
              {saving ? (
                <><span className="spinner spinner-sm" /> Saving…</>
              ) : (
                `💾 Save${selectedSection ? ` (${filteredStudents.length})` : " Attendance"}`
              )}
            </button>
            {saved && (
              <span style={{ color: "var(--color-success)", fontSize: 14, fontWeight: 600 }}>
                ✅ Saved!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Attendance Table Card ── */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              Attendance —{" "}
              {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
              {selectedSection && (
                <span style={{
                  marginLeft: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  background: "var(--color-primary-dim)",
                  padding: "2px 10px",
                  borderRadius: 999,
                }}>
                  {selectedSection}
                </span>
              )}
            </h2>
          </div>

          {/* Live Stats */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ color: "var(--color-success)", fontWeight: 700, fontSize: 14 }}>
              {presentCount} Present
            </span>
            <span style={{ color: "var(--color-danger)", fontWeight: 700, fontSize: 14 }}>
              {absentCount} Absent
            </span>
            <span style={{ color: "var(--color-warning)", fontWeight: 700, fontSize: 14 }}>
              {lateCount} Late
            </span>
            <span className="badge badge-primary">{filteredStudents.length} students</span>
          </div>
        </div>

        {loading ? (
          <InlineLoader label="Loading attendance…" />
        ) : (
          <AttendanceTable
            students={filteredStudents}
            attendance={attendance}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </div>
  );
}
