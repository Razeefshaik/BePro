import { useState } from "react";
import Icon from "../components/Icon.jsx";
import { Logo, ThemeToggle, tintFor } from "../components/common.jsx";
import { sessionProgress } from "../state/selectors.js";
import { LEVEL_LABELS, GOAL_LABELS, GOAL } from "../../shared/profile.js";

const LEVEL_OPTIONS = [
  { value: "beginner", icon: "stairs1", hint: "Starts from the basics" },
  { value: "intermediate", icon: "stairs2", hint: "Quick check, then deeper" },
  { value: "pro", icon: "stairs3", hint: "Edge cases and tradeoffs" },
];

const GOAL_OPTIONS = [
  { value: "master", icon: "star", hint: `${GOAL.master.modules} stops, every detail` },
  { value: "mid", icon: "target", hint: `${GOAL.mid.modules} stops, solid grasp` },
  { value: "crash", icon: "bolt", hint: `${GOAL.crash.modules} stops, the essentials` },
];

const EXAMPLES = ["TCP congestion control", "How vaccines work", "SQL joins", "The French Revolution", "Big O notation"];
const NOTES_MAX = 12000;

export default function StartScreen({ state, actions, theme, toggleTheme, demo }) {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [level, setLevel] = useState("beginner");
  const [goal, setGoal] = useState("mid");
  const [touched, setTouched] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // phones only: the sidebar is a drawer

  // Inline validation: same rules as the server, so bad input never costs a model call.
  const tooShort = topic.trim().length < 3 && notes.trim().length < 20;
  const tooLong = notes.length > NOTES_MAX;
  const error = tooLong ? `Notes can be at most ${NOTES_MAX.toLocaleString()} characters.` : tooShort ? "Type at least 3 characters, or add some notes." : "";

  function submit(event) {
    event.preventDefault();
    setTouched(true);
    if (error) return;
    actions.startLearning({ topic, notes: showNotes ? notes : "", level, goal });
  }

  return (
    <div className="start">
      <div className="start-bg" aria-hidden="true" />

      <Sidebar state={state} actions={actions} open={sidebarOpen} onClose={() => setSidebarOpen(false)} theme={theme} toggleTheme={toggleTheme} />

      <div className="start-content">
        <header className="start-top">
          <button className="icon-btn sidebar-toggle" onClick={() => setSidebarOpen(true)} aria-label="Your learnings">
            <Icon name="menu" />
          </button>
          <span className="start-top-logo">
            <Logo />
          </span>
          <span className="start-top-theme">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </span>
        </header>

        <main className="start-main">
          <div className="wordmark" aria-hidden="true">
            BEPRO
          </div>

          <section className="hero">
            <h1>
              What do you want to <em>learn</em> today?
            </h1>
            <p className="muted">Pick your level and goal. We build the map, you flip the cards.</p>
            {demo && (
              <p className="demo-note" role="note">
                <Icon name="alert" size={14} /> Demo mode: no AI model is set up, so the cards are sample content. Add one in <code>.env</code>.
              </p>
            )}
          </section>

          <form className="start-form" onSubmit={submit} noValidate>
            {/* The wrapper holds a soft glow that moves around the box (see .prompt-glow). */}
            <div className="prompt-wrap">
              <span className="prompt-glow" aria-hidden="true" />
              <div className={`prompt glass ${touched && error ? "has-error" : ""}`}>
                <label htmlFor="topic" className="sr-only">
                  Topic
                </label>
                <input
                  id="topic"
                  className="prompt-input"
                  placeholder="Type what you want to learn.."
                  value={topic}
                  maxLength={200}
                  autoComplete="off"
                  onChange={(e) => setTopic(e.target.value)}
                  onBlur={() => topic && setTouched(true)}
                  aria-invalid={touched && Boolean(error)}
                  aria-describedby="topic-error"
                />
                {showNotes && (
                  <div className="notes-box">
                    <label htmlFor="notes" className="notes-label">
                      Your notes <span className="muted">(cards will quote them)</span>
                    </label>
                    <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="Paste lecture notes, an article, a chapter..." />
                    <span className={`count ${tooLong ? "over" : ""}`}>
                      {notes.length.toLocaleString()} / {NOTES_MAX.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="prompt-row">
                  <button type="button" className="btn btn-dashed" onClick={() => setShowNotes((v) => !v)} aria-expanded={showNotes}>
                    <Icon name={showNotes ? "close" : "plus"} size={15} />
                    {showNotes ? "Remove notes" : "Add your notes"}
                  </button>
                  <button type="submit" className="btn btn-primary build-btn">
                    Build my road map <Icon name="arrowRight" size={16} />
                  </button>
                </div>
              </div>
            </div>
            <p id="topic-error" className="field-error" role={touched && error ? "alert" : undefined}>
              {touched && error ? (
                <>
                  <Icon name="alert" size={14} /> {error}
                </>
              ) : null}
            </p>

            <div className="choices">
              <ChoiceStack label="I am" name="level" options={LEVEL_OPTIONS} labels={LEVEL_LABELS} value={level} onChange={setLevel} />
              <ChoiceStack label="I want to" name="goal" options={GOAL_OPTIONS} labels={GOAL_LABELS} value={goal} onChange={setGoal} />
            </div>

            <div className="examples">
              <span className="muted">Try</span>
              {EXAMPLES.map((ex) => (
                <button type="button" key={ex} className="chip" onClick={() => setTopic(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

// Full-height left sidebar with saved learnings, like a chat app's history list.
function Sidebar({ state, actions, open, onClose, theme, toggleTheme }) {
  const sessions = state.order.map((id) => state.sessions[id]);

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Your learnings">
        <div className="sidebar-head">
          <Logo />
          <button className="icon-btn icon-btn-sm sidebar-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </div>

        <button
          className="btn btn-primary sidebar-new"
          onClick={() => {
            onClose();
            document.getElementById("topic")?.focus();
          }}
        >
          <Icon name="plus" size={16} stroke={2.4} /> New learning
        </button>

        <div className="sidebar-label">
          <span className="eyebrow">Your learnings</span>
          {sessions.length > 0 && <span className="muted">{sessions.length}</span>}
        </div>

        <div className="sidebar-list">
          {sessions.length === 0 ? (
            <p className="saved-empty muted">Nothing saved yet. Your road maps show up here, so you can pick up where you left off.</p>
          ) : (
            <ul className="saved-list">
              {sessions.map((s, i) => {
                const p = sessionProgress(s);
                const title = s.plan.data?.title || s.input.topic || "Your notes";
                return (
                  <li key={s.id} className="saved-item">
                    <button className="saved-open" onClick={() => actions.dispatch({ type: "SESSION_OPEN", id: s.id })}>
                      <span className={`saved-tile tint-${tintFor(i)} ${p.percent === 100 ? "is-done" : ""}`}>
                        {p.percent === 100 ? <Icon name="check" size={16} stroke={3} /> : `${p.percent}%`}
                      </span>
                      <span className="saved-text">
                        <span className="saved-title">{title}</span>
                        <span className="bar" aria-hidden="true">
                          <span style={{ width: `${p.percent}%` }} className={p.percent === 100 ? "bar-done" : ""} />
                        </span>
                        <span className="saved-next">
                          <span>{p.next}</span>
                        </span>
                        <span className="saved-meta">
                          {LEVEL_LABELS[s.input.level]} · {GOAL_LABELS[s.input.goal]}
                        </span>
                      </span>
                    </button>
                    <button
                      className="icon-btn icon-btn-sm saved-delete"
                      aria-label={`Delete ${title}`}
                      onClick={() => {
                        if (window.confirm("Delete this learning and its progress?")) actions.dispatch({ type: "SESSION_DELETE", id: s.id });
                      }}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="sidebar-foot">
          <span className="muted">Theme</span>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </aside>
    </>
  );
}

// One row of options per question (styled like a segmented control); the chosen one is highlighted.
function ChoiceStack({ label, name, options, labels, value, onChange }) {
  return (
    <fieldset className="choice-group">
      <legend className="eyebrow">{label}</legend>
      <div className="stack glass">
        {options.map((opt) => {
          const on = value === opt.value;
          return (
            <label key={opt.value} className={`stack-row ${on ? "is-on" : ""}`}>
              <input type="radio" name={name} value={opt.value} checked={on} onChange={() => onChange(opt.value)} className="sr-only" />
              <span className="stack-icon">
                <Icon name={opt.icon} size={16} />
              </span>
              <span className="stack-text">
                <span className="stack-title">{labels[opt.value]}</span>
                <span className="stack-hint">{opt.hint}</span>
              </span>
              <span className="stack-radio" aria-hidden="true">
                {on && <Icon name="check" size={12} stroke={3.5} />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
