// Steps through frames of values. Bars move with a CSS transition. Play, Pause, Back and Next.
import { useEffect, useState } from "react";
import Icon from "../Icon.jsx";

export default function AnimationVisual({ visual }) {
  const { frames, labels } = visual;
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      setFrame((f) => {
        if (f >= frames.length - 1) {
          setPlaying(false);
          return f;
        }
        return f + 1;
      });
    }, 1400);
    return () => clearInterval(timer);
  }, [playing, frames.length]);

  const all = frames.flatMap((f) => f.values);
  const max = Math.max(...all, 0);
  const min = Math.min(...all, 0);
  const range = max - min || 1;
  const current = frames[frame];

  function play() {
    if (frame >= frames.length - 1) setFrame(0);
    setPlaying(true);
  }

  return (
    <div className="anim">
      <div className="chart-bars anim-bars" aria-hidden="true">
        {current.values.map((v, i) => (
          <div key={i} className="chart-col">
            <span className="chart-value">{Number.isInteger(v) ? v : v.toFixed(1)}</span>
            <span className="chart-bar" style={{ height: `${Math.max(3, ((v - min) / range) * 100)}%` }} />
          </div>
        ))}
      </div>
      {labels && (
        <div className="chart-labels" aria-hidden="true">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
      <p className="anim-caption" aria-live="polite">
        <strong>
          {frame + 1}/{frames.length}
        </strong>{" "}
        {current.caption}
      </p>
      <div className="anim-controls">
        <button className="icon-btn icon-btn-sm" onClick={() => setFrame((f) => Math.max(0, f - 1))} disabled={frame === 0} aria-label="Previous frame">
          <Icon name="chevronLeft" size={16} />
        </button>
        <button className="btn btn-sm btn-ghost" onClick={playing ? () => setPlaying(false) : play}>
          <Icon name={playing ? "pause" : "play"} size={14} /> {playing ? "Pause" : "Play"}
        </button>
        <button className="icon-btn icon-btn-sm" onClick={() => setFrame((f) => Math.min(frames.length - 1, f + 1))} disabled={frame === frames.length - 1} aria-label="Next frame">
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
    </div>
  );
}
