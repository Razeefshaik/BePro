// The three phases as tiles: Basics and prereqs -> Topic deep dive -> Test and quiz.
// The phase you are in is the highlighted tile. Each tile has one mark per stop (done, current, to do).
import { Fragment } from "react";
import Icon from "./Icon.jsx";

const STATE_TEXT = { done: "Done", skipped: "Skipped", current: "You are here", todo: "Up next" };

export default function Stepper({ phases }) {
  return (
    <ol className="stepper" aria-label="Your progress">
      {phases.map((p, i) => (
        <Fragment key={p.key}>
          {i > 0 && (
            <li className="step-arrow" aria-hidden="true">
              <Icon name="chevronRight" size={16} />
            </li>
          )}
          <li className={`step step-${p.state}`} aria-current={p.state === "current" ? "step" : undefined}>
            <span className="step-dot">{p.state === "done" ? <Icon name="check" size={12} stroke={3.5} /> : p.state === "skipped" ? "–" : i + 1}</span>
            <span className="step-text">
              <span className="step-label">{p.label}</span>
              <span className="step-state">
                {STATE_TEXT[p.state]}
                {p.total > 0 && p.state !== "done" && ` · ${p.done}/${p.total}`}
              </span>
            </span>
            {/* one mark per stop in this phase: done, the one you are on, or still to do */}
            {p.total > 0 && (
              <span className="step-pips" aria-hidden="true">
                {p.marks.map((mark, k) => (
                  <span key={k} className={`pip pip-${mark}`} />
                ))}
              </span>
            )}
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
