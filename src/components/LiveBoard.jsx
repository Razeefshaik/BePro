// A live display, like a departures board at a station or airport.
//   - top bar: LIVE light, which stop you are on, a clock
//   - main line: a motivation line or study tip that changes by itself every few seconds
//     (an adaptive hint takes over after 2 "Review again" in a row)
//   - ticker: session stats and the next stop, scrolling along the bottom
import { useEffect, useMemo, useState } from "react";
import Icon from "./Icon.jsx";
import quotes from "../data/quotes.json";
import tips from "../data/tips.json";

const ROTATE_MS = 7000;
const HINT = "Two Review again in a row. Try Read further on the next cards.";

// Quotes and tips mixed, in a random order that stays the same for this board.
function buildPlaylist(stopNumber) {
  const items = [
    ...quotes.map((text) => ({ label: "Keep going", text: text.replace("{n}", String(stopNumber)) })),
    ...tips.map((text) => ({ label: "Study tip", text })),
  ];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function LiveBoard({ stopLabel, stopNumber, hint, stats, nextStop, onRetest }) {
  const playlist = useMemo(() => buildPlaylist(stopNumber), [stopNumber]);
  const [index, setIndex] = useState(0);
  const clock = useClock();

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % playlist.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [playlist.length]);

  const message = hint ? { label: "Attention", text: HINT } : playlist[index];

  const tickerItems = [
    `Cards rated ${stats.cardsRated}`,
    `Correct ${stats.correct}/${stats.answered}`,
    `Retest pile ${stats.pile}`,
    nextStop ? `Next stop: ${nextStop}` : "Final stop ahead",
    "Space flips · 1 and 2 rate · Enter goes next",
  ];

  return (
    <section className="live" aria-label="Live board">
      <header className="live-top">
        <span className="live-on">
          <span className="live-dot" aria-hidden="true" /> LIVE
        </span>
        <span className="live-stop">{stopLabel}</span>
        <span className="live-clock" aria-label={`Time ${clock}`}>
          {clock}
        </span>
      </header>

      <div className="live-screen">
        {/* key changes with the message, which restarts the flip-in animation */}
        <div key={hint ? "hint" : index} className={`live-message ${hint ? "is-hint" : ""}`}>
          <span className="live-label">{message.label}</span>
          <p className="live-text">{message.text}</p>
        </div>
      </div>

      <div className="live-foot">
        <div className="live-ticker" aria-hidden="true">
          {/* the list twice, so the scroll loops without a gap */}
          <div className="live-track">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="live-item">
                {item}
                <span className="live-sep">◆</span>
              </span>
            ))}
          </div>
        </div>
        <span className="sr-only">{tickerItems.slice(0, 4).join(". ")}</span>
        {stats.pile > 0 && onRetest && (
          <button className="live-btn" onClick={onRetest}>
            <Icon name="redo" size={13} /> Retest {stats.pile}
          </button>
        )}
      </div>
    </section>
  );
}
