// Intermediate "skip check": 3 basics questions. 2 or more right skips the basics,
// otherwise we ask the model to insert a basics stop.
import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import QuizQuestion from "./QuizQuestion.jsx";
import { LoadingNotice, StatusBanner } from "./common.jsx";

export default function SkipCheck({ session, actions, onClose }) {
  const slot = session.skipCheck;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (slot.status === "idle") actions.runSkipCheck(session.id);
  }, [slot.status, session.id, actions]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const quiz = slot.data?.quiz ?? [];
  const finished = quiz.length > 0 && index >= quiz.length;
  const right = Object.values(answers).filter((a) => a.correct).length;
  const passed = right >= 2;

  function finish() {
    if (passed) actions.dispatch({ type: "SKIPCHECK_DONE", sessionId: session.id, result: "skipped" });
    else actions.adjustPlan(session.id, "Add one basics stop at the start for the prerequisites.", { addBasics: true });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="skipcheck-title">
        <div className="modal-head">
          <h2 id="skipcheck-title">Quick basics check</h2>
          <button className="icon-btn icon-btn-sm" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </div>

        {slot.status === "loading" && <LoadingNotice label="Writing 3 questions..." onRetry={() => actions.runSkipCheck(session.id)} onCancel={onClose} />}
        {slot.status === "error" && (
          <StatusBanner kind="error" title="Couldn't write the check" actions={[{ label: "Try again", onClick: () => actions.runSkipCheck(session.id), primary: true }]}>
            {slot.error?.message}
          </StatusBanner>
        )}

        {slot.status === "ready" && !finished && quiz[index] && (
          <>
            <span className="muted">
              Question {index + 1} of {quiz.length}
            </span>
            <QuizQuestion
              key={quiz[index].id}
              question={quiz[index]}
              answer={answers[quiz[index].id]}
              onAnswer={(chosen, correct) => setAnswers((a) => ({ ...a, [quiz[index].id]: { chosen, correct } }))}
              onNext={() => setIndex((i) => i + 1)}
              nextLabel={index === quiz.length - 1 ? "See result" : "Next"}
              tint="aqua"
            />
          </>
        )}

        {finished && (
          <>
            <StatusBanner kind={passed ? "good" : "info"} title={`${right} of ${quiz.length} right`}>
              {passed ? "You know the basics. We'll keep them skipped." : "We'll add a short basics stop at the start of your road."}
            </StatusBanner>
            <button className="btn btn-primary" onClick={finish}>
              {passed ? "Keep basics skipped" : "Add basics stop"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
