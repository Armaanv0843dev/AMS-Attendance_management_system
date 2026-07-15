// App.jsx — Root application with React Router, auth guard, and layout shell.
//
// Optimizations applied:
// 1. Lazy loading: each page is now a separate JS chunk (better initial load time)
// 2. AuthContext: session + user info shared via context (eliminates redundant
//    supabase.auth.getSession() calls in Sidebar & Navbar)
// 3. WakeupBanner: friendly notice when Render backend is cold-starting

import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { supabase } from "./services/supabase";
import { ToastProvider } from "./components/Toast";
import { FullPageLoader } from "./components/Loader";
import { AuthContext } from "./context/AuthContext";
import { pingBackend } from "./services/wakeup";

import Sidebar from "./components/Sidebar";
import Navbar  from "./components/Navbar";

/**
 * WakeupBanner — Shows a friendly notice while Render's free-tier backend
 * wakes from sleep (cold start can take 30–90 seconds).
 * Auto-dismisses once the backend responds.
 */
function WakeupBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner after 2 seconds if backend hasn't responded yet
    const timer = setTimeout(() => setVisible(true), 2000);
    pingBackend().then(() => {
      clearTimeout(timer);
      setVisible(false);
    });
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: "linear-gradient(90deg, #f59e0b, #d97706)",
      color: "#1c1917",
      padding: "10px 20px",
      textAlign: "center",
      fontSize: "0.875rem",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    }}>
      <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span>
      Server is waking up from sleep (Render free tier) — this may take up to 60 seconds…
    </div>
  );
}

// Lazy-loaded pages — each becomes its own JS chunk, reducing initial bundle size
const Login      = lazy(() => import("./pages/Login"));
const Register   = lazy(() => import("./pages/Register"));
const Dashboard  = lazy(() => import("./pages/Dashboard"));
const Students   = lazy(() => import("./pages/Students"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Analytics  = lazy(() => import("./pages/Analytics"));
const Prediction = lazy(() => import("./pages/Prediction"));
const Reports    = lazy(() => import("./pages/Reports"));

/**
 * Layout shell — wraps all protected pages with Sidebar + Navbar.
 */
function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <Suspense fallback={<FullPageLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute — redirects to /login if user is not authenticated.
 */
function ProtectedRoute({ session }) {
  if (session === undefined) return <FullPageLoader />; // still loading
  if (!session)              return <Navigate to="/login" replace />;
  return <Outlet />;
}

/**
 * PublicRoute — redirects to /dashboard if already logged in.
 */
function PublicRoute({ session }) {
  if (session === undefined) return <FullPageLoader />;
  if (session)               return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null);
    });

    // Listen for auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Derive user info once here — Sidebar & Navbar consume this via context
  const authValue = useMemo(() => {
    const user = session?.user ?? null;
    return {
      session,
      user,
      email: user?.email ?? "",
      displayName:
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split("@")[0] ||
        "",
    };
  }, [session]);

  return (
    <AuthContext.Provider value={authValue}>
      <ToastProvider>
        <WakeupBanner />
        <BrowserRouter>
          <Routes>
            {/* Public routes (redirect to dashboard if already logged in) */}
            <Route element={<PublicRoute session={session} />}>
              <Route path="/login"    element={<Suspense fallback={<FullPageLoader />}><Login /></Suspense>}    />
              <Route path="/register" element={<Suspense fallback={<FullPageLoader />}><Register /></Suspense>} />
            </Route>

            {/* Protected routes with app layout */}
            <Route element={<ProtectedRoute session={session} />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard"  element={<Dashboard />}  />
                <Route path="/students"   element={<Students />}   />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/analytics"  element={<Analytics />}  />
                <Route path="/prediction" element={<Prediction />} />
                <Route path="/reports"    element={<Reports />}    />
              </Route>
            </Route>

            {/* Default redirect */}
            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<Navigate to="/login"    replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthContext.Provider>
  );
}
