// components/Sidebar.jsx — Navigation sidebar with active route highlighting.
//
// Optimization: Now uses AuthContext instead of calling
// supabase.auth.getSession() independently on mount. This eliminates
// a redundant async call that previously happened on every page load.

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfileModal from "./ProfileModal";
import UserAvatar from "./UserAvatar";

const NAV_ITEMS = [
  { to: "/dashboard",  icon: "📊", label: "Dashboard"    },
  { to: "/students",   icon: "👥", label: "Students"     },
  { to: "/attendance", icon: "✅", label: "Attendance"   },
  { to: "/analytics",  icon: "📈", label: "Analytics"   },
  { to: "/prediction", icon: "🤖", label: "AI Prediction"},
  { to: "/reports",    icon: "📄", label: "Reports"      },
];

export default function Sidebar() {
  const [showProfile, setShowProfile] = useState(false);
  const { email, displayName } = useAuth();

  const shortName = displayName || (email ? email.split("@")[0] : "User");

  return (
    <>
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📋</div>
          <div className="sidebar-logo-text">
            AMS
            <span>Attendance Manager</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Card */}
        <div className="sidebar-footer">
          <button
            className="sidebar-profile-card"
            onClick={() => setShowProfile(true)}
            id="sidebar-profile-card-btn"
            title="View / Edit Profile"
          >
            <UserAvatar size={34} />
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">{shortName}</div>
              <div className="sidebar-profile-hint">Edit Profile</div>
            </div>
            <span className="sidebar-profile-chevron">›</span>
          </button>
        </div>
      </aside>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}
