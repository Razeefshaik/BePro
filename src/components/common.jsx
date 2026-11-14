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

// Background decorations for tinted cards. Each card gets a different shape so a
// deck doesn't look like the same card over and over. All drawn in a 200 x 200 box;
// "deco-line" parts are outlines, the rest are filled (see base.css).
const SPARKLE = "M100 20C106 84 116 94 180 100C116 106 106 116 100 180C94 116 84 106 20 100C84 94 94 84 100 20Z";
const DECOS = {
  star: <path d="M100 8l22 58 62 4-48 40 16 60-52-34-52 34 16-60-48-40 62-4z" />,
  flower: (
    <>
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <circle key={deg} cx={100 + 46 * Math.cos((deg * Math.PI) / 180)} cy={100 + 46 * Math.sin((deg * Math.PI) / 180)} r="36" />
      ))}
      <circle className="deco-hole" cx="100" cy="100" r="24" />
    </>
  ),
  rings: (
    <>
      <circle className="deco-line" cx="100" cy="100" r="84" />
      <circle className="deco-line" cx="100" cy="100" r="56" />
      <circle cx="100" cy="100" r="24" />
    </>
  ),
  sparkles: (
    <>
      <path d={SPARKLE} />
      <path d={SPARKLE} transform="translate(118 -6) scale(0.4)" />
      <path d={SPARKLE} transform="translate(-2 112) scale(0.3)" />
    </>
  ),
  waves: <path className="deco-line" d="M0 50q25-30 50 0t50 0 50 0 50 0M0 100q25-30 50 0t50 0 50 0 50 0M0 150q25-30 50 0t50 0 50 0 50 0" />,
  blob: <path d="M152 38c28 22 40 66 22 100s-62 54-98 42S14 132 22 92 58 22 92 18s34-2 60 20z" />,
  dots: (
    <>
      {[0, 1, 2, 3].flatMap((row) => [0, 1, 2, 3].map((col) => <circle key={`${row}${col}`} cx={25 + col * 50} cy={25 + row * 50} r="12" />))}
    </>
  ),
  arches: <path className="deco-line" d="M16 196a84 84 0 0 1 168 0M44 196a56 56 0 0 1 112 0M72 196a28 28 0 0 1 56 0" />,
};
export const DECO_NAMES = Object.keys(DECOS);
export const decoFor = (index) => DECO_NAMES[((index % DECO_NAMES.length) + DECO_NAMES.length) % DECO_NAMES.length];

export function CardDeco({ variant = "star" }) {
  const name = DECOS[variant] ? variant : "star";
  return (
    <svg className={`card-deco deco-${name}`} viewBox="0 0 200 200" aria-hidden="true">
      {DECOS[name]}
    </svg>
  );
}
