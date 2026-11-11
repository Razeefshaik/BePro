// Small shared pieces used by several screens.
import { Component, useEffect, useState } from "react";
import Icon from "./Icon.jsx";

export function Logo({ compact = false }) {
  return (
    <span className="logo">
      <svg width="32" height="32" viewBox="0 0 40 40" aria-hidden="true">
        <rect x="2" y="2" width="36" height="36" rx="12" fill="var(--action)" />
        <path d="M11 25 L23 13 L28 18 L16 30 Z" fill="var(--focus)" />
        <path d="M10 31 h20" stroke="var(--good-fill)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {!compact && <span className="logo-word">BePro</span>}
    </span>
  );
}

export function ThemeToggle({ theme, onToggle }) {
  const night = theme === "night";
  return (
    <button className="icon-btn" onClick={onToggle} aria-label={night ? "Switch to Meadow (light) theme" : "Switch to Night (dark) theme"} title={night ? "Meadow theme" : "Night theme"}>
      <Icon name={night ? "sun" : "moon"} />
    </button>
  );
}

// Seconds since `active` turned true. Used for "Taking longer than usual".
export function useElapsed(active) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    setSeconds(0);
    if (!active) return undefined;
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return seconds;
}

const BANNER_ICON = { error: "alert", info: "info", partial: "layers", slow: "clock", warn: "warn", good: "check" };

export function StatusBanner({ kind = "info", title, children, actions = [], role }) {
  return (
    <div className={`banner banner-${kind}`} role={role ?? (kind === "error" ? "alert" : "status")}>
      <Icon name={BANNER_ICON[kind]} size={18} className="banner-icon" />
      <div className="banner-body">
        {title && <strong>{title}</strong>}
        {children && <span>{children}</span>}
      </div>
      {actions.length > 0 && (
        <div className="banner-actions">
          {actions.map((a) => (
            <button key={a.label} className={a.primary ? "btn btn-sm btn-primary" : "btn btn-sm btn-ghost"} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Loading text that turns into "Taking longer than usual" with Try again and Cancel after 20 s.
export function LoadingNotice({ label, onRetry, onCancel }) {
  const seconds = useElapsed(true);
  if (seconds < 20) {
    return (
      <div className="loading-line" role="status">
        <span className="spinner" aria-hidden="true" />
        {label}
      </div>
    );
  }
  return (
    <StatusBanner
      kind="slow"
      title="Taking longer than usual"
      actions={[
        ...(onRetry ? [{ label: "Try again", onClick: onRetry, primary: true }] : []),
        ...(onCancel ? [{ label: "Cancel", onClick: onCancel }] : []),
      ]}
    >
      {label} {seconds}s
    </StatusBanner>
  );
}

// Plain words for every error code the client can see.
export function errorText(error) {
  if (!error) return "Something went wrong.";
  return error.message || "Something went wrong.";
}

export function Skeleton({ width = "100%", height = 14, radius = 10, className = "" }) {
  return <span className={`skeleton ${className}`} style={{ width, height, borderRadius: radius }} aria-hidden="true" />;
}

// The only class component: React needs a class to catch render errors.
// It makes sure a bug never leaves a blank screen.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("[BePro] render error", error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="crash">
        <Logo />
        <h1>Something broke on this screen.</h1>
        <p>Your sessions are saved. Reloading usually fixes it.</p>
        <div className="row">
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
          <button className="btn btn-ghost" onClick={() => this.setState({ failed: false })}>
            Try this screen again
          </button>
        </div>
      </div>
    );
  }
}

// Cards cycle through the palette, LangUp style.
export const TINTS = ["lavender", "aqua", "meadow", "butter", "blush", "peach"];
export const tintFor = (index) => TINTS[((index % TINTS.length) + TINTS.length) % TINTS.length];

// Background decoration for tinted cards: a big soft star like the reference cards.
export function CardDeco() {
  return (
    <svg className="card-deco" viewBox="0 0 200 200" aria-hidden="true">
      <path d="M100 8l22 58 62 4-48 40 16 60-52-34-52 34 16-60-48-40 62-4z" />
    </svg>
  );
}
