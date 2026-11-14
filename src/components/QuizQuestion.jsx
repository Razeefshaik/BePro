// One quiz question: answer it, see feedback with the explanation, go next.
// Keyboard: 1 to 4 answer (true/false: 1 = True, 2 = False), Enter goes next.
import { useEffect } from "react";
import Icon from "./Icon.jsx";
import { CardDeco } from "./common.jsx";

export default function QuizQuestion({ question, answer, onAnswer, onNext, nextLabel = "Next", onReport, tint = "meadow", deco = "sparkles", keyboard = true }) {
  const answered = Boolean(answer);
  const isMcq = question.type === "mcq";
  const choices = isMcq ? question.options : [true, false];

  function choose(index) {
    if (answered || index >= choices.length) return;
    const chosen = isMcq ? index : choices[index];
    const correct = isMcq ? index === question.answerIndex : chosen === question.answer;
    onAnswer(chosen, correct);
  }

  useEffect(() => {
    if (!keyboard) return undefined;
    function onKey(event) {
      if (event.target.closest("input, textarea, [contenteditable]") || event.ctrlKey || event.metaKey || event.altKey) return;
      if (/^[1-4]$/.test(event.key)) {
        event.preventDefault();
        choose(Number(event.key) - 1);
      } else if (event.key === "Enter" && answered && onNext && !event.target.closest("button, a")) {
        event.preventDefault();
        onNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // For each option: was it the right one, and did the learner pick it?
  const isRight = (i) => (isMcq ? i === question.answerIndex : choices[i] === question.answer);
  const isChosen = (i) => answered && (isMcq ? answer.chosen === i : answer.chosen === choices[i]);

  return (
    <div className="question">
      {question.ungrounded && (
        <span className="pill pill-warn">
          <Icon name="warn" size={13} /> Not found in your notes
        </span>
      )}

      {isMcq ? (
        <>
          <h2 className="question-text">{question.question}</h2>
          <div className="options" role="group" aria-label="Answer options">
            {question.options.map((option, i) => {
              const state = !answered ? "" : isRight(i) ? "opt-right" : isChosen(i) ? "opt-wrong" : "opt-dim";
              return (
                <button key={i} className={`option ${state}`} onClick={() => choose(i)} disabled={answered && !isRight(i) && !isChosen(i)} aria-pressed={isChosen(i)}>
                  <span className="option-key">{i + 1}</span>
                  <span className="option-text">{option}</span>
                  {answered && isRight(i) && (
                    <span className="option-tag tag-right">
                      <Icon name="check" size={14} stroke={3} /> Correct
                    </span>
                  )}
                  {answered && isChosen(i) && !isRight(i) && (
                    <span className="option-tag tag-wrong">
                      <Icon name="close" size={14} stroke={3} /> Your answer
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className={`tf-card tint-${tint}`}>
          <CardDeco variant={deco} />
          <div className="tf-head">
            <span className="tf-icon">
              <Icon name="bulb" size={20} />
            </span>
            <span className="tf-title">Do you know this?</span>
          </div>
          <p className="tf-statement">{question.statement}</p>
          <div className="tf-buttons">
            {[false, true].map((value) => {
              const i = value ? 0 : 1; // key 1 = True, key 2 = False
              const state = !answered ? "" : isRight(i) ? "opt-right" : isChosen(i) ? "opt-wrong" : "opt-dim";
              return (
                <button key={String(value)} className={`tf-btn ${value ? "tf-yes" : "tf-no"} ${state}`} onClick={() => choose(i)} disabled={answered && !isRight(i) && !isChosen(i)} aria-pressed={isChosen(i)}>
                  {answered && isRight(i) && <Icon name="check" size={15} stroke={3} />}
                  {answered && isChosen(i) && !isRight(i) && <Icon name="close" size={15} stroke={3} />}
                  {value ? "True" : "False"} <kbd>{i + 1}</kbd>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {answered && (
        <div className={`feedback ${answer.correct ? "feedback-right" : "feedback-wrong"}`} role="status">
          <strong>
            <Icon name={answer.correct ? "check" : "redo"} size={16} stroke={2.6} />
            {answer.correct ? "Correct." : "Not quite. Added to your retest pile."}
          </strong>
          <span>{question.explanation}</span>
        </div>
      )}

      <div className="question-foot">
        {onReport ? (
          <button className="btn-link" onClick={onReport}>
            <Icon name="flag" size={14} /> Report a wrong question
          </button>
        ) : (
          <span />
        )}
        {answered && onNext && (
          <button className="btn btn-primary" onClick={onNext} autoFocus>
            {nextLabel} <kbd>Enter</kbd>
          </button>
        )}
      </div>
    </div>
  );
}
