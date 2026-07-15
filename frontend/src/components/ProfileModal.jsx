// components/ProfileModal.jsx — User profile modal with edit and logout options.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useToast } from "./Toast";
import UserAvatar from "./UserAvatar";

export default function ProfileModal({ onClose }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("profile"); // "profile" | "password"

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user;
      if (u) {
        setUser(u);
        setEmail(u.email || "");
        setDisplayName(u.user_metadata?.full_name || u.user_metadata?.name || "");
      }
    });
  }, []);

  /* ---- Save profile ---- */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updates = {};
      if (email !== user.email) updates.email = email;
      if (displayName !== (user.user_metadata?.full_name || "")) {
        updates.data = { full_name: displayName };
      }

      if (Object.keys(updates).length === 0) {
        toast.info("No changes to save.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      toast.success("Profile updated successfully!");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  /* ---- Change password ---- */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  /* ---- Logout ---- */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully.");
      navigate("/login");
    } catch {
      toast.error("Failed to log out.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="profile-modal-overlay">
      <div
        className="profile-modal"
        onClick={(e) => e.stopPropagation()}
        id="profile-modal"
      >
        {/* Header */}
        <div className="profile-modal-header">
          <UserAvatar size={52} style={{ boxShadow: "0 4px 16px rgba(79,70,229,0.45)" }} />
          <div className="profile-modal-info">
            <div className="profile-modal-name">
              {displayName || email.split("@")[0]}
            </div>
            <div className="profile-modal-email">{email}</div>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            id="profile-modal-close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab${tab === "profile" ? " active" : ""}`}
            onClick={() => setTab("profile")}
            id="profile-tab-btn"
          >
            ✏️ Edit Profile
          </button>
          <button
            className={`profile-tab${tab === "password" ? " active" : ""}`}
            onClick={() => setTab("password")}
            id="password-tab-btn"
          >
            🔒 Change Password
          </button>
        </div>

        {/* Profile Tab */}
        {tab === "profile" && (
          <form onSubmit={handleSaveProfile} className="profile-form">
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">
                Display Name
              </label>
              <input
                id="profile-name"
                className="form-control"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">
                Email Address
              </label>
              <input
                id="profile-email"
                className="form-control"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={loading}
              id="profile-save-btn"
            >
              {loading ? "Saving…" : "💾 Save Changes"}
            </button>
          </form>
        )}

        {/* Password Tab */}
        {tab === "password" && (
          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">
                New Password
              </label>
              <input
                id="new-password"
                className="form-control"
                type="password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                className="form-control"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={loading}
              id="password-change-btn"
            >
              {loading ? "Updating…" : "🔑 Update Password"}
            </button>
          </form>
        )}

        {/* Logout Footer */}
        <div className="profile-modal-footer">
          <button
            className="btn btn-danger"
            style={{ width: "100%" }}
            onClick={handleLogout}
            id="profile-logout-btn"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}
