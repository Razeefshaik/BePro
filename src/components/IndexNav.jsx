// The Index: stops grouped by phase, the current one expanded with its subtopics.
// On phones it becomes a drawer (see learn.css).
import Icon from "./Icon.jsx";
import { stops, isModuleDone, moduleScore } from "../state/selectors.js";

const GROUPS = [
  { phase: "basics", label: "Basics and prereqs" },
  { phase: "deepdive", label: "Topic deep dive" },
  { phase: "test", label: "Test and quiz" },
];

export default function IndexNav({ session, onPick, open, onClose, retestCount }) {
  const all = stops(session);
  const current = session.currentModuleId;

  return (
    <>
      {open && <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />}
      <nav className={`index panel ${open ? "is-open" : ""}`} aria-label="Index">
        <div className="index-head">
          <span className="eyebrow">Index</span>
          <button className="icon-btn icon-btn-sm index-close" onClick={onClose} aria-label="Close index">
            <Icon name="close" size={16} />
          </button>
        </div>

        {current === "retest" && (
          <div className="index-item is-current">
            <span className="index-status status-current" />
            <span className="index-title">Retest pile</span>
            <span className="index-meta">{retestCount}</span>
          </div>
        )}

        {GROUPS.map((group) => {
          const members = all.filter((s) => s.phase === group.phase);
          return (
            <div key={group.phase} className={`index-group group-${group.phase}`}>
              <span className="index-group-label">
                {group.label}
                {members.length === 0 && <span className="muted"> · Skipped</span>}
              </span>
              {members.map((stop) => {
                const slot = session.modules[stop.id];
                const done = isModuleDone(session, stop.id);
                const isCurrent = stop.id === current;
                const score = moduleScore(session, stop.id);
                let status = "todo";
                let meta = "";
                if (done) {
                  status = "done";
                  meta = score.total ? `${score.correct}/${score.total}` : "Done";
                } else if (slot?.status === "loading") {
                  status = "loading";
                  meta = "Loading";
                } else if (slot?.status === "error") {
                  status = "error";
                  meta = "Failed";
                } else if (slot?.status === "ready") {
                  meta = "Ready";
                }
                if (isCurrent) status = status === "done" ? "done" : "current";

                return (
                  <div key={stop.id} className={`index-entry ${isCurrent ? "is-current" : ""}`}>
                    <button className="index-item" onClick={() => onPick(stop.id)} aria-current={isCurrent ? "true" : undefined}>
                      <span className={`index-status status-${status}`}>
                        {status === "done" && <Icon name="check" size={11} stroke={3.5} />}
                        {status === "error" && <Icon name="alert" size={14} />}
                        {status === "loading" && <span className="spinner spinner-sm" />}
                      </span>
                      <span className="index-title">{stop.title}</span>
                      <span className="index-meta">{meta}</span>
                    </button>
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
