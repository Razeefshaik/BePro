// The doubt bot: a small side panel that answers ONE thing, the card or question on screen.
// It is a helper, not the core experience. Answers are rendered as plain text, never HTML.
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { api } from "../api/client.js";

const SUGGESTIONS = ["Explain it simpler", "Give me an example", "Why is that true?"];

export default function DoubtBot({ context, contextKey, contextLabel }) {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState({}); // contextKey -> [{ role, text, kind? }]
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const latest = useRef({ id: 0, controller: null }); // stale guard for the bot's own requests
  const listRef = useRef(null);

  const messages = threads[contextKey] ?? [];

  // A new card or question: stop any answer that is still coming for the old one.
  useEffect(() => {
    latest.current.controller?.abort();
    setLoading(false);
  }, [contextKey]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, loading, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function ask(text) {
    const question = text.trim();
    if (question.length < 2 || !context) return;
    const key = contextKey;
    const history = messages.filter((m) => m.kind !== "error").slice(-6).map(({ role, text: t }) => ({ role, text: t }));
    setThreads((all) => ({ ...all, [key]: [...(all[key] ?? []), { role: "user", text: question }] }));
    setInput("");

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
    <>
      <button className={`doubt-fab ${open ? "is-open" : ""}`} onClick={() => setOpen((v) => !v)} aria-label={open ? "Close doubt bot" : "Ask a doubt about this card"} aria-expanded={open}>
        <Icon name={open ? "close" : "chat"} size={22} />
      </button>

      {open && (
        <section className="doubt panel" role="dialog" aria-label="Doubt bot">
          <header className="doubt-head">
            <span className="doubt-avatar" aria-hidden="true">
              <Icon name="chat" size={18} />
            </span>
            <div className="doubt-titles">
              <strong>Doubt bot</strong>
              <span className="muted">Only about: {contextLabel}</span>
            </div>
            <button className="icon-btn icon-btn-sm" onClick={() => setOpen(false)} aria-label="Close doubt bot">
              <Icon name="close" size={14} />
            </button>
          </header>

          <div className="doubt-list" ref={listRef} aria-live="polite">
            {messages.length === 0 && <p className="doubt-empty muted">Stuck on this one? Ask anything about it.</p>}
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

          {messages.length === 0 && (
            <div className="doubt-suggest">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => ask(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            className="doubt-form"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <label htmlFor="doubt-input" className="sr-only">
              Ask a follow up
            </label>
            <input id="doubt-input" value={input} maxLength={500} onChange={(e) => setInput(e.target.value)} placeholder="Ask a follow up..." autoFocus />
            <button className="icon-btn doubt-send" aria-label="Send" disabled={input.trim().length < 2}>
              <Icon name="send" size={16} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
