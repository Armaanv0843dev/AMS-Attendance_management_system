// pages/Prediction.jsx — AI Prediction page with ML model results.

import { useEffect, useState } from "react";
import { InlineLoader } from "../components/Loader";
import { useToast } from "../components/Toast";
import api from "../services/api";

function PredictionCard({ prediction }) {
  const { name, roll_no, course, current_pct, predicted_pct, risk_status, suggestion } = prediction;
  const isAtRisk = risk_status === "At Risk";

  const trendIcon = predicted_pct > current_pct ? "📈" : predicted_pct < current_pct ? "📉" : "➡️";
  const trendColor =
    predicted_pct >= current_pct
      ? "var(--color-success)"
      : "var(--color-danger)";

  return (
    <div className={`prediction-card ${isAtRisk ? "at-risk" : "normal"}`}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
            {name}
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {roll_no} {course ? `· ${course}` : ""}
          </p>
        </div>
        <span className={`badge ${isAtRisk ? "badge-danger" : "badge-success"}`}>
          {isAtRisk ? "⚠️ At Risk" : "✅ Normal"}
        </span>
      </div>

      {/* Percentage row */}
      <div className="prediction-pct-row">
        <div className="pct-block">
          <div
            className="pct-value"
            style={{ color: current_pct >= 75 ? "var(--color-success)" : current_pct >= 60 ? "var(--color-warning)" : "var(--color-danger)" }}
          >
            {current_pct.toFixed(1)}%
          </div>
          <div className="pct-label">Current</div>
        </div>
        <div className="pct-arrow" style={{ color: trendColor }}>{trendIcon}</div>
        <div className="pct-block">
          <div
            className="pct-value"
            style={{ color: predicted_pct >= 75 ? "var(--color-success)" : predicted_pct >= 60 ? "var(--color-warning)" : "var(--color-danger)" }}
          >
            {predicted_pct.toFixed(1)}%
          </div>
          <div className="pct-label">Predicted</div>
        </div>
      </div>

      {/* Progress bar for current % */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(current_pct, 100)}%`,
            background: current_pct >= 75
              ? "var(--color-success)"
              : current_pct >= 60 ? "var(--color-warning)" : "var(--color-danger)",
          }}
        />
      </div>

      {/* Suggestion */}
      <div className="prediction-suggestion">{suggestion}</div>
    </div>
  );
}

export default function Prediction() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("All");
  const toast = useToast();

  useEffect(() => {
    api.get("/prediction/")
      .then((res) => setPredictions(res.data.predictions || []))
      .catch(() => toast.error("Failed to load predictions."))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "All"
      ? predictions
      : predictions.filter((p) => p.risk_status === filter);

  const atRiskCount = predictions.filter((p) => p.risk_status === "At Risk").length;
  const normalCount = predictions.filter((p) => p.risk_status === "Normal").length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">🤖 AI Prediction</h1>
          <p className="page-subtitle">
            Machine learning–powered attendance forecasting using Random Forest
          </p>
        </div>
      </div>

      {/* Summary + filter */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { label: "All Students", key: "All",     count: predictions.length, color: "var(--color-primary)" },
          { label: "Normal",       key: "Normal",  count: normalCount,        color: "var(--color-success)" },
          { label: "At Risk",      key: "At Risk", count: atRiskCount,        color: "var(--color-danger)"  },
        ].map(({ label, key, count, color }) => (
          <button
            key={key}
            className={`btn ${filter === key ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter(key)}
            id={`filter-${key.replace(" ", "-").toLowerCase()}-btn`}
          >
            {label}
            <span
              style={{
                background: filter === key ? "rgba(255,255,255,0.25)" : "var(--bg-input)",
                borderRadius: 999,
                padding: "1px 8px",
                fontSize: 12,
                marginLeft: 4,
                color: filter === key ? "white" : color,
                fontWeight: 700,
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Info box about the model */}
      <div
        style={{
          background: "var(--color-primary-dim)",
          border: "1px solid rgba(79, 70, 229, 0.3)",
          borderRadius: "var(--border-radius-sm)",
          padding: "12px 16px",
          fontSize: 13,
          color: "var(--text-secondary)",
          marginBottom: 24,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: 18 }}>ℹ️</span>
        <div>
          <strong style={{ color: "var(--text-primary)" }}>How it works: </strong>
          The model uses a{" "}
          <strong style={{ color: "var(--color-primary)" }}>Random Forest Regressor</strong> trained
          on present/absent/late counts and current attendance %. It predicts future attendance
          percentage and classifies students as <strong>Normal (≥75%)</strong> or{" "}
          <strong style={{ color: "var(--color-danger)" }}>At Risk (&lt;75%)</strong>.
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <InlineLoader label="Running AI predictions…" />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤖</div>
          <div className="empty-state-text">
            {predictions.length === 0
              ? "No students found. Add students and mark attendance first."
              : "No students match this filter."}
          </div>
        </div>
      ) : (
        <div className="prediction-grid">
          {filtered
            .sort((a, b) => a.current_pct - b.current_pct) // at-risk first
            .map((p) => (
              <PredictionCard key={p.id} prediction={p} />
            ))}
        </div>
      )}
    </div>
  );
}
