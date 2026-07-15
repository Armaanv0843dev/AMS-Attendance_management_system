// pages/Login.jsx — Supabase email/password login page.

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.email.trim())               e.email    = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password)                   e.password = "Password is required.";
    else if (form.password.length < 6)    e.password = "Password must be at least 6 characters.";
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email:    form.email,
      password: form.password,
    });
    setLoading(false);

    if (error) {
      setApiError(error.message || "Login failed. Please check your credentials.");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">📋</div>
          <span className="auth-logo-text">AMS</span>
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {/* Error alert */}
        {apiError && (
          <div
            style={{
              background: "var(--color-danger-dim)",
              border: "1px solid var(--color-danger)",
              color: "var(--color-danger)",
              borderRadius: "var(--border-radius-sm)",
              padding: "10px 14px",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            ❌ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              className={`form-control${errors.email ? " error" : ""}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              autoFocus
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              className={`form-control${errors.password ? " error" : ""}`}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner spinner-sm" /> Signing in…</>
            ) : (
              "Sign In →"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register" id="go-to-register-link">Create one</Link>
        </div>
      </div>
    </div>
  );
}
