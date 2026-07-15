// components/Navbar.jsx — Top navigation bar with title and user info.
//
// Optimization: Now uses AuthContext instead of calling
// supabase.auth.getSession() independently on mount.

import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./UserAvatar";

// Map routes to human-readable titles
const TITLES = {
  "/dashboard":  "Dashboard",
  "/students":   "Student Management",
  "/attendance": "Mark Attendance",
  "/analytics":  "Analytics",
  "/prediction": "AI Prediction",
  "/reports":    "Reports",
};

export default function Navbar() {
  const location = useLocation();
  const { email, displayName } = useAuth();
  const title = TITLES[location.pathname] || "AMS";

  const dateStr = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []); // compute once on mount

  return (
    <header className="navbar">
      <div className="navbar-title">{title}</div>
      <div className="navbar-right">
        <span className="navbar-date">{dateStr}</span>
        <div className="navbar-user" id="navbar-user-info" title={email}>
          <span className="navbar-user-name">{displayName}</span>
          <UserAvatar size={36} />
        </div>
      </div>
    </header>
  );
}
