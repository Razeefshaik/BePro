// Fixtures of bad model output (SPEC section 7). Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";

import { extractJson, parseModelText, generate } from "../llm/pipeline.js";
import { checkModuleContent, checkPlan, checkReadMore } from "../llm/checks.js";
import { compileProfile } from "../../shared/profile.js";
import { ApiError } from "../errors.js";

// A small valid module reply we can break in different ways.
function goodModule() {
  return {
    cards: [
      { front: "What is cwnd?", answer: "The congestion window.", visual: null },
      { front: "What does slow start do?", answer: "It doubles cwnd every round trip.", visual: { kind: "flow", steps: ["Start at 1", "Double per RTT"] } },
      { front: "What is ssthresh?", answer: "The point where slow start stops.", visual: null },
    ],
    quiz: [
      { type: "mcq", question: "Slow start ends at?", options: ["rwnd", "ssthresh", "MSS"], answerIndex: 1, explanation: "It switches at ssthresh." },
      { type: "truefalse", statement: "Slow start is slow.", answer: false, explanation: "It grows fastest." },
    ],
  };
}

const moduleOptions = { moduleId: "m1", cardCount: 4, quizCount: 2, notes: "" };

// ---------- parsing ----------

test("JSON inside markdown fences is extracted", () => {
  const text = "```json\n" + JSON.stringify(goodModule()) + "\n```";
  const parsed = parseModelText(text);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.cards.length, 3);
});

test("JSON with prose before and after is extracted", () => {
  const text = "Sure! Here is your module:\n" + JSON.stringify(goodModule()) + "\nHope this helps.";
  assert.equal(parseModelText(text).ok, true);
});

test("a truncated JSON object fails to parse with a hint", () => {
  const text = JSON.stringify(goodModule()).slice(0, 120);
  const parsed = parseModelText(text);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.code, "INVALID_OUTPUT");
});

test("an empty string is EMPTY_OUTPUT", () => {
  assert.equal(parseModelText("").code, "EMPTY_OUTPUT");
  assert.equal(parseModelText("   \n").code, "EMPTY_OUTPUT");
  assert.equal(parseModelText(undefined).code, "EMPTY_OUTPUT");
});

test("extractJson returns null when there is no object", () => {
  assert.equal(extractJson("no json here"), null);
});

// ---------- container and items ----------

test("the wrong top level shape is rejected", () => {
  const result = checkModuleContent({ flashcards: [], questions: [] }, moduleOptions);
  assert.equal(result.ok, false);
  assert.match(result.hint, /Wrong top level shape/);
});

test("an answerIndex out of range drops only that question", () => {
  const value = goodModule();
  value.quiz.push({ type: "mcq", question: "Bad index?", options: ["a", "b"], answerIndex: 5, explanation: "x" });
  const result = checkModuleContent(value, { ...moduleOptions, quizCount: 3 });
  assert.equal(result.ok, true);
  assert.equal(result.data.quiz.length, 2);
  assert.ok(result.warnings.some((w) => w.code === "QUESTION_DROPPED"));
  assert.ok(result.warnings.some((w) => w.code === "PARTIAL" && w.message === "2 of 3 questions passed checks."));
});

test("duplicate options drop the question", () => {
  const value = goodModule();
  value.quiz.push({ type: "mcq", question: "Dupes?", options: ["Same", " same ", "Other"], answerIndex: 0, explanation: "x" });
  const result = checkModuleContent(value, { ...moduleOptions, quizCount: 3 });
  assert.equal(result.data.quiz.length, 2);
  assert.ok(result.warnings.some((w) => /duplicate options/.test(w.message)));
});

test("a chart with mismatched arrays loses its visual but keeps the card", () => {
  const value = goodModule();
  value.cards[0].visual = { kind: "chart", chartType: "bar", labels: ["a", "b", "c"], values: [1, 2], caption: "" };
  const result = checkModuleContent(value, moduleOptions);
  assert.equal(result.ok, true);
  assert.equal(result.data.cards[0].visual, null);
  assert.equal(result.data.cards.length, 3);
  assert.ok(result.warnings.some((w) => w.code === "VISUAL_DROPPED"));
});

test("a diagram edge pointing to a missing node drops the visual", () => {
  const value = goodModule();
  value.cards[1].visual = {
    kind: "diagram",
    nodes: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
    edges: [{ from: "a", to: "z" }],
  };
  const result = checkModuleContent(value, moduleOptions);
  assert.equal(result.data.cards[1].visual, null);
  assert.ok(result.warnings.some((w) => /missing node/.test(w.message)));
});

