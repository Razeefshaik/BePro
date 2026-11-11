// Basics and prereqs -> Topic deep dive -> Test and quiz. Skipped phases say "Skipped".
import { Fragment } from "react";
import Icon from "./Icon.jsx";

export default function Stepper({ phases }) {
  return (
    <ol className="stepper" aria-label="Your progress">
      {phases.map((p, i) => (
        <Fragment key={p.key}>
          {i > 0 && <li className={`step-line ${phases[i - 1].state === "done" ? "line-done" : ""}`} aria-hidden="true" />}
          <li className={`step step-${p.state}`} aria-current={p.state === "current" ? "step" : undefined}>
            <span className="step-dot">{p.state === "done" ? <Icon name="check" size={12} stroke={3.5} /> : p.state === "skipped" ? "–" : i + 1}</span>
            <span className="step-text">
              <span className="step-label">{p.label}</span>
              <span className="step-state">{p.state === "done" ? "Done" : p.state === "skipped" ? "Skipped" : p.state === "current" ? "You are here" : "Up next"}</span>
            </span>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
