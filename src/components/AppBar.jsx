// Slim top bar on the working screens: the logo (home: all your learnings), an optional
// back button, the session title, then screen specific buttons and the theme toggle.
// New learnings start from the home screen's sidebar, not from here.
import Icon from "./Icon.jsx";
import { Logo, ThemeToggle } from "./common.jsx";

export default function AppBar({ session, actions, theme, toggleTheme, back, children }) {
  return (
    <header className="appbar">
      <button className="appbar-home" onClick={() => actions.dispatch({ type: "NEW_LEARNING" })} aria-label="Home: all learnings" title="All learnings">
        <Logo />
      </button>
      {back && (
        <button className="btn btn-ghost appbar-back" onClick={back.onClick} aria-label={back.label}>
          <Icon name="arrowLeft" size={16} /> <span className="appbar-back-text">{back.label}</span>
        </button>
      )}
      {session && <span className="appbar-title">{session.plan.data?.title || session.input.topic || "Your notes"}</span>}
      <div className="appbar-actions">
        {children}
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>
    </header>
  );
}
