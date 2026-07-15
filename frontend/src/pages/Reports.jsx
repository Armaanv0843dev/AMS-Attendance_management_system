// pages/Reports.jsx — Generate and download PDF and Excel reports.

import { useState } from "react";
import { useToast } from "../components/Toast";
import api from "../services/api";

export default function Reports() {
  const [loadingPdf,   setLoadingPdf]   = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const toast = useToast();

  /**
   * Trigger a file download by fetching the blob from Flask and using a temporary <a>.
   */
  const downloadFile = async (endpoint, mimeType, ext, setLoading) => {
    setLoading(true);
    try {
      const response = await api.get(endpoint, {
        responseType: "blob",
        headers: { Accept: mimeType },
      });

      const blob = response.data;
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `attendance_report_${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${ext.toUpperCase()} report downloaded!`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const REPORT_TYPES = [
    {
      icon: "📄",
      title: "PDF Report",
      desc: "A professionally formatted PDF with student info, attendance %, ML predictions, and personalized suggestions. Perfect for printing or sharing.",
      btnLabel: "Download PDF",
      btnClass: "btn-danger",
      loading: loadingPdf,
      onClick: () => downloadFile("/report/pdf", "application/pdf", "pdf", setLoadingPdf),
      id: "download-pdf-btn",
    },
    {
      icon: "📊",
      title: "Excel Report",
      desc: "A color-coded Excel spreadsheet with summary stats, per-student data, risk status, and a raw attendance sheet. Great for data analysis.",
      btnLabel: "Download Excel",
      btnClass: "btn-success",
      loading: loadingExcel,
      onClick: () => downloadFile("/report/excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx", setLoadingExcel),
      id: "download-excel-btn",
    },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">
            Generate and download comprehensive attendance reports
          </p>
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          background: "var(--color-primary-dim)",
          border: "1px solid rgba(79, 70, 229, 0.3)",
          borderRadius: "var(--border-radius-sm)",
          padding: "14px 18px",
          fontSize: 13,
          color: "var(--text-secondary)",
          marginBottom: 28,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: 18 }}>💡</span>
        <div>
          Reports include <strong style={{ color: "var(--text-primary)" }}>real-time data</strong> fetched
          directly from Supabase, processed through Pandas analytics, and augmented with AI predictions.
          Make sure you have marked attendance before generating reports.
        </div>
      </div>

      {/* Report cards */}
      <div className="reports-grid">
        {REPORT_TYPES.map((r) => (
          <div className="report-card" key={r.title}>
            <div className="report-icon">{r.icon}</div>
            <h2 className="report-title">{r.title}</h2>
            <p className="report-desc">{r.desc}</p>
            <button
              id={r.id}
              className={`btn ${r.btnClass} btn-lg`}
              style={{ width: "100%" }}
              onClick={r.onClick}
              disabled={r.loading}
            >
              {r.loading ? (
                <><span className="spinner spinner-sm" /> Generating…</>
              ) : (
                <>⬇️ {r.btnLabel}</>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* What's included */}
      <div className="card" style={{ marginTop: 28 }}>
        <div className="card-header">
          <h2 className="card-title">📋 What's Included in Reports</h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {[
            { icon: "👥", title: "Student Information", desc: "Name, roll number, course, and semester details." },
            { icon: "📊", title: "Attendance Statistics", desc: "Present, absent, and late counts with percentage." },
            { icon: "🤖", title: "AI Predictions", desc: "Predicted future attendance % and risk classification." },
            { icon: "💡", title: "Suggestions", desc: "Personalized action suggestions for each student." },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              style={{
                background: "var(--bg-input)",
                borderRadius: "var(--border-radius-sm)",
                padding: 16,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14, marginBottom: 4 }}>
                  {title}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
