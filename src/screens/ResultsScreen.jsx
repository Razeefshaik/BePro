import { useState } from "react";
import Icon from "../components/Icon.jsx";
import AppBar from "../components/AppBar.jsx";
import ScoreGauge from "../components/ScoreGauge.jsx";
import { StatusBanner } from "../components/common.jsx";
import { stops, moduleScore, overallScore, retestPile, weakSpots, isModuleDone } from "../state/selectors.js";

function verdict(percent, total) {
  if (total === 0) return { word: "Not started", tone: "todo" };
  if (percent >= 85) return { word: "Excellent", tone: "good" };
  if (percent >= 60) return { word: "Solid", tone: "focus" };
  return { word: "Keep practising", tone: "review" };
}

export default function ResultsScreen({ session, actions, theme, toggleTheme }) {
  const sessionId = session.id;
  const [saved, setSaved] = useState(null);
  const all = stops(session);
  const score = overallScore(session);
  const pile = retestPile(session);
  const pileCount = pile.cards.length + pile.questions.length;
  const weak = weakSpots(session);
  const v = verdict(score.percent, score.total);

  function retest() {
    actions.dispatch({ type: "START_RETEST", sessionId, cardIds: pile.cards.map((c) => c.id), questionIds: pile.questions.map((q) => q.id) });
  }

  // New questions on weak spots: a new stop on the road, built from the lowest scoring stops.
  function practiseWeakSpots() {
    const modules = session.plan.data.modules;
    const id = `weak${Date.now().toString(36)}`;
    actions.dispatch({
      type: "PLAN_INSERT",
      sessionId,
      id,
      index: modules.length, // just before the final test
      title: `Weak spots: ${weak.map((w) => w.title).join(", ")}`,
      summary: "Fresh questions on the stops you found hardest.",
      subtopics: weak.map((w) => w.title),
    });
    actions.dispatch({ type: "START_MODULE", sessionId, moduleId: id });
  }

  function save() {
    setSaved(actions.saveNow() ? "ok" : "fail");
  }

  return (
    <div className="calm-bg page results-page">
      <AppBar session={session} actions={actions} theme={theme} toggleTheme={toggleTheme}>
        <button className="btn btn-ghost hide-sm" onClick={() => actions.dispatch({ type: "GO", screen: "roadmap" })}>
          <Icon name="road" size={16} /> Road map
        </button>
      </AppBar>

      <main className="results">
        <div className="results-head">
          <div>
            <h1>
              Your <span className="hl-word">results</span>
            </h1>
            <span className="muted">{session.plan.data?.title}</span>
          </div>
          <div className="row">
            <button className="btn btn-ghost" onClick={save}>
              <Icon name="save" size={16} /> Save session
            </button>
            <button className="btn btn-ghost" onClick={practiseWeakSpots} disabled={weak.length === 0}>
              <Icon name="sparkle" size={16} /> New questions on weak spots
            </button>
          </div>
        </div>

        {saved === "ok" && <StatusBanner kind="good" title="Saved on this device">It also saves by itself as you go. Find it under Your learnings.</StatusBanner>}
        {saved === "fail" && <StatusBanner kind="error" title="Couldn't save">Your browser blocked storage (private window or full). The session still works until you close the tab.</StatusBanner>}

        <div className="results-grid">
          <section className="panel score-card">
            <div className="score-top">
              <span>Overall score</span>
              <span className={`verdict verdict-${v.tone}`}>
                <span className="verdict-dot" /> {v.word}
              </span>
            </div>
            <ScoreGauge percent={score.percent} label={`${score.correct} of ${score.total} right`} />
            <div className="score-split">
              <div className="split split-good">
                <span>
                  <Icon name="check" size={14} stroke={3} /> Cards got
                </span>
                <strong>{score.cardsGot}</strong>
              </div>
              <div className="split split-review">
                <span>
                  <Icon name="redo" size={14} stroke={2.6} /> To review
                </span>
                <strong>{score.cardsReview}</strong>
              </div>
            </div>
          </section>

          <section className="panel stops-card">
            <div className="score-top">
              <span>Score per stop</span>
              <span className="eyebrow">Road map</span>
            </div>
            <ol className="mini-road" style={{ "--stops": all.length }}>
              {all.map((stop, i) => {
                const s = moduleScore(session, stop.id);
                const done = isModuleDone(session, stop.id);
                const ratio = s.answered ? s.correct / s.answered : null;
                const tone = ratio === null ? "todo" : ratio >= 0.85 ? "good" : ratio >= 0.6 ? "focus" : "review";
                return (
                  <li key={stop.id} className={`mini-stop tone-${tone}`}>
                    <span className="ring" aria-hidden="true">
                      {s.answered ? `${s.correct}/${s.answered}` : done ? <Icon name="check" size={16} stroke={3} /> : i + 1}
                    </span>
                    <span className="mini-title">{stop.title}</span>
                    <span className="sr-only">{s.answered ? `${s.correct} of ${s.answered} right` : "not taken yet"}</span>
                    {tone === "review" && <span className="mini-flag">Weak spot</span>}
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="panel pile-card">
            <div className="score-top">
              <span>
                Retest pile <span className="muted">· {pileCount}</span>
              </span>
              <span className="muted pile-note">Wrong answers plus cards you marked Review again</span>
            </div>
            {pileCount === 0 ? (
              <p className="muted pile-empty">Nothing to retest. {score.total === 0 ? "Answer some questions first." : "Every answer was right and no card is marked for review."}</p>
            ) : (
              <ul className="pile">
                {pile.questions.map((q) => (
                  <li key={q.id}>
                    <span className="tag tag-question">Question</span>
                    <span className="pile-text">{q.type === "mcq" ? q.question : q.statement}</span>
                  </li>
                ))}
                {pile.cards.map((c) => (
                  <li key={c.id}>
                    <span className="tag tag-card">Card</span>
                    <span className="pile-text">{c.front}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="pile-foot">
              <span className="muted">Questions come back with the options reshuffled.</span>
              <button className="btn btn-highlight btn-lg" onClick={retest} disabled={pileCount === 0}>
                Retest the {pileCount} I missed <Icon name="arrowRight" />
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
