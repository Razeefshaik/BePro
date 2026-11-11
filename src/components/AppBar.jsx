// Slim top bar on the working screens: home, the session title, then screen specific buttons.
import Icon from "./Icon.jsx";
import { Logo, ThemeToggle } from "./common.jsx";

export default function AppBar({ session, actions, theme, toggleTheme, children }) {
  return (
    <header className="appbar">
      <button className="appbar-home" onClick={() => actions.dispatch({ type: "NEW_LEARNING" })} aria-label="Home: all learnings">
        <Logo />
      </button>
      {session && <span className="appbar-title">{session.plan.data?.title || session.input.topic || "Your notes"}</span>}
      <div className="appbar-actions">
        {children}
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <button className="icon-btn" onClick={() => actions.dispatch({ type: "NEW_LEARNING" })} aria-label="New learning" title="New learning">
          <Icon name="plus" />
        </button>
      </div>
    </header>
  );
}
