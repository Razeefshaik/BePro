import { useEffect, useState } from "react";
import Icon from "../components/Icon.jsx";
import AppBar from "../components/AppBar.jsx";
import Stepper from "../components/Stepper.jsx";
import NoticeBoard from "../components/NoticeBoard.jsx";
import IndexNav from "../components/IndexNav.jsx";
import Flashcard from "../components/Flashcard.jsx";
import QuizQuestion from "../components/QuizQuestion.jsx";
import DoubtBot from "../components/DoubtBot.jsx";
import SourcesPanel from "../components/SourcesPanel.jsx";
import { LoadingNotice, Skeleton, StatusBanner, tintFor } from "../components/common.jsx";
import { stops, phases, retestContent, retestPile, nextStopId, isModuleDone, FINAL_ID } from "../state/selectors.js";

export default function LearnScreen({ session, actions, theme, toggleTheme }) {
  const sessionId = session.id;
  const moduleId = session.currentModuleId;
  const isRetest = moduleId === "retest";
  const all = stops(session);
  const stopIndex = all.findIndex((s) => s.id === moduleId);
  const stop = isRetest ? { id: "retest", title: "Retest pile", phase: "test", subtopics: [] } : all[stopIndex];

  const slot = isRetest ? { status: "ready", data: retestContent(session), warnings: [] } : session.modules[moduleId];
  const status = slot?.status ?? "idle";
  const content = slot?.data ?? null;

  const [flipped, setFlipped] = useState(false);
  const [openReadMore, setOpenReadMore] = useState({});
  const [indexOpen, setIndexOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const dispatch = (action) => actions.dispatch({ sessionId, ...action });

  // The stop was deleted from the plan: go back to the map instead of showing nothing.
  useEffect(() => {
    if (!isRetest && !stop) actions.dispatch({ type: "GO", screen: "roadmap" });
  }, [isRetest, stop, actions]);

  // Load the current stop's content if we don't have it.
  useEffect(() => {
    if (!isRetest && stop && status === "idle") actions.loadModule(sessionId, moduleId);
  }, [isRetest, stop, status, sessionId, moduleId, actions]);

  // Prefetch the next stop once this one is ready.
  const nextId = isRetest ? null : nextStopId(session, moduleId);
  const nextStatus = nextId ? session.modules[nextId]?.status : null;
  useEffect(() => {
    if (status === "ready" && nextId && !nextStatus) actions.loadModule(sessionId, nextId);
  }, [status, nextId, nextStatus, sessionId, actions]);

  const cards = content?.cards ?? [];
  const quiz = content?.quiz ?? [];
  const view = cards.length === 0 ? "quiz" : session.view;
  const cardIndex = Math.min(session.cardIndex, cards.length);
  const card = cards[cardIndex];
  const questionIndex = Math.min(session.questionIndex, quiz.length);
  const question = quiz[questionIndex];
  const answers = isRetest ? session.retest?.answers ?? {} : session.progress.answers;

  useEffect(() => setFlipped(false), [card?.id]);

  const pile = retestPile(session);
  const allAnswers = Object.values(session.progress.answers);
  const stats = {
    cardsRated: Object.keys(session.progress.ratings).length,
    answered: allAnswers.length,
    correct: allAnswers.filter((a) => a.correct).length,
    pile: pile.cards.length + pile.questions.length,
  };

  function startRetest() {
    dispatch({ type: "START_RETEST", cardIds: pile.cards.map((c) => c.id), questionIds: pile.questions.map((q) => q.id) });
  }

  function goTo(id) {
    setIndexOpen(false);
    dispatch({ type: "START_MODULE", moduleId: id });
  }

  function rate(rating) {
    if (!card) return;
    dispatch({ type: "RATE_CARD", moduleId: isRetest ? "retest" : moduleId, cardId: card.id, rating });
    dispatch({ type: "SET_CARD_INDEX", index: cardIndex + 1 });
  }

  function toggleReadMore(c) {
    const opening = !openReadMore[c.id];
    setOpenReadMore((o) => ({ ...o, [c.id]: opening }));
    if (opening) {
      setFlipped(true);
      actions.loadReadMore(sessionId, c);
    }
  }

  function retryReadMore(c) {
    actions.dispatch({ type: "SLOT_RESET", sessionId, slot: "readMore", key: c.id });
    actions.loadReadMore(sessionId, c);
  }

  // Warnings worth showing, per view.
  const warnings = slot?.warnings ?? [];
  const partial = warnings.find((w) => w.code === "PARTIAL");
  const reported = warnings.filter((w) => w.code === "REPORTED").length;
  const droppedCards = warnings.filter((w) => w.code === "CARD_DROPPED").length;
  const droppedVisuals = warnings.filter((w) => w.code === "VISUAL_DROPPED").length;

  // What the doubt bot may talk about: the card or question on screen.
  // An unanswered question goes without its answer, so the bot can't spoil it.
  let doubtContext = null;
  let doubtKey = "none";
  if (view === "cards" && card) {
    doubtContext = { card: { front: card.front, answer: card.answer } };
    doubtKey = card.id;
  } else if (view === "quiz" && question) {
    const answered = Boolean(answers[question.id]);
    const { id, ungrounded, sourceQuote, ...rest } = question;
    doubtContext = answered ? { question: rest } : { question: question.type === "mcq" ? { question: question.question, options: question.options } : { statement: question.statement } };
    doubtKey = `${question.id}:${answered}`;
  }

  if (!stop) return null;

  const stopLabel = isRetest ? "Retest" : stop.id === FINAL_ID ? "Final test" : `Stop ${stopIndex + 1}`;
  const phaseLabel = { basics: "Basics and prereqs", deepdive: "Topic deep dive", test: "Test and quiz" }[stop.phase];

  return (
    <div className="calm-bg page learn-page">
      <AppBar session={session} actions={actions} theme={theme} toggleTheme={toggleTheme}>
        <button className="btn btn-ghost hide-sm" onClick={() => setSourcesOpen(true)}>
          <Icon name="list" size={16} /> Sources
        </button>
        <button className="btn btn-ghost hide-sm" onClick={() => actions.dispatch({ type: "GO", screen: "roadmap" })}>
          <Icon name="road" size={16} /> Road map
        </button>
        <button className="btn btn-ghost hide-sm" onClick={() => actions.dispatch({ type: "GO", screen: "results" })}>
          <Icon name="bars" size={16} /> Results
        </button>
      </AppBar>

      <section className="learn-top">
        <div className="track panel">
          <Stepper phases={phases(session)} />
          <div className="track-now">
            <span className="eyebrow">
              {stopLabel} · {phaseLabel}
            </span>
            <h1 className="track-title">{stop.title}</h1>
            <ModuleProgress session={session} cards={cards} quiz={quiz} answers={answers} />
          </div>
        </div>
        <NoticeBoard stopNumber={stopIndex + 1} hint={Boolean(session.progress.readMoreHint[moduleId])} stats={stats} onRetest={!isRetest ? startRetest : null} />
      </section>

      <div className="learn-body">
        <IndexNav session={session} onPick={goTo} open={indexOpen} onClose={() => setIndexOpen(false)} retestCount={cards.length + quiz.length} />

        <main className="learn-main">
          <div className="learn-head">
            <button className="btn btn-ghost show-sm" onClick={() => setIndexOpen(true)}>
              <Icon name="menu" size={16} /> Index
            </button>
            {cards.length > 0 && quiz.length > 0 && (
              <div className="tabs" role="tablist" aria-label="Cards or quiz">
                <button role="tab" aria-selected={view === "cards"} className={view === "cards" ? "is-on" : ""} onClick={() => dispatch({ type: "SET_VIEW", view: "cards" })}>
                  Cards <span className="tab-count">{cards.length}</span>
                </button>
                <button role="tab" aria-selected={view === "quiz"} className={view === "quiz" ? "is-on" : ""} onClick={() => dispatch({ type: "SET_VIEW", view: "quiz" })}>
                  Quiz <span className="tab-count">{quiz.length}</span>
                </button>
              </div>
            )}
            <div className="learn-head-actions show-sm">
              <button className="icon-btn" onClick={() => setSourcesOpen(true)} aria-label="Sources">
                <Icon name="list" />
              </button>
              <button className="icon-btn" onClick={() => actions.dispatch({ type: "GO", screen: "roadmap" })} aria-label="Road map">
                <Icon name="road" />
              </button>
            </div>
          </div>

          {/* ---------- states ---------- */}
          {status === "loading" && !content && (
            <>
              <LoadingNotice label={`Building the cards for ${stop.title}...`} onRetry={() => actions.loadModule(sessionId, moduleId)} onCancel={() => actions.cancel(sessionId, "modules", moduleId)} />
              <div className="card-skeleton panel">
                <Skeleton width="30%" height={26} radius={999} />
                <Skeleton width="80%" height={30} />
                <Skeleton height={180} radius={20} />
              </div>
            </>
          )}

          {status === "error" && (
            <StatusBanner
              kind="error"
              title={`Couldn't build ${stop.title}`}
              actions={[
                ...(slot.error?.retryable !== false ? [{ label: "Try again", onClick: () => actions.loadModule(sessionId, moduleId), primary: true }] : []),
                ...(nextId ? [{ label: "Skip", onClick: () => goTo(nextId) }] : [{ label: "Road map", onClick: () => actions.dispatch({ type: "GO", screen: "roadmap" }) }]),
              ]}
            >
              {slot.error?.message}
            </StatusBanner>
          )}

          {status === "idle" && !content && !isRetest && (
            <StatusBanner kind="info" title="Getting ready" actions={[{ label: "Load cards", onClick: () => actions.loadModule(sessionId, moduleId), primary: true }]} />
          )}

          {content && cards.length === 0 && quiz.length === 0 && (
            <div className="empty panel">
              <h2>Nothing here yet</h2>
              <p className="muted">{isRetest ? "Your retest pile is empty. Nice work." : "This stop has no cards or questions."}</p>
              <button className="btn btn-primary" onClick={() => actions.dispatch({ type: "GO", screen: isRetest ? "results" : "roadmap" })}>
                {isRetest ? "See results" : "Back to road map"}
              </button>
            </div>
          )}

          {/* ---------- cards ---------- */}
          {content && view === "cards" && cards.length > 0 && (
            <>
              {(droppedCards > 0 || droppedVisuals > 0) && (
                <StatusBanner kind="partial" title="Some content didn't pass our checks">
                  {[droppedCards ? `${droppedCards} card${droppedCards > 1 ? "s" : ""} left out` : "", droppedVisuals ? `${droppedVisuals} visual${droppedVisuals > 1 ? "s" : ""} replaced with text only` : ""].filter(Boolean).join(", ")}.
                </StatusBanner>
              )}

              {card ? (
                <Flashcard
                  key={card.id}
                  card={card}
                  index={cardIndex}
                  total={cards.length}
                  tint={tintFor(cardIndex + Math.max(0, stopIndex))}
                  label={isRetest ? "Retest" : stop.title}
                  flipped={flipped}
                  onFlip={() => setFlipped((f) => !f)}
                  readMore={session.readMore[card.id]}
                  readMoreOpen={Boolean(openReadMore[card.id])}
                  onReadMore={() => (session.readMore[card.id]?.status === "error" && openReadMore[card.id] ? retryReadMore(card) : toggleReadMore(card))}
                  suggestReadMore={session.profile.readMore === "suggested" || Boolean(session.progress.readMoreHint[moduleId])}
                  rating={session.progress.ratings[card.id]}
                  onRate={rate}
                  onPrev={cardIndex > 0 ? () => dispatch({ type: "SET_CARD_INDEX", index: cardIndex - 1 }) : null}
                  onNext={() => dispatch({ type: "SET_CARD_INDEX", index: cardIndex + 1 })}
                />
              ) : (
                <DeckDone
                  cards={cards}
                  ratings={session.progress.ratings}
                  hasQuiz={quiz.length > 0}
                  onQuiz={() => dispatch({ type: "SET_VIEW", view: "quiz" })}
                  onAgain={() => dispatch({ type: "SET_CARD_INDEX", index: 0 })}
                />
              )}
            </>
          )}

          {/* ---------- quiz ---------- */}
          {content && view === "quiz" && quiz.length > 0 && (
            <>
              {(partial || reported > 0) && (
                <StatusBanner kind="partial" title={partial ? partial.message : "Question removed"}>
                  {partial ? "The rest didn't pass our checks, so we left them out." : ""}
                  {reported ? ` You reported ${reported} question${reported > 1 ? "s" : ""}.` : ""}
                </StatusBanner>
              )}
              {question ? (
                <div className="quiz panel">
                  <div className="quiz-progress">
                    <span className="muted">
                      Question {questionIndex + 1} of {quiz.length}
                    </span>
                    <span className="bar" aria-hidden="true">
                      <span style={{ width: `${(questionIndex / quiz.length) * 100}%` }} />
                    </span>
                  </div>
                  <QuizQuestion
                    key={`${question.id}:${isRetest}`}
                    question={question}
                    answer={answers[question.id]}
                    tint={tintFor(questionIndex + 2)}
                    onAnswer={(chosen, correct) => dispatch({ type: "ANSWER", questionId: question.id, chosen, correct })}
                    onNext={() => dispatch({ type: "SET_QUESTION_INDEX", index: questionIndex + 1 })}
                    nextLabel={questionIndex === quiz.length - 1 ? "Finish" : "Next"}
                    onReport={
                      isRetest
                        ? null
                        : () => {
                            if (window.confirm("Remove this question as wrong? It won't count.")) dispatch({ type: "REPORT_QUESTION", moduleId, questionId: question.id });
                          }
                    }
                  />
                </div>
              ) : (
                <StopDone
                  session={session}
                  quiz={quiz}
                  answers={answers}
                  isRetest={isRetest}
                  isFinal={moduleId === FINAL_ID}
                  next={nextId ? all.find((s) => s.id === nextId) : null}
                  onNext={() => nextId && goTo(nextId)}
                  onResults={() => actions.dispatch({ type: "GO", screen: "results" })}
                  onRoadmap={() => actions.dispatch({ type: "GO", screen: "roadmap" })}
                  onAgain={() => dispatch({ type: "SET_QUESTION_INDEX", index: 0 })}
                />
              )}
            </>
          )}
        </main>
      </div>

      {doubtContext && <DoubtBot context={doubtContext} contextKey={doubtKey} contextLabel={view === "cards" ? "this card" : "this question"} />}
      {sourcesOpen && <SourcesPanel session={session} onClose={() => setSourcesOpen(false)} />}
    </div>
  );
}

function ModuleProgress({ session, cards, quiz, answers }) {
  const rated = cards.filter((c) => session.progress.ratings[c.id]).length;
  const answered = quiz.filter((q) => answers[q.id]).length;
  const total = cards.length + quiz.length;
  const percent = total ? Math.round(((rated + answered) / total) * 100) : 0;
  return (
    <div className="track-progress">
      <span className="bar" aria-hidden="true">
        <span style={{ width: `${percent}%` }} className={percent === 100 ? "bar-done" : ""} />
      </span>
      <span className="muted">
        {cards.length > 0 && `${rated}/${cards.length} cards`}
        {cards.length > 0 && quiz.length > 0 && " · "}
        {quiz.length > 0 && `${answered}/${quiz.length} questions`}
      </span>
    </div>
  );
}

function DeckDone({ cards, ratings, hasQuiz, onQuiz, onAgain }) {
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

function StopDone({ session, quiz, answers, isRetest, isFinal, next, onNext, onResults, onRoadmap, onAgain }) {
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
