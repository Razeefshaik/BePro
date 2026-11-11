// Save and load sessions in localStorage. Every read and write is wrapped in try/catch:
// private windows, full storage or corrupted data must never crash the app.
import { initialState, STATE_VERSION, emptySlot } from "./sessionReducer.js";

const KEY = "bepro.sessions.v1";

export function loadState() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return initialState;
  }
  if (!raw) return initialState;

  try {
    const saved = JSON.parse(raw);
    if (saved?.version !== STATE_VERSION || typeof saved.sessions !== "object" || !Array.isArray(saved.order)) {
      throw new Error("unknown shape");
    }
    const sessions = {};
    for (const id of saved.order) {
      const s = saved.sessions[id];
      if (s && s.id === id && s.input && s.profile && s.plan && s.progress) sessions[id] = resetLoading(s);
    }
    const order = saved.order.filter((id) => sessions[id]);
    const activeId = sessions[saved.activeId] ? saved.activeId : null;
    return { version: STATE_VERSION, sessions, order, activeId, screen: activeId ? saved.screen || "roadmap" : "start" };
  } catch {
    // Corrupted data is ignored and cleared.
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* nothing else we can do */
    }
    return initialState;
  }
}

// A request that was running when the page closed is gone: show it as idle so it can be retried.
function resetLoading(session) {
  const fix = (slot) => (slot && slot.status === "loading" ? { ...slot, status: slot.data ? "ready" : "idle", requestId: null } : slot ?? emptySlot());
  const modules = {};
  for (const [id, slot] of Object.entries(session.modules || {})) modules[id] = fix(slot);
  const readMore = {};
  for (const [id, slot] of Object.entries(session.readMore || {})) readMore[id] = fix(slot);
  return { ...session, plan: fix(session.plan), planEdit: emptySlot(), skipCheck: fix(session.skipCheck), modules, readMore };
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, version: STATE_VERSION }));
    return true;
  } catch {
    return false; // storage full or blocked: the app keeps working, just without saving
  }
}

// Small per-viewer preferences (theme).
export function loadPref(name, fallback) {
  try {
    return localStorage.getItem(`bepro.${name}`) ?? fallback;
  } catch {
    return fallback;
  }
}

export function savePref(name, value) {
  try {
    localStorage.setItem(`bepro.${name}`, value);
  } catch {
    /* ignore */
  }
}
