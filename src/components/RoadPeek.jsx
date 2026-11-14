// The road map as a card on top of the current screen (like Sources), so the learner can
// see every stop and jump to one without leaving. "Edit road map" opens the full road map page.
import { useEffect } from "react";
import Icon from "./Icon.jsx";
import { tintFor } from "./common.jsx";
import { stops, isModuleDone, moduleScore, FINAL_ID } from "../state/selectors.js";

const PHASE_LABEL = { basics: "Basics and prereqs", deepdive: "Topic deep dive", test: "Test and quiz" };

export default function RoadPeek({ session, onPick, onOpenMap, onClose, showCurrent = true }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const all = stops(session);
  const doneCount = all.filter((s) => isModuleDone(session, s.id)).length;
  const current = showCurrent ? session.currentModuleId : null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal road-peek" role="dialog" aria-modal="true" aria-labelledby="peek-title">
        <div className="modal-head">
          <div className="peek-titles">
            <h2 id="peek-title">Road map</h2>
            <span className="muted">
              {doneCount} of {all.length} stops done
            </span>
          </div>
          <button className="icon-btn icon-btn-sm" onClick={onClose} aria-label="Close road map">
            <Icon name="close" size={16} />
          </button>
        </div>
        <span className="bar" aria-hidden="true">
          <span style={{ width: `${(doneCount / all.length) * 100}%` }} />
        </span>

        <ol className="peek-list">
          {all.map((stop, i) => {
            const done = isModuleDone(session, stop.id);
            const score = moduleScore(session, stop.id);
            const isCurrent = stop.id === current;
            const isFinal = stop.id === FINAL_ID;
            const tint = isFinal ? "aqua" : tintFor(i);
            const newPhase = i === 0 || all[i - 1].phase !== stop.phase;
            let meta = stop.minutes ? `${stop.minutes} min` : "";
            if (done) meta = score.total ? `${score.correct}/${score.total} right` : "Done";
            if (isCurrent) meta = "You are here";
            return (
              <li key={stop.id} className={`peek-stop ${isCurrent ? "is-current" : ""} ${done ? "is-done" : ""}`}>
                {newPhase && <span className="peek-phase">{PHASE_LABEL[stop.phase]}</span>}
                <button className="peek-item" onClick={() => onPick(stop.id)} aria-current={isCurrent ? "step" : undefined}>
                  <span className={`peek-dot tint-${tint}`}>{done ? <Icon name="check" size={14} stroke={3} /> : isFinal ? <Icon name="flag" size={14} /> : i + 1}</span>
                  <span className="peek-text">
                    <strong>{stop.title}</strong>
                    {stop.summary && <span className="muted">{stop.summary}</span>}
                  </span>
                  <span className="peek-meta">{meta}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="peek-foot">
          <span className="muted">Pick a stop to jump there.</span>
          <button className="btn btn-ghost" onClick={onOpenMap}>
            <Icon name="pencil" size={16} /> Edit road map
          </button>
        </div>
      </div>
    </div>
  );
}
