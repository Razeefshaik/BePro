// All app state lives here. Screens read it and dispatch actions; they never mutate it.
//
// App state:  { version, sessions: { [id]: Session }, order: [id], activeId, screen }
// A request "slot" (plan, a module, a read-more) looks like:
//   { status: "idle" | "loading" | "ready" | "error", data, warnings, error, requestId }
//
// STALE GUARD: every request gets a fresh requestId, stored in its slot on *_START.
// A SUCCESS or FAILURE whose requestId is not the slot's current one is ignored,
// so an old, slow reply can never overwrite a newer one.

import { compileProfile } from "../../shared/profile.js";
import { makeId } from "./ids.js";

export const STATE_VERSION = 1;

export const initialState = { version: STATE_VERSION, sessions: {}, order: [], activeId: null, screen: "start" };

export const emptySlot = () => ({ status: "idle", data: null, warnings: [], error: null, requestId: null });

export function createSession({ topic, notes, level, goal }) {
  const now = Date.now();
  return {
    id: makeId(),
    createdAt: now,
    updatedAt: now,
    input: { topic: topic.trim(), notes: notes.trim(), level, goal },
    profile: compileProfile(level, goal),
    plan: emptySlot(),
    planEdit: emptySlot(), // "Adjust plan" requests: the current plan stays on screen meanwhile
    skipCheck: emptySlot(),
    modules: {}, // moduleId -> slot with { moduleId, cards, quiz }
    readMore: {}, // cardId -> slot
    progress: {
      ratings: {}, // cardId -> "got" | "review"
      answers: {}, // questionId -> { chosen, correct }
      reviewStreak: {}, // moduleId -> "review" ratings in a row
      readMoreHint: {}, // moduleId -> true once the streak hits 2
    },
    skipCheckResult: null, // null | "skipped" | "added"
    currentModuleId: null,
    view: "cards", // "cards" | "quiz"
    cardIndex: 0,
    questionIndex: 0,
    retest: null, // { cardIds, questionIds, answers } while a retest runs
  };
}

// ---------- helpers ----------

function updateSession(state, sessionId, change) {
  const session = state.sessions[sessionId];
  if (!session) return state; // the session was deleted while a request was running
  const next = { ...session, ...change(session), updatedAt: Date.now() };
  return { ...state, sessions: { ...state.sessions, [sessionId]: next } };
}

// Reads and writes a slot. Slots live at session[slot] or session[slot][key].
function getSlot(session, slot, key) {
  return key === undefined ? session[slot] : session[slot][key] ?? emptySlot();
}
function setSlot(session, slot, key, value) {
  return key === undefined ? { [slot]: value } : { [slot]: { ...session[slot], [key]: value } };
}

function editPlan(session, change) {
  const plan = session.plan.data;
  if (!plan) return {};
  return { plan: { ...session.plan, data: { ...plan, modules: change(plan.modules) } } };
}

// ---------- reducer ----------

