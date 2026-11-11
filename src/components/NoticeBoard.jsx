// The notice board on the learning page: three pinned notes.
//   1. a motivation line (random, with a refresh button)
//   2. a study tip, or an adaptive hint when the learner keeps rating "Review again"
//   3. this session at a glance, with a shortcut to the retest pile
import { useState } from "react";
import Icon from "./Icon.jsx";
import quotes from "../data/quotes.json";
import tips from "../data/tips.json";

const randomIndex = (length, not) => {
  if (length < 2) return 0;
  let i = not;
  while (i === not) i = Math.floor(Math.random() * length);
  return i;
};

export default function NoticeBoard({ stopNumber, hint, stats, onRetest }) {
  const [quote, setQuote] = useState(() => randomIndex(quotes.length, -1));
  const [tip, setTip] = useState(() => randomIndex(tips.length, -1));

  return (
    <section className="board" aria-label="Notice board">
      <header className="board-head">
        <span className="board-title">
          <Icon name="pin" size={16} /> Notice board
        </span>
      </header>
      <div className="notes">
        <article className="note note-butter">
          <span className="note-pin" aria-hidden="true" />
          <span className="note-kicker">Keep going</span>
          <p className="note-quote">{quotes[quote].replace("{n}", String(stopNumber))}</p>
          <button className="note-btn" onClick={() => setQuote((q) => randomIndex(quotes.length, q))} aria-label="Show another motivation line">
            <Icon name="refresh" size={14} /> Another
          </button>
        </article>

        <article className={`note ${hint ? "note-hint" : "note-mint"}`}>
          <span className="note-pin" aria-hidden="true" />
          <span className="note-kicker">{hint ? "Hint for you" : "Study tip"}</span>
          <p className="note-text">{hint ? "Two Review again in a row. Try Read further on the next cards: the longer explanation often makes it click." : tips[tip]}</p>
          {!hint && (
            <button className="note-btn" onClick={() => setTip((t) => randomIndex(tips.length, t))} aria-label="Show another study tip">
              <Icon name="refresh" size={14} /> Next tip
            </button>
          )}
        </article>

        <article className="note note-lavender">
          <span className="note-pin" aria-hidden="true" />
          <span className="note-kicker">This session</span>
          <dl className="note-stats">
            <div>
              <dt>Cards</dt>
              <dd>{stats.cardsRated}</dd>
            </div>
            <div>
              <dt>Right</dt>
              <dd>
                {stats.correct}/{stats.answered}
              </dd>
            </div>
            <div>
              <dt>To retest</dt>
              <dd>{stats.pile}</dd>
            </div>
          </dl>
          {stats.pile > 0 && onRetest && (
            <button className="note-btn" onClick={onRetest}>
              <Icon name="redo" size={14} /> Retest now
            </button>
          )}
        </article>
      </div>
    </section>
  );
}
