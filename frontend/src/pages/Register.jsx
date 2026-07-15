// pages/Register.jsx — Supabase email/password registration page.

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError]   = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())                 e.name     = "Name is required.";
    if (!form.email.trim())                e.email    = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password)                    e.password = "Password is required.";
    else if (form.password.length < 6)     e.password = "Password must be at least 6 characters.";
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
    const { error } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options:  { data: { full_name: form.name } },
    });
    setLoading(false);

    if (error) {
      setApiError(error.message || "Registration failed.");
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
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

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join AMS to manage attendance efficiently</p>

        {/* Success message */}
        {success && (
          <div
            style={{
              background: "var(--color-success-dim)",
              border: "1px solid var(--color-success)",
              color: "var(--color-success)",
              borderRadius: "var(--border-radius-sm)",
              padding: "12px 14px",
              fontSize: 13,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            ✅ Account created! Check your email to confirm. Redirecting to login…
          </div>
        )}

        {/* Error */}
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
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              name="name"
              type="text"
              className={`form-control${errors.name ? " error" : ""}`}
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              autoFocus
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              className={`form-control${errors.email ? " error" : ""}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              className={`form-control${errors.password ? " error" : ""}`}
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading || success}
          >
            {loading ? (
              <><span className="spinner spinner-sm" /> Creating account…</>
            ) : (
              "Create Account →"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" id="go-to-login-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