export function appReducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "GO":
      return { ...state, screen: action.screen };

    case "SESSION_CREATE":
      return {
        ...state,
        sessions: { ...state.sessions, [action.session.id]: action.session },
        order: [action.session.id, ...state.order],
        activeId: action.session.id,
        screen: "roadmap",
      };

    case "SESSION_OPEN": {
      const session = state.sessions[action.id];
      if (!session) return state;
      const screen = session.plan.status === "ready" && session.currentModuleId ? "learn" : "roadmap";
      return { ...state, activeId: action.id, screen };
    }

    case "SESSION_DELETE": {
      const sessions = { ...state.sessions };
      delete sessions[action.id];
      const activeId = state.activeId === action.id ? null : state.activeId;
      return { ...state, sessions, order: state.order.filter((id) => id !== action.id), activeId, screen: activeId ? state.screen : "start" };
    }

    case "NEW_LEARNING":
      return { ...state, activeId: null, screen: "start" };

    // ----- requests (stale guard) -----

    case "REQUEST_START":
      return updateSession(state, action.sessionId, (s) =>
        setSlot(s, action.slot, action.key, {
          ...getSlot(s, action.slot, action.key),
          status: "loading",
          error: null,
          requestId: action.requestId,
        })
      );

    case "REQUEST_SUCCESS":
    case "REQUEST_FAILURE":
    case "REQUEST_CANCEL":
      return updateSession(state, action.sessionId, (s) => {
        const slot = getSlot(s, action.slot, action.key);
        if (slot.requestId !== action.requestId) return {}; // stale: a newer request owns this slot

        if (action.type === "REQUEST_CANCEL") {
          return setSlot(s, action.slot, action.key, { ...slot, status: slot.data ? "ready" : "idle", requestId: null });
        }
        if (action.type === "REQUEST_FAILURE") {
          return setSlot(s, action.slot, action.key, { ...slot, status: "error", error: action.error, requestId: null });
        }

        // "Adjust plan" replaces the plan itself; module content for unchanged ids is kept.
        if (action.slot === "planEdit") {
          return {
            planEdit: { ...emptySlot(), status: "ready", warnings: action.warnings },
            plan: { ...s.plan, data: action.data, warnings: action.warnings },
            ...(action.addBasics ? { skipCheckResult: "added" } : {}),
          };
        }
        return setSlot(s, action.slot, action.key, {
          status: "ready",
          data: action.data,
          warnings: action.warnings,
          error: null,
          requestId: null,
        });
      });

    // ----- road map edits (no model call) -----

    case "PLAN_RENAME":
      return updateSession(state, action.sessionId, (s) =>
        editPlan(s, (mods) => mods.map((m) => (m.id === action.id ? { ...m, title: action.title.slice(0, 90) } : m)))
      );

    case "PLAN_DELETE":
      return updateSession(state, action.sessionId, (s) =>
        s.plan.data.modules.length <= 1 ? {} : editPlan(s, (mods) => mods.filter((m) => m.id !== action.id))
      );

    case "PLAN_MOVE":
      return updateSession(state, action.sessionId, (s) =>
        editPlan(s, (mods) => {
          const from = mods.findIndex((m) => m.id === action.id);
          const to = from + action.delta;
          if (from < 0 || to < 0 || to >= mods.length) return mods;
          const copy = [...mods];
          [copy[from], copy[to]] = [copy[to], copy[from]];
          return copy;
        })
      );

    case "PLAN_INSERT":
      return updateSession(state, action.sessionId, (s) =>
        editPlan(s, (mods) => {
          const copy = [...mods];
          const neighbour = copy[Math.max(0, action.index - 1)];
          copy.splice(action.index, 0, {
            id: `u${Date.now().toString(36)}`,
            title: action.title.slice(0, 90),
            summary: "",
            phase: neighbour?.phase === "basics" && action.index <= 1 ? "basics" : "deepdive",
            minutes: 6,
            subtopics: [],
          });
          return copy;
        })
      );

    case "SUBTOPIC_ADD":
      return updateSession(state, action.sessionId, (s) =>
        editPlan(s, (mods) =>
          mods.map((m) => (m.id === action.id && m.subtopics.length < 8 ? { ...m, subtopics: [...m.subtopics, action.text.slice(0, 60)] } : m))
        )
      );

    case "SUBTOPIC_REMOVE":
      return updateSession(state, action.sessionId, (s) =>
        editPlan(s, (mods) => mods.map((m) => (m.id === action.id ? { ...m, subtopics: m.subtopics.filter((_, i) => i !== action.index) } : m)))
      );

    case "SKIPCHECK_DONE":
      return updateSession(state, action.sessionId, () => ({ skipCheckResult: action.result }));

    // ----- learning -----

    case "START_MODULE":
      return {
        ...updateSession(state, action.sessionId, () => ({
          currentModuleId: action.moduleId,
          view: action.moduleId === "final" ? "quiz" : "cards",
          cardIndex: 0,
          questionIndex: 0,
          retest: null,
        })),
        screen: "learn",
      };

    case "SET_VIEW":
      return updateSession(state, action.sessionId, () => ({ view: action.view }));

    case "SET_CARD_INDEX":
      return updateSession(state, action.sessionId, () => ({ cardIndex: action.index }));

    case "SET_QUESTION_INDEX":
      return updateSession(state, action.sessionId, () => ({ questionIndex: action.index }));

    case "RATE_CARD":
      return updateSession(state, action.sessionId, (s) => {
        const streak = action.rating === "review" ? (s.progress.reviewStreak[action.moduleId] || 0) + 1 : 0;
        return {
          progress: {
            ...s.progress,
            ratings: { ...s.progress.ratings, [action.cardId]: action.rating },
            reviewStreak: { ...s.progress.reviewStreak, [action.moduleId]: streak },
            // Adapt during the session: 2 "Review again" in a row suggests Read further for the rest.
            readMoreHint: streak >= 2 ? { ...s.progress.readMoreHint, [action.moduleId]: true } : s.progress.readMoreHint,
          },
        };
      });

    case "ANSWER":
      return updateSession(state, action.sessionId, (s) => {
        const answer = { chosen: action.chosen, correct: action.correct };
        return {
          progress: { ...s.progress, answers: { ...s.progress.answers, [action.questionId]: answer } },
          retest: s.retest ? { ...s.retest, answers: { ...s.retest.answers, [action.questionId]: answer } } : null,
        };
      });

    case "REPORT_QUESTION":
      return updateSession(state, action.sessionId, (s) => {
        const slot = s.modules[action.moduleId];
        if (!slot?.data) return {};
        const quiz = slot.data.quiz.filter((q) => q.id !== action.questionId);
        const warnings = [...slot.warnings, { code: "REPORTED", message: "You reported a question; it was removed." }];
        const answers = { ...s.progress.answers };
        delete answers[action.questionId];
        return {
          modules: { ...s.modules, [action.moduleId]: { ...slot, data: { ...slot.data, quiz }, warnings } },
          progress: { ...s.progress, answers },
          questionIndex: Math.min(s.questionIndex, Math.max(0, quiz.length - 1)),
        };
      });

    case "START_RETEST":
      return {
        ...updateSession(state, action.sessionId, () => ({
          currentModuleId: "retest",
          retest: { cardIds: action.cardIds, questionIds: action.questionIds, answers: {} },
          view: action.cardIds.length ? "cards" : "quiz",
          cardIndex: 0,
          questionIndex: 0,
        })),
        screen: "learn",
      };

    default:
      return state;
  }
}
