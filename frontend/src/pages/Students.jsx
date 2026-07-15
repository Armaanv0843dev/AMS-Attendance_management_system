// pages/Students.jsx — Student management with section-wise view, auto-assign, and section creation.

import { useEffect, useState, useMemo, useCallback } from "react";
import StudentTable from "../components/StudentTable";
import SectionCard from "../components/SectionCard";
import { InlineLoader } from "../components/Loader";
import { useToast } from "../components/Toast";
import api from "../services/api";

const INITIAL_FORM = { name: "", roll_no: "", email: "", course: "", semester: "", section: "" };

export default function Students() {
  const [students, setStudents]           = useState([]);
  const [sections, setSections]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [form, setForm]                   = useState(INITIAL_FORM);
  const [errors, setErrors]               = useState({});
  const [saving, setSaving]               = useState(false);
  const [showForm, setShowForm]           = useState(false);
  const [activeTab, setActiveTab]         = useState("all"); // "all" | "sections"
  const [newSectionMode, setNewSectionMode] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  // Auto-assign panel state
  const [showAssign, setShowAssign]       = useState(false);
  const [assigning, setAssigning]         = useState(false);

  // Section-view edit/delete state (passed to SectionCard)
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingId, setDeletingId]         = useState(null);

  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studRes, secRes] = await Promise.all([
        api.get("/students/"),
        api.get("/sections/"),
      ]);
      setStudents(studRes.data.students || []);
      setSections(secRes.data.sections || []);
    } catch {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  // ── Validation ──────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name is required.";
    if (!form.roll_no.trim()) e.roll_no = "Roll number is required.";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email format.";
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSectionSelect = (e) => {
    if (e.target.value === "__new__") {
      setNewSectionMode(true);
      setForm({ ...form, section: "" });
    } else {
      setNewSectionMode(false);
      setForm({ ...form, section: e.target.value });
    }
  };

  // ── Add Student ─────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    let finalSection = form.section;

    // Create new section if user typed one
    if (newSectionMode && newSectionName.trim()) {
      try {
        const res = await api.post("/sections/", { name: newSectionName.trim() });
        const created = res.data.section;
        setSections((prev) => [...prev, created]);
        finalSection = newSectionName.trim();
      } catch {
        // Section might already exist — just use the name
        finalSection = newSectionName.trim();
      }
    }

    setSaving(true);
    try {
      const res = await api.post("/students/", { ...form, section: finalSection || null });
      setStudents((prev) => [...prev, res.data.student]);
      setForm(INITIAL_FORM);
      setNewSectionMode(false);
      setNewSectionName("");
      setShowForm(false);
      toast.success("Student added successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add student.");
    } finally {
      setSaving(false);
    }
  };

  // ── Auto-Assign Sections by Course ──────────────────────────
  const handleAutoAssign = async () => {
    setAssigning(true);
    try {
      const res = await api.post("/students/assign-sections", {});
      toast.success(res.data.message);
      await loadData();
      setShowAssign(false);
      setActiveTab("sections");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to assign sections.");
    } finally {
      setAssigning(false);
    }
  };

  // ── Student update / delete (shared by table + section cards) ─
  const handleStudentUpdated = useCallback((updated) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
  }, []);

  const handleStudentDeleted = useCallback((id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ── Section-wise grouping ────────────────────────────────────
  const grouped = useMemo(() => students.reduce((acc, s) => {
    const key = s.section || "__unassigned__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {}), [students]);

  const sectionKeys = useMemo(
    () => Object.keys(grouped).filter((k) => k !== "__unassigned__").sort(),
    [grouped]
  );
  const unassigned = useMemo(() => grouped["__unassigned__"] || [], [grouped]);

  // ── Stats ────────────────────────────────────────────────────
  const assignedCount = useMemo(
    () => students.filter((s) => s.section).length,
    [students]
  );

  return (
    <div className="page-content">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Management</h1>
          <p className="page-subtitle">
            {students.length} students &nbsp;·&nbsp;
            {sections.length} section{sections.length !== 1 ? "s" : ""} &nbsp;·&nbsp;
            {assignedCount} assigned
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-outline"
            onClick={() => setShowAssign(!showAssign)}
            id="toggle-assign-btn"
          >
            {showAssign ? "✕ Close" : "⚡ Assign Sections"}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { setShowForm(!showForm); setShowAssign(false); }}
            id="toggle-add-student-btn"
          >
            {showForm ? "✕ Cancel" : "➕ Add Student"}
          </button>
        </div>
      </div>

      {/* ── Assign by Course Panel ── */}
      {showAssign && (
        <div
          className="card"
          style={{
            marginBottom: 24,
            animation: "slideUp 0.2s ease",
            background: "linear-gradient(135deg, rgba(79,70,229,0.08), rgba(99,102,241,0.04))",
            border: "1px solid rgba(79,70,229,0.3)",
          }}
        >
          <div className="card-header" style={{ marginBottom: 8 }}>
            <h2 className="card-title">📚 Assign Sections by Course</h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
            Har student ka <strong style={{ color: "var(--text-secondary)" }}>Course</strong> field padh ke automatically section assign hoga.
            Jis course mein jitne students hain, sab ek section mein aayenge.
          </p>

          {/* Course preview */}
          {students.length > 0 && (() => {
            const courseMap = students.reduce((acc, s) => {
              const c = s.course || "Unassigned";
              acc[c] = (acc[c] || 0) + 1;
              return acc;
            }, {});
            return (
              <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(courseMap).map(([course, count]) => (
                  <div
                    key={course}
                    style={{
                      background: "var(--color-primary-dim)",
                      border: "1px solid rgba(79,70,229,0.3)",
                      borderRadius: 8,
                      padding: "6px 14px",
                      fontSize: 13,
                      color: "var(--color-primary-hover)",
                      fontWeight: 600,
                    }}
                  >
                    {course} — {count} student{count !== 1 ? "s" : ""}
                  </div>
                ))}
              </div>
            );
          })()}

          <button
            className="btn btn-primary"
            onClick={handleAutoAssign}
            disabled={assigning || students.length === 0}
            id="auto-assign-btn"
          >
            {assigning ? <><span className="spinner spinner-sm" /> Assigning…</> : "📚 Assign by Course"}
          </button>
        </div>
      )}

      {/* ── Add Student Form ── */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24, animation: "slideUp 0.2s ease" }}>
          <div className="card-header">
            <h2 className="card-title">Add New Student</h2>
          </div>
          <form onSubmit={handleAdd} noValidate>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {[
                { name: "name",     label: "Full Name *",   placeholder: "John Doe" },
                { name: "roll_no",  label: "Roll Number *", placeholder: "CS001" },
                { name: "email",    label: "Email",         placeholder: "john@example.com" },
                { name: "course",   label: "Course",        placeholder: "B.Sc Computer Science" },
                { name: "semester", label: "Semester",      placeholder: "3rd" },
              ].map(({ name, label, placeholder }) => (
                <div className="form-group" key={name} style={{ marginBottom: 0 }}>
                  <label className="form-label">{label}</label>
                  <input
                    id={`add-student-${name}`}
                    className={`form-control${errors[name] ? " error" : ""}`}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                  />
                  {errors[name] && <p className="form-error">{errors[name]}</p>}
                </div>
              ))}

              {/* Section Dropdown */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Section</label>
                <select
                  id="add-student-section"
                  className="form-control form-select"
                  value={newSectionMode ? "__new__" : form.section}
                  onChange={handleSectionSelect}
                >
                  <option value="">— No Section —</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                  <option value="__new__">➕ Create New Section…</option>
                </select>
              </div>

              {/* New Section Name input */}
              {newSectionMode && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">New Section Name</label>
                  <input
                    id="new-section-name-input"
                    className="form-control"
                    placeholder="e.g. E or Science-A"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                id="add-student-submit-btn"
              >
                {saving ? <><span className="spinner spinner-sm" /> Adding…</> : "Add Student"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowForm(false);
                  setForm(INITIAL_FORM);
                  setErrors({});
                  setNewSectionMode(false);
                  setNewSectionName("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab Switcher ── */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20 }}>
        {[
          { key: "all",      label: `👥 All Students (${students.length})` },
          { key: "sections", label: `📂 By Section (${sectionKeys.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            id={`tab-${key}`}
            onClick={() => setActiveTab(key)}
            style={{
              padding: "10px 24px",
              background: activeTab === key ? "var(--color-primary)" : "var(--bg-card)",
              color: activeTab === key ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border-color)",
              borderRight: key === "all" ? "none" : undefined,
              borderRadius: key === "all" ? "8px 0 0 8px" : "0 8px 8px 0",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── All Students Tab ── */}
      {activeTab === "all" && (
        <div className="card">
          {loading ? (
            <InlineLoader label="Loading students…" />
          ) : (
            <StudentTable
              students={students}
              sections={sections}
              onStudentUpdated={handleStudentUpdated}
              onStudentDeleted={handleStudentDeleted}
            />
          )}
        </div>
      )}

      {/* ── By Section Tab ── */}
      {activeTab === "sections" && (
        <div>
          {loading ? (
            <div className="card"><InlineLoader label="Loading sections…" /></div>
          ) : sectionKeys.length === 0 && unassigned.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📂</div>
                <div className="empty-state-text">
                  Koi section nahi mila. "⚡ Assign Sections" button use karo students divide karne ke liye.
                </div>
              </div>
            </div>
          ) : (
            <>
              {sectionKeys.map((sec, idx) => (
                <SectionCard
                  key={sec}
                  sectionName={sec}
                  students={grouped[sec]}
                  colorIndex={idx}
                  onEditStudent={(student) => {
                    // Open edit modal via StudentTable trick — we'll manage locally
                    setEditingStudent(student);
                  }}
                  onDeleteStudent={async (student) => {
                    if (!window.confirm(`Delete "${student.name}"? This will also delete all their attendance records.`)) return;
                    setDeletingId(student.id);
                    try {
                      await api.delete(`/students/${student.id}`);
                      handleStudentDeleted(student.id);
                      toast.success("Student deleted.");
                    } catch (err) {
                      toast.error(err.response?.data?.error || "Failed to delete.");
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  deletingId={deletingId}
                />
              ))}

              {/* Unassigned students */}
              {unassigned.length > 0 && (
                <SectionCard
                  sectionName="?"
                  students={unassigned}
                  onEditStudent={setEditingStudent}
                  onDeleteStudent={async (student) => {
                    if (!window.confirm(`Delete "${student.name}"?`)) return;
                    setDeletingId(student.id);
                    try {
                      await api.delete(`/students/${student.id}`);
                      handleStudentDeleted(student.id);
                      toast.success("Student deleted.");
                    } catch (err) {
                      toast.error(err.response?.data?.error || "Failed to delete.");
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  deletingId={deletingId}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ── Edit Modal (for section view) ── */}
      {editingStudent && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditingStudent(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Edit Student</h3>
              <button className="modal-close" onClick={() => setEditingStudent(null)}>✕</button>
            </div>
            <EditStudentForm
              student={editingStudent}
              sections={sections}
              onSave={(updated) => {
                handleStudentUpdated(updated);
                setEditingStudent(null);
              }}
              onClose={() => setEditingStudent(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline edit form component for section-view modal ──────────
function EditStudentForm({ student, sections, onSave, onClose }) {
  const [form, setForm] = useState({ ...student });
  const [saving, setSaving] = useState(false);
  const [newSectionMode, setNewSectionMode] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalSection = form.section;
    if (newSectionMode && newSectionName.trim()) {
      try {
        await api.post("/sections/", { name: newSectionName.trim() });
      } catch { /* already exists */ }
      finalSection = newSectionName.trim();
    }
    setSaving(true);
    try {
      const res = await api.put(`/students/${student.id}`, { ...form, section: finalSection || null });
      toast.success("Student updated.");
      onSave(res.data.student);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {[
        { name: "name",     label: "Full Name",   placeholder: "John Doe" },
        { name: "roll_no",  label: "Roll Number", placeholder: "CS001" },
        { name: "email",    label: "Email",       placeholder: "john@example.com" },
        { name: "course",   label: "Course",      placeholder: "B.Sc Computer Science" },
        { name: "semester", label: "Semester",    placeholder: "3rd" },
      ].map(({ name, label, placeholder }) => (
        <div className="form-group" key={name}>
          <label className="form-label">{label}</label>
          <input
            className="form-control"
            name={name}
            value={form[name] || ""}
            onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
            placeholder={placeholder}
          />
        </div>
      ))}
      <div className="form-group">
        <label className="form-label">Section</label>
        <select
          className="form-control form-select"
          value={newSectionMode ? "__new__" : (form.section || "")}
          onChange={(e) => {
            if (e.target.value === "__new__") { setNewSectionMode(true); }
            else { setNewSectionMode(false); setForm({ ...form, section: e.target.value }); }
          }}
        >
          <option value="">— No Section —</option>
          {sections.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
          <option value="__new__">➕ Create New Section…</option>
        </select>
      </div>
      {newSectionMode && (
        <div className="form-group">
          <label className="form-label">New Section Name</label>
          <input
            className="form-control"
            placeholder="e.g. E"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            autoFocus
          />
        </div>
      )}
      <div className="modal-footer">
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <><span className="spinner spinner-sm" /> Saving…</> : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
