// "This session" card, top left of the learning page.
// The Index already shows the stops and where you are, so this card shows what the Index can't:
//   - a ring with how much of the whole road map is done
//   - quiz accuracy (green / amber / pink by level, always with the number)
//   - cards you know, out of the cards you rated
//   - how long you've been studying in this visit
//   - the retest pile, with a button to start it
import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import { stops, isModuleDone, overallScore, retestPile } from "../state/selectors.js";

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

function accuracyTone(percent, answered) {
  if (answered === 0) return "none";
  if (percent >= 85) return "good";
  if (percent >= 60) return "ok";
  return "low";
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
  const tone = accuracyTone(score.percent, score.total);

  // The ring: a circle whose visible length is the share of stops done.
  const radius = 34;
  const length = 2 * Math.PI * radius;

  return (
    <section className="session panel" aria-label="This session">
      <div className="session-ring" role="img" aria-label={`${done} of ${all.length} stops done`}>
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <circle className="ring-track" cx="40" cy="40" r={radius} />
          {done > 0 && <circle className="ring-value" cx="40" cy="40" r={radius} strokeDasharray={`${(done / all.length) * length} ${length}`} />}
        </svg>
        <span className="ring-text">
          <strong>{percent}%</strong>
          <span>
            {done}/{all.length} stops
          </span>
        </span>
      </div>

      <div className="session-stats">
        <div className={`stat stat-${tone}`}>
          <span className="stat-label">
            <Icon name="target" size={13} /> Accuracy
          </span>
          <strong>{score.total ? `${score.percent}%` : "–"}</strong>
          <span className="stat-sub">{score.total ? `${score.correct} of ${score.total} right` : "No answers yet"}</span>
        </div>
        <div className="stat">
          <span className="stat-label">
            <Icon name="check" size={13} stroke={2.6} /> Cards known
          </span>
          <strong>{rated ? `${score.cardsGot}/${rated}` : "–"}</strong>
          <span className="stat-sub">{rated ? `${score.cardsReview} to review` : "Rate a card"}</span>
        </div>
        <div className="stat">
          <span className="stat-label">
            <Icon name="clock" size={13} /> Studying
          </span>
          <strong>{minutes < 1 ? "<1" : minutes} min</strong>
          <span className="stat-sub">this visit</span>
        </div>
        <div className={`stat stat-pile ${pileCount ? "has-pile" : ""}`}>
          <span className="stat-label">
            <Icon name="redo" size={13} /> Retest pile
          </span>
          <strong>{pileCount}</strong>
          {pileCount > 0 && onRetest ? (
            <button className="stat-action" onClick={onRetest}>
              Retest now <Icon name="arrowRight" size={13} />
            </button>
          ) : (
            <span className="stat-sub">{pileCount ? "In retest" : "All clear"}</span>
          )}
        </div>
      </div>
    </section>
  );
}
