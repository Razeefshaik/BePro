import { useState } from "react";
import Icon from "../components/Icon.jsx";
import { Logo, ThemeToggle } from "../components/common.jsx";
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

export default function StartScreen({ state, actions, theme, toggleTheme }) {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [level, setLevel] = useState("beginner");
  const [goal, setGoal] = useState("mid");
  const [touched, setTouched] = useState(false);

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

  const sessions = state.order.map((id) => state.sessions[id]);

  return (
    <div className="start">
      <div className="start-bg" aria-hidden="true">
        <span className="wordmark">BEPRO</span>
      </div>

      <header className="start-top">
        <Logo />
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <main className="start-main">
        <section className="hero">
          <span className="pill pill-glass">
            <Icon name="sparkle" size={14} /> Flashcard-first road maps
          </span>
          <h1>
            What do you want to <em>learn</em> today?
          </h1>
          <p className="muted">Pick your level and goal. We build the map, you flip the cards.</p>
        </section>

        <form className="start-form" onSubmit={submit} noValidate>
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
              <button type="submit" className="btn btn-primary btn-lg">
                Build my road map <Icon name="arrowRight" />
              </button>
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
            <ChoiceGroup label="I am" name="level" options={LEVEL_OPTIONS} labels={LEVEL_LABELS} value={level} onChange={setLevel} />
            <ChoiceGroup label="I want to" name="goal" options={GOAL_OPTIONS} labels={GOAL_LABELS} value={goal} onChange={setGoal} />
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

      <aside className="saved glass" aria-label="Your learnings">
        <div className="saved-head">
          <h2>Your learnings</h2>
          <span className="muted">{sessions.length || ""}</span>
        </div>
        {sessions.length === 0 ? (
          <p className="saved-empty muted">Nothing saved yet. Your road maps show up here, so you can pick up where you left off.</p>
        ) : (
          <ul className="saved-list">
            {sessions.map((s) => {
              const p = sessionProgress(s);
              return (
                <li key={s.id} className="saved-item">
                  <button className="saved-open" onClick={() => actions.dispatch({ type: "SESSION_OPEN", id: s.id })}>
                    <span className="saved-title">{s.plan.data?.title || s.input.topic || "Notes"}</span>
                    <span className="saved-meta">
                      {LEVEL_LABELS[s.input.level]} · {GOAL_LABELS[s.input.goal]}
                    </span>
                    <span className="bar" aria-hidden="true">
                      <span style={{ width: `${p.percent}%` }} className={p.percent === 100 ? "bar-done" : ""} />
                    </span>
                    <span className="saved-next">
                      <span>{p.next}</span>
                      <span className="muted">{p.percent}%</span>
                    </span>
                  </button>
                  <button
                    className="icon-btn icon-btn-sm saved-delete"
                    aria-label={`Delete ${s.plan.data?.title || s.input.topic}`}
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
      </aside>
    </div>
  );
}

function ChoiceGroup({ label, name, options, labels, value, onChange }) {
  return (
    <fieldset className="choice-group">
      <legend className="eyebrow">{label}</legend>
      {options.map((opt) => (
        <label key={opt.value} className={`tile ${value === opt.value ? "tile-on" : ""}`}>
          <input type="radio" name={name} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} className="sr-only" />
          <span className="tile-icon">
            <Icon name={opt.icon} size={18} />
          </span>
          <span className="tile-text">
            <span className="tile-title">{labels[opt.value]}</span>
            <span className="tile-hint">{opt.hint}</span>
          </span>
          {value === opt.value && (
            <span className="tile-check" aria-hidden="true">
              <Icon name="check" size={11} stroke={4} />
            </span>
          )}
        </label>
      ))}
    </fieldset>
  );
}
