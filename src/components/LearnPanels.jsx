// Small panels of the learning page:
//   ModuleProgress: the current stop's progress bar (shown inside the Index)
//   DeckDone:       shown after the last card of a stop
//   StopDone:       shown after the last quiz question of a stop, the final test or a retest
import Icon from "./Icon.jsx";
import { stops, isModuleDone } from "../state/selectors.js";

export function ModuleProgress({ session, cards, quiz, answers }) {
  const rated = cards.filter((c) => session.progress.ratings[c.id]).length;
  const answered = quiz.filter((q) => answers[q.id]).length;
  const total = cards.length + quiz.length;
  const percent = total ? Math.round(((rated + answered) / total) * 100) : 0;
  return (
    <div className="index-progress">
      <span className="bar" aria-hidden="true">
        <span style={{ width: `${percent}%` }} className={percent === 100 ? "bar-done" : ""} />
      </span>
      <span className="muted index-progress-text">
        {cards.length > 0 && `${rated}/${cards.length} cards`}
        {cards.length > 0 && quiz.length > 0 && " · "}
        {quiz.length > 0 && `${answered}/${quiz.length} questions`}
      </span>
    </div>
  );
}

export function DeckDone({ cards, ratings, hasQuiz, onQuiz, onAgain }) {
  const got = cards.filter((c) => ratings[c.id] === "got").length;
  const review = cards.filter((c) => ratings[c.id] === "review").length;
  return (
    <div className="done-panel panel">
      <span className="done-icon">
        <Icon name="check" size={26} stroke={3} />
      </span>
      <h2>Cards done</h2>
      <p className="muted">
        <span className="good-text">{got} got it</span> · <span className="review-text">{review} to review</span>
      </p>
      <div className="row">
        {hasQuiz && (
          <button className="btn btn-primary btn-lg" onClick={onQuiz} autoFocus>
            Take the quiz <Icon name="arrowRight" />
          </button>
        )}
        <button className="btn btn-ghost" onClick={onAgain}>
          <Icon name="redo" size={16} /> Go through again
        </button>
      </div>
    </div>
  );
}

export function StopDone({ session, quiz, answers, isRetest, isFinal, next, onNext, onResults, onRoadmap, onAgain }) {
  const correct = quiz.filter((q) => answers[q.id]?.correct).length;
  const allDone = stops(session).every((s) => isModuleDone(session, s.id));
  return (
    <div className="done-panel panel">
      <span className="done-score">
        {correct}/{quiz.length}
      </span>
      <h2>{isRetest ? "Retest finished" : isFinal ? "Final test done" : "Stop complete"}</h2>
      <p className="muted">{isRetest ? `You fixed ${correct} of ${quiz.length}.` : correct === quiz.length ? "Perfect round." : "Missed ones are waiting in your retest pile."}</p>
      <div className="row">
        {next && !isRetest ? (
          <button className="btn btn-primary btn-lg" onClick={onNext} autoFocus>
            Next: {next.title} <Icon name="arrowRight" />
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={onResults} autoFocus>
            {allDone ? "See results" : "Results so far"} <Icon name="arrowRight" />
          </button>
        )}
        {!isRetest && (
          <button className="btn btn-ghost" onClick={onAgain}>
            Review answers
          </button>
        )}
        <button className="btn btn-ghost" onClick={onRoadmap}>
          Road map
        </button>
      </div>
    </div>
  );
}
