// A flashcard: question and visual on the front, the answer on the back.
// "Read further" opens a longer explanation inside the card (loaded once, then cached).
// Keyboard: Space flips, 1 = Review again, 2 = Got it, arrow keys move between cards.
import { useEffect } from "react";
import Icon from "./Icon.jsx";
import Visual from "./visuals/Visual.jsx";
import { CardDeco, Skeleton, StatusBanner } from "./common.jsx";

export default function Flashcard({
  card,
  index,
  total,
  tint,
  label,
  flipped,
  onFlip,
  readMore,
  readMoreOpen,
  onReadMore,
  suggestReadMore,
  rating,
  onRate,
  onPrev,
  onNext,
}) {
  useEffect(() => {
    function onKey(event) {
      if (event.target.closest("input, textarea, [contenteditable], [role=dialog]") || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === " " && !event.target.closest("button, a")) {
        event.preventDefault();
        onFlip();
      } else if (event.key === "1") onRate("review");
      else if (event.key === "2") onRate("got");
      else if (event.key === "ArrowRight" && onNext) onNext();
      else if (event.key === "ArrowLeft" && onPrev) onPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="deck">
      <div className={`flashcard tint-${tint} ${flipped ? "is-flipped" : ""}`}>
        <div className="flash-inner">
          {/* Front */}
          <section className="flash-face flash-front" aria-hidden={flipped} inert={flipped ? "" : undefined}>
            <CardDeco />
            <CardTop label={label} index={index} total={total} side="Question" card={card} rating={rating} />
            <h2 className="flash-question">{card.front}</h2>
            {card.visual && (
              <div className="flash-visual">
                <Visual visual={card.visual} />
              </div>
            )}
            <div className="flash-hint">
              <Icon name="flip" size={15} /> Think of your answer, then flip.
            </div>
          </section>

          {/* Back */}
          <section className="flash-face flash-back" aria-hidden={!flipped} inert={!flipped ? "" : undefined}>
            <CardDeco />
            <CardTop label={label} index={index} total={total} side="Answer" card={card} rating={rating} />
            <p className="flash-answer">{card.answer}</p>
            {card.sourceQuote && !card.ungrounded && (
              <blockquote className="flash-quote">
                <Icon name="book" size={14} /> “{card.sourceQuote}”
              </blockquote>
            )}
            {card.visual && card.visual.kind !== "image" && (
              <div className="flash-visual flash-visual-small">
                <Visual visual={card.visual} compact />
              </div>
            )}

            <div className="readmore">
              <button className={`readmore-toggle ${suggestReadMore && !readMoreOpen ? "is-suggested" : ""}`} onClick={onReadMore} aria-expanded={readMoreOpen}>
                <Icon name="book" size={16} />
                {readMoreOpen ? "Hide explanation" : "Read further"}
                {suggestReadMore && !readMoreOpen && <span className="pill pill-white suggested">Suggested</span>}
                <Icon name={readMoreOpen ? "chevronUp" : "chevronDown"} size={16} />
              </button>
              {readMoreOpen && <ReadMoreBody slot={readMore} onRetry={onReadMore} />}
            </div>
          </section>
        </div>
      </div>

      <div className="deck-controls">
        <button className="round-btn" onClick={onPrev} disabled={!onPrev} aria-label="Previous card">
          <Icon name="arrowLeft" />
        </button>
        <button className="btn btn-primary btn-lg flip-btn" onClick={onFlip}>
          <Icon name="flip" size={17} /> {flipped ? "Show question" : "Flip card"} <kbd>Space</kbd>
        </button>
        <button className="round-btn" onClick={onNext} disabled={!onNext} aria-label="Next card">
          <Icon name="arrowRight" />
        </button>
      </div>

      <div className="rate-row" role="group" aria-label="How well did you know it?">
        <button className={`btn btn-lg btn-review ${rating === "review" ? "is-chosen" : ""}`} onClick={() => onRate("review")} aria-pressed={rating === "review"}>
          <Icon name="redo" /> Review again <kbd>1</kbd>
        </button>
        <button className={`btn btn-lg btn-good ${rating === "got" ? "is-chosen" : ""}`} onClick={() => onRate("got")} aria-pressed={rating === "got"}>
          <Icon name="check" stroke={2.6} /> Got it <kbd>2</kbd>
        </button>
      </div>
    </div>
  );
}

function CardTop({ label, index, total, side, card, rating }) {
  return (
    <div className="flash-top">
      <span className="pill pill-white">{label}</span>
      <span className="flash-count">
        {side} · {index + 1} of {total}
      </span>
      {card.ungrounded && (
        <span className="pill pill-warn">
          <Icon name="warn" size={13} /> Not found in your notes
        </span>
      )}
      {rating && (
        <span className={`pill rated rated-${rating}`}>
          <Icon name={rating === "got" ? "check" : "redo"} size={13} stroke={2.6} />
          {rating === "got" ? "Got it" : "To review"}
        </span>
      )}
    </div>
  );
}

function ReadMoreBody({ slot, onRetry }) {
  if (!slot || slot.status === "loading" || slot.status === "idle") {
    return (
      <div className="readmore-body" aria-busy="true">
        <Skeleton height={14} />
        <Skeleton height={14} width="92%" />
        <Skeleton height={14} width="70%" />
      </div>
    );
  }
  if (slot.status === "error") {
    return (
      <StatusBanner kind="error" title="Couldn't load the explanation" actions={[{ label: "Try again", onClick: onRetry, primary: true }]}>
        {slot.error?.message}
      </StatusBanner>
    );
  }
  const { paragraphs, example, commonMistake } = slot.data;
  return (
    <div className="readmore-body">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {(example || commonMistake) && (
        <div className="readmore-extras">
          {example && (
            <div className="extra extra-example">
              <strong>
                <Icon name="bulb" size={14} /> Example
              </strong>
              <span>{example}</span>
            </div>
          )}
          {commonMistake && (
            <div className="extra extra-mistake">
              <strong>
                <Icon name="warn" size={14} /> Common mistake
              </strong>
              <span>{commonMistake}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
