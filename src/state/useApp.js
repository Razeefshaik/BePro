// The one hook screens use. It owns the reducer, starts requests, and saves to localStorage.
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { appReducer, createSession } from "./sessionReducer.js";
import { loadState, saveState } from "./persistence.js";
import { api } from "../api/client.js";
import { makeId, shuffleQuestion } from "./ids.js";
import { FINAL_ID } from "./selectors.js";

export function useApp() {
  const [state, dispatch] = useReducer(appReducer, undefined, loadState);

  // Async callbacks need the latest state, not the state from when they were created.
  const stateRef = useRef(state);
  stateRef.current = state;

  // One AbortController per slot: starting a request aborts the previous one for the same slot.
  const controllers = useRef({});

  // Save 500 ms after the last change.
  useEffect(() => {
    const timer = setTimeout(() => saveState(state), 500);
    return () => clearTimeout(timer);
  }, [state]);

  const run = useCallback((sessionId, slot, key, call, extra = {}) => {
    const controllerKey = `${sessionId}:${slot}:${key ?? ""}`;
    controllers.current[controllerKey]?.abort();
    const controller = new AbortController();
    controllers.current[controllerKey] = controller;

    const requestId = makeId();
    dispatch({ type: "REQUEST_START", sessionId, slot, key, requestId });

    call(controller.signal).then((result) => {
      if (controllers.current[controllerKey] === controller) delete controllers.current[controllerKey];
      const base = { sessionId, slot, key, requestId };
      if (result.ok) dispatch({ type: "REQUEST_SUCCESS", ...base, data: result.data, warnings: result.warnings, ...extra });
      else if (result.error.code === "CANCELLED") dispatch({ type: "REQUEST_CANCEL", ...base });
      else dispatch({ type: "REQUEST_FAILURE", ...base, error: result.error });
    });
  }, []);

  const cancel = useCallback((sessionId, slot, key) => {
    controllers.current[`${sessionId}:${slot}:${key ?? ""}`]?.abort();
  }, []);

  const actions = useMemo(() => {
    const session = (id) => stateRef.current.sessions[id];

    function buildPlan(sessionId) {
      const s = session(sessionId);
      if (!s) return;
      const { topic, notes, level, goal } = s.input;
      run(sessionId, "plan", undefined, (signal) => api.plan({ topic, notes, level, goal }, signal));
    }

    function startLearning(input) {
      const s = createSession(input);
      dispatch({ type: "SESSION_CREATE", session: s });
      // The reducer has not run yet, so pass what buildPlan needs directly.
      stateRef.current = { ...stateRef.current, sessions: { ...stateRef.current.sessions, [s.id]: s } };
      buildPlan(s.id);
    }

    function adjustPlan(sessionId, instruction, { addBasics = false } = {}) {
      const s = session(sessionId);
      if (!s?.plan.data) return;
      const { notes, level, goal } = s.input;
      run(
        sessionId,
        "planEdit",
        undefined,
        (signal) => api.plan({ existingPlan: s.plan.data, instruction, notes, level, goal, addBasics }, signal),
        { addBasics }
      );
    }

    // Quiz options are shuffled once, when content arrives.
    const withShuffledQuiz = (promise) =>
      promise.then((r) => (r.ok ? { ...r, data: { ...r.data, quiz: r.data.quiz.map(shuffleQuestion) } } : r));

    function loadModule(sessionId, moduleId) {
      const s = session(sessionId);
      if (!s?.plan.data) return;
      const { notes, level, goal } = s.input;
      const planTitle = s.plan.data.title;

      if (moduleId === FINAL_ID) {
        const modules = s.plan.data.modules.map(({ id, title, summary, subtopics }) => ({ id, title, summary, subtopics }));
        run(sessionId, "modules", FINAL_ID, (signal) =>
          withShuffledQuiz(api.module({ kind: "final", planTitle, modules, notes, level, goal }, signal))
        );
        return;
      }
      const m = s.plan.data.modules.find((x) => x.id === moduleId);
      if (!m) return;
      const module = { id: m.id, title: m.title, summary: m.summary, subtopics: m.subtopics };
      run(sessionId, "modules", moduleId, (signal) => withShuffledQuiz(api.module({ planTitle, module, notes, level, goal }, signal)));
    }

    function loadReadMore(sessionId, card) {
      const s = session(sessionId);
      if (!s) return;
      const existing = s.readMore[card.id];
      if (existing && (existing.status === "ready" || existing.status === "loading")) return; // cached
      run(sessionId, "readMore", card.id, (signal) =>
        api.readMore(
          { card: { front: card.front, answer: card.answer }, planTitle: s.plan.data?.title ?? s.input.topic, level: s.input.level, notes: s.input.notes },
          signal
        )
      );
    }

    function runSkipCheck(sessionId) {
      const s = session(sessionId);
      if (!s?.plan.data) return;
      run(sessionId, "skipCheck", undefined, (signal) =>
        withShuffledQuiz(api.module({ kind: "skipcheck", planTitle: s.plan.data.title, level: s.input.level, goal: s.input.goal }, signal))
      );
    }

    return {
      dispatch,
      startLearning,
      buildPlan,
      adjustPlan,
      loadModule,
      loadReadMore,
      runSkipCheck,
      cancel,
      saveNow: () => saveState(stateRef.current),
    };
  }, [run, cancel]);

  const activeSession = state.activeId ? state.sessions[state.activeId] : null;
  return { state, activeSession, actions };
}
