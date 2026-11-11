// Values derived from state. Nothing here is stored, so it can never go out of sync.

export const FINAL_ID = "final";

// Road map stops: the plan's modules plus the final test our code always adds.
export function stops(session) {
  const modules = session.plan.data?.modules ?? [];
  return [...modules, { id: FINAL_ID, title: "Final test", phase: "test", subtopics: [], summary: "Mixed questions from every stop.", minutes: 10 }];
}

export function moduleContent(session, moduleId) {
  return session.modules[moduleId]?.data ?? null;
}

// Every question we have content for, keyed by id.
function allQuestions(session) {
  const byId = {};
  for (const slot of Object.values(session.modules)) {
    for (const q of slot?.data?.quiz ?? []) byId[q.id] = q;
  }
  return byId;
}

function allCards(session) {
  const byId = {};
  for (const slot of Object.values(session.modules)) {
    for (const c of slot?.data?.cards ?? []) byId[c.id] = c;
  }
  return byId;
}

// The retest pile is derived: wrong answers plus cards rated "review".
export function retestPile(session) {
  const cards = allCards(session);
  const questions = allQuestions(session);
  const { ratings, answers } = session.progress;
  return {
    cards: Object.keys(ratings).filter((id) => ratings[id] === "review" && cards[id]).map((id) => cards[id]),
    questions: Object.keys(answers).filter((id) => answers[id].correct === false && questions[id]).map((id) => questions[id]),
  };
}

// Content shown while a retest runs: a frozen snapshot, so items don't vanish mid-run.
export function retestContent(session) {
  if (!session.retest) return null;
  const cards = allCards(session);
  const questions = allQuestions(session);
  return {
    moduleId: "retest",
    cards: session.retest.cardIds.map((id) => cards[id]).filter(Boolean),
    quiz: session.retest.questionIds.map((id) => questions[id]).filter(Boolean),
  };
}

export function moduleScore(session, moduleId) {
  const quiz = moduleContent(session, moduleId)?.quiz ?? [];
  const answered = quiz.filter((q) => session.progress.answers[q.id]);
  const correct = answered.filter((q) => session.progress.answers[q.id].correct).length;
  return { total: quiz.length, answered: answered.length, correct };
}

export function isModuleDone(session, moduleId) {
  const content = moduleContent(session, moduleId);
  if (!content) return false;
  const { total, answered } = moduleScore(session, moduleId);
  if (total > 0) return answered === total;
  return content.cards.length > 0 && content.cards.every((c) => session.progress.ratings[c.id]);
}

export function overallScore(session) {
  let total = 0;
  let correct = 0;
  for (const stop of stops(session)) {
    const score = moduleScore(session, stop.id);
    total += score.answered;
    correct += score.correct;
  }
  const ratings = Object.values(session.progress.ratings);
  return {
    total,
    correct,
    percent: total ? Math.round((correct / total) * 100) : 0,
    cardsGot: ratings.filter((r) => r === "got").length,
    cardsReview: ratings.filter((r) => r === "review").length,
  };
}

// For the saved learnings list: share of stops finished, and what comes next.
export function sessionProgress(session) {
  const all = stops(session);
  if (!session.plan.data) return { percent: 0, next: session.plan.status === "error" ? "Plan failed: open to retry" : "Building the plan" };
  const done = all.filter((s) => isModuleDone(session, s.id)).length;
  const next = all.find((s) => !isModuleDone(session, s.id));
  return { percent: Math.round((done / all.length) * 100), next: next ? `Next: ${next.title}` : "All done" };
}

export function nextStopId(session, moduleId) {
  const all = stops(session);
  const index = all.findIndex((s) => s.id === moduleId);
  return index >= 0 && index < all.length - 1 ? all[index + 1].id : null;
}

// Stepper phases. A phase with no stops (basics for pros) shows as skipped.
export function phases(session) {
  const all = stops(session);
  const current = all.find((s) => s.id === session.currentModuleId);
  const defs = [
    { key: "basics", label: "Basics and prereqs" },
    { key: "deepdive", label: "Topic deep dive" },
    { key: "test", label: "Test and quiz" },
  ];
  return defs.map((def) => {
    const members = all.filter((s) => s.phase === def.key);
    if (members.length === 0) return { ...def, state: "skipped" };
    if (members.every((s) => isModuleDone(session, s.id))) return { ...def, state: "done" };
    if (current && current.phase === def.key) return { ...def, state: "current" };
    return { ...def, state: "todo" };
  });
}

// Lowest scoring stops, used for "New questions on weak spots".
export function weakSpots(session) {
  return stops(session)
    .map((s) => ({ stop: s, score: moduleScore(session, s.id) }))
    .filter(({ score }) => score.answered > 0 && score.correct < score.answered)
    .sort((a, b) => a.score.correct / a.score.answered - b.score.correct / b.score.answered)
    .slice(0, 3)
    .map(({ stop }) => stop);
}

export function hasBasics(session) {
  return (session.plan.data?.modules ?? []).some((m) => m.phase === "basics");
}