test("a notes mode quote that is not in the notes is flagged, not dropped", () => {
  const notes = "Slow start doubles the congestion window every round trip.";
  const value = goodModule();
  value.cards[0].sourceQuote = "slow start  DOUBLES the congestion window";
  value.cards[1].sourceQuote = "This sentence is not in the notes.";
  const result = checkModuleContent(value, { ...moduleOptions, notes });
  assert.equal(result.data.cards[0].ungrounded, undefined);
  assert.equal(result.data.cards[1].ungrounded, true);
  assert.equal(result.data.cards.length, 3);
});

test("too few valid cards fails the thresholds", () => {
  const value = goodModule();
  value.cards = [value.cards[0], { front: 42 }];
  const result = checkModuleContent(value, moduleOptions);
  assert.equal(result.ok, false);
  assert.match(result.hint, /valid cards/);
});

test("duplicate card fronts are dropped and ids are ours", () => {
  const value = goodModule();
  value.cards.push({ ...value.cards[0], id: "model-id" });
  const result = checkModuleContent(value, moduleOptions);
  assert.equal(result.data.cards.length, 3);
  assert.deepEqual(result.data.cards.map((c) => c.id), ["m1-c1", "m1-c2", "m1-c3"]);
});

// ---------- plan ----------

test("plan module count must match the goal, give or take one", () => {
  const profile = compileProfile("pro", "mid"); // 5 modules
  const module = (i) => ({ id: `m${i}`, title: `Topic ${i}`, summary: "", phase: "deepdive", minutes: 6, subtopics: ["a"] });
  const tooFew = { title: "T", modules: [module(1), module(2)] };
  assert.equal(checkPlan(tooFew, { profile }).ok, false);
  const fine = { title: "T", modules: [1, 2, 3, 4].map(module) };
  assert.equal(checkPlan(fine, { profile }).ok, true);
});

test("plan fixes duplicate ids, clamps minutes and removes basics for pros", () => {
  const profile = compileProfile("pro", "crash"); // 3 modules, no basics
  const value = {
    title: "T",
    modules: [
      { id: "x", title: "A", phase: "basics", minutes: 40, subtopics: ["1", "2", "3", "4", "5", "6"] },
      { id: "x", title: "B", phase: "deepdive", minutes: 1, subtopics: ["1"] },
      { id: "bad id!", title: "C", phase: "deepdive", minutes: 5, subtopics: ["1"] },
    ],
  };
  const result = checkPlan(value, { profile });
  assert.equal(result.ok, true);
  const ids = result.data.modules.map((m) => m.id);
  assert.equal(new Set(ids).size, 3);
  assert.equal(result.data.modules[0].minutes, 15);
  assert.equal(result.data.modules[0].subtopics.length, 5);
  assert.ok(result.data.modules.every((m) => m.phase === "deepdive"));
});

// ---------- read more ----------

test("read more drops paragraphs over 120 words", () => {
  const long = Array(130).fill("word").join(" ");
  const result = checkReadMore({ paragraphs: ["Short one.", long] });
  assert.equal(result.ok, true);
  assert.deepEqual(result.data.paragraphs, ["Short one."]);
});

// ---------- the retry loop ----------

test("generate retries once with the problem appended, then succeeds", async () => {
  const prompts = [];
  const replies = ["not json at all", JSON.stringify(goodModule())];
  const complete = async ({ user }) => {
    prompts.push(user);
    return replies.shift();
  };
  const result = await generate({
    prompt: { system: "s", user: "make cards" },
    complete,
    check: (v) => checkModuleContent(v, moduleOptions),
  });
  assert.equal(result.data.cards.length, 3);
  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /previous reply was rejected/);
});

test("generate gives up after 2 attempts with INVALID_OUTPUT", async () => {
  let calls = 0;
  const complete = async () => {
    calls++;
    return '{"cards": "nope"}';
  };
  await assert.rejects(
    generate({ prompt: { system: "s", user: "u" }, complete, check: (v) => checkModuleContent(v, moduleOptions) }),
    (error) => error instanceof ApiError && error.code === "INVALID_OUTPUT" && error.retryable === true
  );
  assert.equal(calls, 2);
});

test("generate reports EMPTY_OUTPUT when both replies are blank", async () => {
  await assert.rejects(
    generate({ prompt: { system: "s", user: "u" }, complete: async () => "", check: () => ({ ok: true }) }),
    (error) => error.code === "EMPTY_OUTPUT"
  );
});
