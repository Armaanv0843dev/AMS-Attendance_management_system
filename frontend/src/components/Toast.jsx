// components/Toast.jsx — Global toast notification system.
// Usage: wrap app with <ToastProvider>, then use useToast() hook anywhere.

import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = { success: "✅", error: "❌", info: "ℹ️" };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
            role="alert"
            style={{ cursor: "pointer" }}
          >
            <span className="toast-icon">{icons[toast.type] || "ℹ️"}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook to show toast notifications.
 * @returns {{ success, error, info }} — call success("msg"), error("msg"), info("msg")
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");

  return {
    success: (msg) => ctx.addToast(msg, "success"),
    error:   (msg) => ctx.addToast(msg, "error"),
    info:    (msg) => ctx.addToast(msg, "info"),
  };
}
