// crypto.randomUUID exists on localhost and https. The fallback keeps old browsers working.
export function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Fisher-Yates shuffle of a copy.
export function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Models like to put the right answer first, so we shuffle options and remap answerIndex.
export function shuffleQuestion(question) {
  if (question.type !== "mcq") return question;
  const order = shuffled(question.options.map((_, i) => i));
  return {
    ...question,
    options: order.map((i) => question.options[i]),
    answerIndex: order.indexOf(question.answerIndex),
  };
}
