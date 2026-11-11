// The learning profile: our code decides HOW MUCH to teach, the model only fills in content.
// Level controls depth (how much each card says). Goal controls breadth (how many modules and cards).

export const LEVEL = {
  beginner: {
    basics: "include",
    answerLength: "2 to 3 sentences",
    readMore: "suggested",
    focus: "definitions, intuition, everyday analogies",
    quiz: "recall and simple application",
  },
  intermediate: {
    basics: "skip",
    answerLength: "1 to 2 sentences",
    readMore: "on request",
    focus: "mechanisms and why they work",
    quiz: "medium, apply the concept",
  },
  pro: {
    basics: "skip",
    answerLength: "1 sentence",
    readMore: "on request",
    focus: "edge cases, tradeoffs, comparisons",
    quiz: "hard, scenario based",
  },
};

export const GOAL = {
  crash: { modules: 3, cardsPerModule: 4, quizPerModule: 2, finalTest: 6 },
  mid: { modules: 5, cardsPerModule: 5, quizPerModule: 3, finalTest: 10 },
  master: { modules: 7, cardsPerModule: 6, quizPerModule: 4, finalTest: 15 },
};

export const LEVEL_LABELS = { beginner: "Beginner", intermediate: "Intermediate", pro: "Pro" };
export const GOAL_LABELS = { master: "Master", mid: "Mid level", crash: "Crash course" };

export function compileProfile(level, goal) {
  const profile = { level, goal, ...LEVEL[level], ...GOAL[goal] };
  // Beginners get 1 basics module (2 when they want to master the topic).
  profile.basicsModules = profile.basics === "include" ? (goal === "master" ? 2 : 1) : 0;
  return profile;
}

// Minimum number of valid items we accept before asking the model again (SPEC section 7, step 8).
export function minCards(profile) {
  return Math.ceil(profile.cardsPerModule * 0.6);
}

export function minQuestions(count) {
  return Math.max(2, Math.ceil(count * 0.6));
}
