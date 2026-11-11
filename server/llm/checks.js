// Endpoint specific checks: SPEC section 7, steps 4 to 8.
// Each function takes the parsed JSON and returns
//   { ok: true, data, warnings }  or  { ok: false, code, hint }
// `hint` is written for the model: it is appended to the prompt on the retry.

import {
  moduleContainerSchema,
  quizContainerSchema,
  rawCardSchema,
  rawQuestionSchema,
  visualSchema,
  planContainerSchema,
  rawPlanModuleSchema,
  readMoreSchema,
  doubtSchema,
  summarizeZodError,
} from "../../shared/schemas.js";
import { minCards, minQuestions } from "../../shared/profile.js";

const fail = (hint) => ({ ok: false, code: "INVALID_OUTPUT", hint });

// Lowercase and collapse whitespace so "  Foo\nBar" and "foo bar" compare equal.
export function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[“”"‘’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Notes mode: the quote must really appear in the user's notes.
export function isGrounded(sourceQuote, notes) {
  if (!sourceQuote) return false;
  return normalize(notes).includes(normalize(sourceQuote));
}

// ---------- Module content (cards + quiz) ----------

// options: { moduleId, cardCount, quizCount, notes, cardsRequired }
export function checkModuleContent(value, options) {
  const { moduleId, cardCount, quizCount, notes = "", cardsRequired = true } = options;
  const container = (cardsRequired ? moduleContainerSchema : quizContainerSchema).safeParse(value);
  if (!container.success) {
    return fail(`Wrong top level shape: ${summarizeZodError(container.error)}`);
  }

  const warnings = [];
  const notesMode = notes.trim().length > 0;
  const cards = cardsRequired ? keepValidCards(container.data.cards, { moduleId, notes, notesMode, warnings }) : [];
  const quiz = keepValidQuestions(container.data.quiz, { moduleId, notes, notesMode, warnings });

  // Step 8: thresholds. Too few good items means the reply is not worth showing.
  const needCards = cardsRequired ? minCards({ cardsPerModule: cardCount }) : 0;
  const needQuestions = minQuestions(quizCount);
  if (cards.length < needCards || quiz.length < needQuestions) {
    const problems = warnings.slice(0, 3).map((w) => w.message).join(" ");
    return fail(
      `Only ${cards.length} valid cards (need ${needCards}) and ${quiz.length} valid questions (need ${needQuestions}). ${problems}`
    );
  }

  const receivedQuestions = container.data.quiz.length;
  const keptCards = cards.slice(0, cardCount);
  const keptQuiz = quiz.slice(0, quizCount);
  if (keptQuiz.length < Math.min(receivedQuestions, quizCount)) {
    warnings.push({
      code: "PARTIAL",
      message: `${keptQuiz.length} of ${Math.min(receivedQuestions, quizCount)} questions passed checks.`,
    });
  }

  return { ok: true, data: { moduleId, cards: keptCards, quiz: keptQuiz }, warnings };
}

function keepValidCards(rawCards, { moduleId, notes, notesMode, warnings }) {
  const cards = [];
  const seenFronts = new Set();

  rawCards.forEach((raw, index) => {
    const parsed = rawCardSchema.safeParse(raw);
    if (!parsed.success) {
      warnings.push({ code: "CARD_DROPPED", message: `Card ${index + 1} was dropped (${summarizeZodError(parsed.error, 2)}).` });
      return;
    }
    const card = parsed.data;
    const key = normalize(card.front);
    if (seenFronts.has(key)) {
      warnings.push({ code: "CARD_DROPPED", message: `Card ${index + 1} repeated an earlier card.` });
      return;
    }
    seenFronts.add(key);

    // Step 7: a bad visual is dropped, the card stays.
    let visual = null;
    if (card.visual !== undefined && card.visual !== null) {
      const checked = visualSchema.safeParse(card.visual);
      if (checked.success) {
        visual = checked.data;
      } else {
        warnings.push({ code: "VISUAL_DROPPED", message: `The visual on card ${index + 1} was dropped (${summarizeZodError(checked.error, 1)}).` });
      }
    }

    const result = {
      id: `${moduleId}-c${cards.length + 1}`,
      front: card.front,
      answer: card.answer,
      visual,
    };
    if (notesMode) {
      result.sourceQuote = card.sourceQuote || "";
      if (!isGrounded(card.sourceQuote, notes)) result.ungrounded = true;
    }
    cards.push(result);
  });

  return cards;
}

function keepValidQuestions(rawQuestions, { moduleId, notes, notesMode, warnings }) {
  const questions = [];
  const seenPrompts = new Set();

  rawQuestions.forEach((raw, index) => {
    const parsed = rawQuestionSchema.safeParse(raw);
    if (!parsed.success) {
      warnings.push({ code: "QUESTION_DROPPED", message: `Question ${index + 1} was dropped (${summarizeZodError(parsed.error, 2)}).` });
      return;
    }
    const q = parsed.data;

    if (q.type === "mcq") {
      if (q.answerIndex < 0 || q.answerIndex >= q.options.length) {
        warnings.push({ code: "QUESTION_DROPPED", message: `Question ${index + 1} had an answer index outside its options.` });
        return;
      }
      const uniqueOptions = new Set(q.options.map(normalize));
      if (uniqueOptions.size !== q.options.length) {
        warnings.push({ code: "QUESTION_DROPPED", message: `Question ${index + 1} had duplicate options.` });
        return;
      }
    }

    const key = normalize(q.type === "mcq" ? q.question : q.statement);
    if (seenPrompts.has(key)) {
      warnings.push({ code: "QUESTION_DROPPED", message: `Question ${index + 1} repeated an earlier question.` });
      return;
    }
    seenPrompts.add(key);

    const result = { ...q, id: `${moduleId}-q${questions.length + 1}` };
    delete result.sourceQuote;
    if (notesMode) {
      result.sourceQuote = q.sourceQuote || "";
      if (!isGrounded(q.sourceQuote, notes)) result.ungrounded = true;
    }
    questions.push(result);
  });

  return questions;
}

// ---------- Plan ----------

const SAFE_ID = /^[a-z0-9_-]{1,40}$/i;

// options: { profile, mode: "new" | "adjust", addBasics }
export function checkPlan(value, { profile, mode = "new", addBasics = false }) {
  const container = planContainerSchema.safeParse(value);
  if (!container.success) {
    return fail(`Wrong top level shape: ${summarizeZodError(container.error)}`);
  }

  const warnings = [];
  const usedIds = new Set();
  const basicsAllowed = profile.basics === "include" || addBasics;
  const modules = [];

  container.data.modules.forEach((raw, index) => {
    const parsed = rawPlanModuleSchema.safeParse(raw);
    if (!parsed.success) {
      warnings.push({ code: "MODULE_DROPPED", message: `Stop ${index + 1} was dropped (${summarizeZodError(parsed.error, 2)}).` });
      return;
    }
    const m = parsed.data;

    // Keep the model's id when it is safe and unused (so progress survives plan edits), else make one.
    let id = typeof m.id === "string" && SAFE_ID.test(m.id) && !usedIds.has(m.id) ? m.id : null;
    if (!id) {
      let n = modules.length + 1;
      while (usedIds.has(`m${n}`)) n++;
      id = `m${n}`;
    }
    usedIds.add(id);

    modules.push({
      id,
      title: m.title,
      summary: m.summary,
      phase: m.phase === "basics" && !basicsAllowed ? "deepdive" : m.phase,
      minutes: Math.min(15, Math.max(2, Math.round(m.minutes))),
      subtopics: m.subtopics.slice(0, 5),
    });
  });

  // Basics always come first on the road.
  modules.sort((a, b) => (a.phase === b.phase ? 0 : a.phase === "basics" ? -1 : 1));

  if (modules.length === 0) {
    return fail("The plan had no valid modules.");
  }
  if (mode === "new" && Math.abs(modules.length - profile.modules) > 1) {
    return fail(`The plan must have ${profile.modules} modules (you sent ${modules.length} valid ones).`);
  }
  if (modules.length > 12) {
    return fail("The plan must have at most 12 modules.");
  }
  if (mode === "new" && profile.basics === "include" && !modules.some((m) => m.phase === "basics")) {
    warnings.push({ code: "BASICS_MISSING", message: "The plan has no basics module." });
  }

  return { ok: true, data: { title: container.data.title, modules }, warnings };
}

// ---------- Read more ----------

export function checkReadMore(value) {
  const parsed = readMoreSchema.safeParse(value);
  if (!parsed.success) return fail(`Wrong shape: ${summarizeZodError(parsed.error)}`);

  const warnings = [];
  const paragraphs = parsed.data.paragraphs
    .map((p) => String(p).trim())
    .filter((p) => {
      const words = p.split(/\s+/).filter(Boolean).length;
      if (words === 0) return false;
      if (words > 120) {
        warnings.push({ code: "PARAGRAPH_DROPPED", message: "A paragraph over 120 words was dropped." });
        return false;
      }
      return true;
    })
    .slice(0, 4);

  if (paragraphs.length === 0) return fail("Send 1 to 4 paragraphs, each under 120 words.");

  return {
    ok: true,
    data: {
      paragraphs,
      example: parsed.data.example || null,
      commonMistake: parsed.data.commonMistake || null,
    },
    warnings,
  };
}

// ---------- Doubt bot ----------

export function checkDoubt(value) {
  const parsed = doubtSchema.safeParse(value);
  if (!parsed.success) return fail(`Wrong shape: ${summarizeZodError(parsed.error)}`);
  return { ok: true, data: { answer: parsed.data.answer.slice(0, 1500) }, warnings: [] };
}
