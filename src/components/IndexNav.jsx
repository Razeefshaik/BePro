// The Index: stops grouped by phase (with how many are done). Each stop is a small card:
// a colored tile with its number (the same color as its road map card), the title, and a
// "status • minutes" line. The current stop is expanded with its progress and subtopics.
// It sits on the left edge; below 900px it becomes a drawer (learn.css).
import Icon from "./Icon.jsx";
import { tintFor } from "./common.jsx";
import { stops, isModuleDone, moduleScore, FINAL_ID } from "../state/selectors.js";

const GROUPS = [
  { phase: "basics", label: "Basics and prereqs" },
  { phase: "deepdive", label: "Topic deep dive" },
  { phase: "test", label: "Test and quiz" },
];

// currentProgress: the current stop's progress bar, shown under its entry.
export default function IndexNav({ session, onPick, open, onClose, retestCount, currentProgress }) {
  const all = stops(session);
  const current = session.currentModuleId;

  return (
    <>
      {open && <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />}
      <nav className={`index ${open ? "is-open" : ""}`} aria-label="Index">
        <div className="index-head">
          <span className="index-heading">Index</span>
          <button className="icon-btn icon-btn-sm index-close" onClick={onClose} aria-label="Close index">
            <Icon name="close" size={16} />
          </button>
        </div>

        {current === "retest" && (
          <div className="index-entry is-current">
            <div className="index-item">
              <span className="index-tile tint-blush">
                <Icon name="redo" size={15} />
              </span>
              <span className="index-text">
                <span className="index-title">Retest pile</span>
                <span className="index-sub">{retestCount} to redo</span>
              </span>
            </div>
            {currentProgress}
          </div>
        )}

        {GROUPS.map((group) => {
          const members = all.filter((s) => s.phase === group.phase);
          const doneCount = members.filter((s) => isModuleDone(session, s.id)).length;
          return (
            <div key={group.phase} className={`index-group group-${group.phase}`}>
              <div className="index-group-label">
                <span>{group.label}</span>
                {members.length === 0 ? (
                  <span className="index-group-count">Skipped</span>
                ) : (
                  <span className={`index-group-count ${doneCount === members.length ? "is-done" : ""}`}>
                    {doneCount}/{members.length}
                  </span>
                )}
              </div>
              {members.map((stop) => {
                const position = all.indexOf(stop);
                const slot = session.modules[stop.id];
                const done = isModuleDone(session, stop.id);
                const isCurrent = stop.id === current;
                const score = moduleScore(session, stop.id);
                let status = "Up next";
                if (done) status = score.total ? `${score.correct}/${score.total} right` : "Done";
                else if (isCurrent) status = "You are here";
                else if (slot?.status === "loading") status = "Loading";
                else if (slot?.status === "error") status = "Failed";
                else if (slot?.status === "ready") status = "Ready";
                const tint = stop.id === FINAL_ID ? "aqua" : tintFor(position);

                return (
                  <div key={stop.id} className={`index-entry ${isCurrent ? "is-current" : ""} ${done ? "is-done" : ""}`}>
                    <button className="index-item" onClick={() => onPick(stop.id)} aria-current={isCurrent ? "true" : undefined}>
                      <span className={`index-tile tint-${tint}`}>
                        {done ? (
                          <Icon name="check" size={15} stroke={3} />
                        ) : slot?.status === "loading" ? (
                          <span className="spinner spinner-sm" />
                        ) : slot?.status === "error" ? (
                          <Icon name="alert" size={15} />
                        ) : stop.id === FINAL_ID ? (
                          <Icon name="flag" size={15} />
                        ) : (
                          position + 1
                        )}
                      </span>
                      <span className="index-text">
                        <span className="index-title">{stop.title}</span>
                        <span className="index-sub">
                          {status}
                          {stop.minutes ? (
                            <>
                              <span className="index-dot" aria-hidden="true" />
                              {stop.minutes} min
                            </>
                          ) : null}
                        </span>
                      </span>
                    </button>
                    {isCurrent && currentProgress}
                    {isCurrent && stop.subtopics.length > 0 && (
                      <ul className="index-subs">
                        {stop.subtopics.map((sub, i) => (
                          <li key={i}>{sub}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>
    </>
  );
}
