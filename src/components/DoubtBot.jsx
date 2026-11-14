// The doubt bot, as a card in the top band of the learning page.
// It answers ONE thing: the card or question on screen. You type in the card; the answers
// drop down under it (like search results) and can be hidden again.
// Answers are rendered as plain text, never HTML.
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { api } from "../api/client.js";

const SUGGESTIONS = ["Explain it simpler", "Give me an example", "Why is that true?"];

export default function DoubtBot({ context, contextKey, contextLabel }) {
  const [threads, setThreads] = useState({}); // contextKey -> [{ role, text, kind? }]
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const latest = useRef({ id: 0, controller: null }); // stale guard for the bot's own requests
  const listRef = useRef(null);

  const messages = threads[contextKey] ?? [];
  const disabled = !context;
  const answersOpen = showAnswers && (messages.length > 0 || loading);

  // A new card or question: stop any answer that is still coming for the old one.
  useEffect(() => {
    latest.current.controller?.abort();
    setLoading(false);
    setShowAnswers(false);
  }, [contextKey]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, loading, answersOpen]);

  useEffect(() => {
    if (!answersOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setShowAnswers(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answersOpen]);

  async function ask(text) {
    const question = text.trim();
    if (question.length < 2 || !context) return;
    const key = contextKey;
    const history = messages.filter((m) => m.kind !== "error").slice(-6).map(({ role, text: t }) => ({ role, text: t }));
    setThreads((all) => ({ ...all, [key]: [...(all[key] ?? []), { role: "user", text: question }] }));
    setInput("");
    setShowAnswers(true);

    latest.current.controller?.abort();
    const controller = new AbortController();
    const id = latest.current.id + 1;
    latest.current = { id, controller };
    setLoading(true);

    const result = await api.doubt({ question, context, history }, controller.signal);
    if (latest.current.id !== id) return; // a newer question was asked meanwhile
    setLoading(false);
    if (result.ok) {
      setThreads((all) => ({ ...all, [key]: [...(all[key] ?? []), { role: "bot", text: result.data.answer }] }));
    } else if (result.error.code !== "CANCELLED") {
      setThreads((all) => ({ ...all, [key]: [...(all[key] ?? []), { role: "bot", kind: "error", text: result.error.message, retry: question }] }));
    }
  }

  return (
    <section className="doubt-card panel" aria-label="Doubt bot">
      <header className="doubt-head">
        <span className="doubt-avatar" aria-hidden="true">
          <Icon name="chat" size={16} />
        </span>
        <div className="doubt-titles">
          <strong>Ask a doubt</strong>
          <span className="muted">{disabled ? "Open a card to ask about it" : `Only about ${contextLabel}`}</span>
        </div>
        {messages.length > 0 && (
          <button className="doubt-toggle" onClick={() => setShowAnswers((v) => !v)} aria-expanded={answersOpen}>
            {answersOpen ? "Hide" : `Answers ${Math.ceil(messages.length / 2)}`}
            <Icon name={answersOpen ? "chevronUp" : "chevronDown"} size={14} />
          </button>
        )}
      </header>

      <form
        className="doubt-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <label htmlFor="doubt-input" className="sr-only">
          Ask about {contextLabel}
        </label>
        <input id="doubt-input" value={input} maxLength={500} onChange={(e) => setInput(e.target.value)} placeholder="Stuck? Ask anything..." disabled={disabled} />
        <button className="icon-btn doubt-send" aria-label="Send" disabled={disabled || input.trim().length < 2}>
          <Icon name="send" size={15} />
        </button>
      </form>

      <div className="doubt-suggest">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chip" onClick={() => ask(s)} disabled={disabled}>
            {s}
          </button>
        ))}
      </div>

      {answersOpen && (
        <div className="doubt-pop" role="region" aria-label="Doubt bot answers">
          <div className="doubt-list" ref={listRef} aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`bubble bubble-${m.role} ${m.kind === "error" ? "bubble-error" : ""}`}>
                {m.text}
                {m.kind === "error" && (
                  <button className="btn-link" onClick={() => ask(m.retry)}>
                    Try again
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="bubble bubble-bot bubble-typing" aria-label="Thinking">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-sm doubt-hide" onClick={() => setShowAnswers(false)}>
            <Icon name="chevronUp" size={14} /> Hide answers
          </button>
        </div>
      )}
    </section>
  );
}
