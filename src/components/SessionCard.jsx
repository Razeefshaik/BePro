// The session card, top left of the learning page, drawn as a "hero" card:
// a gradient card with a header row and a glass panel inside it.
//   header: what you're learning, level and goal, and a round Retest button (with the pile count)
//   panel:  a big number (share of the road map done) with a ring, then three numbers with small bars:
//           accuracy, cards known, minutes studying (against a 15 minute goal)
// The Index already shows the stops and where you are, so nothing here repeats it.
import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import { stops, isModuleDone, overallScore, retestPile } from "../state/selectors.js";
import { LEVEL_LABELS, GOAL_LABELS } from "../../shared/profile.js";

const GOAL_MINUTES = 15;

// Minutes since the learning page opened. Updates every 15 seconds, enough for a minute counter.
function useStudyMinutes() {
  const [started] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  return Math.floor((now - started) / 60000);
}

// Accuracy level in a word, so the meaning never depends on the bar color alone.
function accuracyLevel(percent, answered) {
  if (answered === 0) return { word: "No answers yet", tone: "none" };
  if (percent >= 85) return { word: "strong", tone: "good" };
  if (percent >= 60) return { word: "okay", tone: "ok" };
  return { word: "low", tone: "low" };
}

function Metric({ label, value, sub, ratio, tone = "none" }) {
  return (
    <div className={`hero-metric tone-${tone}`}>
      <strong>{value}</strong>
      <span className="hero-metric-label">{label}</span>
      <span className="hero-bar" aria-hidden="true">
        <span style={{ width: `${Math.round(Math.min(1, ratio) * 100)}%` }} />
      </span>
      <span className="sr-only">{sub}</span>
    </div>
  );
}

export default function SessionCard({ session, onRetest }) {
  const minutes = useStudyMinutes();
  const all = stops(session);
  const done = all.filter((s) => isModuleDone(session, s.id)).length;
  const percent = Math.round((done / all.length) * 100);
  const score = overallScore(session);
  const rated = score.cardsGot + score.cardsReview;
  const pile = retestPile(session);
  const pileCount = pile.cards.length + pile.questions.length;
  const level = accuracyLevel(score.percent, score.total);

  // The ring: a circle whose visible length is the share of stops done.
  const radius = 26;
  const length = 2 * Math.PI * radius;

  return (
    <section className="session-hero" aria-label="This session">
      <header className="hero-head">
        <span className="hero-avatar" aria-hidden="true">
          <Icon name="cap" size={20} />
        </span>
        <div className="hero-titles">
          <strong>Your session</strong>
          <span>
            {LEVEL_LABELS[session.input.level]} · {GOAL_LABELS[session.input.goal]}
          </span>
        </div>
        <button
          className={`hero-retest ${pileCount ? "has-pile" : ""}`}
          onClick={onRetest ?? undefined}
          disabled={!pileCount || !onRetest}
          aria-label={pileCount ? `Retest the ${pileCount} in your pile` : "Retest pile is empty"}
          title={pileCount ? "Retest now" : "Retest pile is empty"}
        >
          <Icon name="redo" size={18} />
          {pileCount > 0 && <span className="hero-badge">{pileCount}</span>}
        </button>
      </header>

      <div className="hero-glass">
        <div className="hero-top">
          <div className="hero-big">
            <strong>{percent}%</strong>
            <span>
              Road map done · {done} of {all.length} stops
            </span>
          </div>
          <div className="hero-ring" aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <circle className="hero-ring-track" cx="32" cy="32" r={radius} />
              {done > 0 && <circle className="hero-ring-value" cx="32" cy="32" r={radius} strokeDasharray={`${(done / all.length) * length} ${length}`} />}
            </svg>
            <span className="hero-ring-icon">
              <Icon name="road" size={18} />
            </span>
          </div>
        </div>

        <div className="hero-metrics">
          <Metric
            label={score.total ? `Accuracy · ${level.word}` : "Accuracy"}
            value={score.total ? `${score.percent}%` : "–"}
            sub={score.total ? `${score.correct} of ${score.total} right` : "No answers yet"}
            ratio={score.total ? score.correct / score.total : 0}
            tone={level.tone}
          />
          <Metric
            label="Cards known"
            value={rated ? `${score.cardsGot}/${rated}` : "–"}
            sub={rated ? `${score.cardsReview} to review` : "No cards rated yet"}
            ratio={rated ? score.cardsGot / rated : 0}
          />
          <Metric label={`Studying · goal ${GOAL_MINUTES}`} value={`${minutes < 1 ? "<1" : minutes} min`} sub="this visit" ratio={minutes / GOAL_MINUTES} />
        </div>
      </div>
    </section>
  );
}
