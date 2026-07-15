// components/UserAvatar.jsx — Humanoid SVG avatar with gradient background.

/**
 * Renders a circular avatar with a humanoid (person) SVG icon.
 * size: pixel size of the circle (default 36)
 * className: extra class on the wrapper div
 */
export default function UserAvatar({ size = 36, className = "", style = {} }) {
  const iconScale = size / 36; // scale the inner SVG relative to base 36px

  return (
    <div
      className={`user-avatar-wrap ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4f46e5, #818cf8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      <svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Head */}
        <circle cx="12" cy="7.5" r="3.5" fill="white" fillOpacity="0.95" />
        {/* Body / shoulders */}
        <path
          d="M4.5 20.5c0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          fillOpacity="0.95"
        />
      </svg>
    </div>
  );
}
