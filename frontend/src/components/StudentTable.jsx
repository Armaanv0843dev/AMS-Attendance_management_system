// components/StudentTable.jsx — Searchable student table with Edit/Delete + Section column.

import { useState } from "react";
import { useToast } from "./Toast";
import api from "../services/api";

function EditModal({ student, onClose, onSave, sections }) {
  const [form, setForm] = useState({ ...student });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [newSectionMode, setNewSectionMode] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const toast = useToast();

  const validate = () => {
    const e = {};
    if (!form.name?.trim())    e.name    = "Name is required.";
    if (!form.roll_no?.trim()) e.roll_no = "Roll number is required.";
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSectionChange = (e) => {
    if (e.target.value === "__new__") {
      setNewSectionMode(true);
    } else {
      setNewSectionMode(false);
      setForm({ ...form, section: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    let finalSection = form.section;

    // Create new section if needed
    if (newSectionMode && newSectionName.trim()) {
      try {
        await api.post("/sections/", { name: newSectionName.trim() });
        finalSection = newSectionName.trim();
      } catch (err) {
        // Section might already exist, that's OK — just use the name
        finalSection = newSectionName.trim();
      }
    }

    setSaving(true);
    try {
      const res = await api.put(`/students/${student.id}`, { ...form, section: finalSection });
      toast.success("Student updated successfully.");
      onSave(res.data.student);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update student.");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { name: "name",     label: "Full Name",    placeholder: "John Doe" },
    { name: "roll_no",  label: "Roll Number",  placeholder: "CS001" },
    { name: "email",    label: "Email",        placeholder: "john@example.com" },
    { name: "course",   label: "Course",       placeholder: "B.Sc Computer Science" },
    { name: "semester", label: "Semester",     placeholder: "3rd" },
  ];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Edit Student</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {fields.map(({ name, label, placeholder }) => (
            <div className="form-group" key={name}>
              <label className="form-label">{label}</label>
              <input
                className={`form-control${errors[name] ? " error" : ""}`}
                name={name}
                value={form[name] || ""}
                onChange={handleChange}
                placeholder={placeholder}
              />
              {errors[name] && <p className="form-error">{errors[name]}</p>}
            </div>
          ))}

          {/* Section selector */}
          <div className="form-group">
            <label className="form-label">Section</label>
            <select
              className="form-control form-select"
              value={newSectionMode ? "__new__" : (form.section || "")}
              onChange={handleSectionChange}
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
                placeholder="e.g. E or Science"
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
      </div>
    </div>
  );
}

export default function StudentTable({ students, onStudentUpdated, onStudentDeleted, sections = [] }) {
  const [search, setSearch] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const toast = useToast();

  const filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_no?.toLowerCase().includes(search.toLowerCase()) ||
      s.course?.toLowerCase().includes(search.toLowerCase()) ||
      s.section?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete "${student.name}"? This will also delete all their attendance records.`)) return;
    setDeletingId(student.id);
    try {
      await api.delete(`/students/${student.id}`);
      toast.success("Student deleted.");
      onStudentDeleted(student.id);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete student.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 16, maxWidth: 360 }}>
        <span className="search-icon">🔍</span>
        <input
          className="form-control"
          placeholder="Search by name, roll no, course, section…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="student-search-input"
        />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Roll No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Semester</th>
              <th>Section</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <div className="empty-state-text">
                      {search ? "No students match your search." : "No students yet. Add one above!"}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((student, idx) => (
                <tr key={student.id}>
                  <td style={{ color: "var(--text-muted)", width: 40 }}>{idx + 1}</td>
                  <td>
                    <span className="badge badge-primary">{student.roll_no}</span>
                  </td>
                  <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{student.name}</td>
                  <td>{student.email || "—"}</td>
                  <td>{student.course || "—"}</td>
                  <td>{student.semester || "—"}</td>
                  <td>
                    {student.section ? (
                      <span className="badge badge-primary" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>
                        {student.section}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setEditingStudent(student)}
                        id={`edit-student-${student.id}`}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(student)}
                        disabled={deletingId === student.id}
                        id={`delete-student-${student.id}`}
                      >
                        {deletingId === student.id ? "…" : "🗑️ Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <EditModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={onStudentUpdated}
          sections={sections}
        />
      )}
    </>
  );
}
