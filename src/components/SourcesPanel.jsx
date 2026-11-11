// Sources. Notes mode: the lines the cards quote from your notes.
// Topic mode: Wikipedia search links that OUR code builds from stop titles (the model never sends URLs).
import { useEffect } from "react";
import Icon from "./Icon.jsx";
import { stops } from "../state/selectors.js";

export default function SourcesPanel({ session, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const notesMode = session.input.notes.trim().length > 0;
  const planTitle = session.plan.data?.title || session.input.topic;

  const quotes = [];
  if (notesMode) {
    const seen = new Set();
    for (const stop of stops(session)) {
      const content = session.modules[stop.id]?.data;
      for (const item of [...(content?.cards ?? []), ...(content?.quiz ?? [])]) {
        if (!item.sourceQuote || seen.has(item.sourceQuote)) continue;
        seen.add(item.sourceQuote);
        quotes.push({ text: item.sourceQuote, stop: stop.title, ungrounded: item.ungrounded });
      }
    }
  }

  const wiki = (q) => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="sources-title">
        <div className="modal-head">
          <h2 id="sources-title">Sources</h2>
          <button className="icon-btn icon-btn-sm" onClick={onClose} aria-label="Close sources">
            <Icon name="close" size={16} />
          </button>
        </div>

        {notesMode ? (
          <>
            <p className="muted">Lines from your notes that the cards and questions quote. Loaded stops only.</p>
            {quotes.length === 0 ? (
              <p className="muted">No quotes yet. Open a stop to load its cards.</p>
            ) : (
              <ul className="sources-list">
                {quotes.map((q, i) => (
                  <li key={i} className={q.ungrounded ? "is-ungrounded" : ""}>
                    <blockquote>“{q.text}”</blockquote>
                    <span className="muted">
                      {q.stop}
                      {q.ungrounded ? " · Not found in your notes" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <p className="muted">Want to go deeper? These searches open Wikipedia. BePro builds them from your stops.</p>
            <ul className="sources-list">
              <li>
                <a href={wiki(planTitle)} target="_blank" rel="noreferrer">
                  <Icon name="external" size={14} /> Search Wikipedia for “{planTitle}”
                </a>
              </li>
              {(session.plan.data?.modules ?? []).map((m) => (
                <li key={m.id}>
                  <a href={wiki(`${planTitle} ${m.title}`)} target="_blank" rel="noreferrer">
                    <Icon name="external" size={14} /> Search Wikipedia for “{m.title}”
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
