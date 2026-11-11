// Reducer rules that matter most: the stale guard and the adapt rule. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { appReducer, initialState, createSession } from "./sessionReducer.js";
import { retestPile } from "./selectors.js";

function withSession() {
  const session = createSession({ topic: "TCP", notes: "", level: "beginner", goal: "crash" });
  const state = appReducer(initialState, { type: "SESSION_CREATE", session });
  return { state, id: session.id };
}

test("a stale reply never overwrites a newer one", () => {
  let { state, id } = withSession();
  state = appReducer(state, { type: "REQUEST_START", sessionId: id, slot: "plan", requestId: "old" });
  state = appReducer(state, { type: "REQUEST_START", sessionId: id, slot: "plan", requestId: "new" });

  // The newer request answers first...
  const newPlan = { title: "New", modules: [] };
  state = appReducer(state, { type: "REQUEST_SUCCESS", sessionId: id, slot: "plan", requestId: "new", data: newPlan, warnings: [] });
  // ...then the old one finally arrives and must be ignored.
  state = appReducer(state, { type: "REQUEST_SUCCESS", sessionId: id, slot: "plan", requestId: "old", data: { title: "Old", modules: [] }, warnings: [] });
  state = appReducer(state, { type: "REQUEST_FAILURE", sessionId: id, slot: "plan", requestId: "old", error: { code: "TIMEOUT" } });

  assert.equal(state.sessions[id].plan.status, "ready");
  assert.equal(state.sessions[id].plan.data.title, "New");
});

test("module slots are guarded separately by key", () => {
  let { state, id } = withSession();
  state = appReducer(state, { type: "REQUEST_START", sessionId: id, slot: "modules", key: "m1", requestId: "a" });
  state = appReducer(state, { type: "REQUEST_START", sessionId: id, slot: "modules", key: "m2", requestId: "b" });
  state = appReducer(state, { type: "REQUEST_FAILURE", sessionId: id, slot: "modules", key: "m1", requestId: "a", error: { code: "TIMEOUT" } });
  assert.equal(state.sessions[id].modules.m1.status, "error");
  assert.equal(state.sessions[id].modules.m2.status, "loading");
});

test("two Review again ratings in a row turn on the Read further hint", () => {
  let { state, id } = withSession();
  const rate = (cardId, rating) => (state = appReducer(state, { type: "RATE_CARD", sessionId: id, moduleId: "m1", cardId, rating }));
  rate("c1", "review");
  assert.equal(state.sessions[id].progress.readMoreHint.m1, undefined);
  rate("c2", "review");
  assert.equal(state.sessions[id].progress.readMoreHint.m1, true);
});

test("the retest pile is wrong answers plus cards marked review", () => {
  let { state, id } = withSession();
  const content = {
    moduleId: "m1",
    cards: [{ id: "m1-c1", front: "a", answer: "b", visual: null }, { id: "m1-c2", front: "c", answer: "d", visual: null }],
    quiz: [{ id: "m1-q1", type: "truefalse", statement: "x", answer: true, explanation: "y" }],
  };
  state = appReducer(state, { type: "REQUEST_START", sessionId: id, slot: "modules", key: "m1", requestId: "r" });
  state = appReducer(state, { type: "REQUEST_SUCCESS", sessionId: id, slot: "modules", key: "m1", requestId: "r", data: content, warnings: [] });
  state = appReducer(state, { type: "RATE_CARD", sessionId: id, moduleId: "m1", cardId: "m1-c1", rating: "review" });
  state = appReducer(state, { type: "RATE_CARD", sessionId: id, moduleId: "m1", cardId: "m1-c2", rating: "got" });
  state = appReducer(state, { type: "ANSWER", sessionId: id, questionId: "m1-q1", chosen: false, correct: false });

  const pile = retestPile(state.sessions[id]);
  assert.deepEqual(pile.cards.map((c) => c.id), ["m1-c1"]);
  assert.deepEqual(pile.questions.map((q) => q.id), ["m1-q1"]);
});

test("a reply for a deleted session is ignored without crashing", () => {
  let { state, id } = withSession();
  state = appReducer(state, { type: "SESSION_DELETE", id });
  const after = appReducer(state, { type: "REQUEST_SUCCESS", sessionId: id, slot: "plan", requestId: "x", data: {}, warnings: [] });
  assert.equal(after, state);
});
