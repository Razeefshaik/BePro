import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon.jsx";
import AppBar from "../components/AppBar.jsx";
import SkipCheck from "../components/SkipCheck.jsx";
import { LoadingNotice, Skeleton, StatusBanner, CardDeco, tintFor } from "../components/common.jsx";
import { stops, isModuleDone, hasBasics, FINAL_ID } from "../state/selectors.js";
import { LEVEL_LABELS, GOAL_LABELS } from "../../shared/profile.js";

const QUICK_EDITS = ["More practical", "Shorter", "More examples", "Make it harder"];
const PHASE_LABEL = { basics: "Basics and prereqs", deepdive: "Topic deep dive", test: "Test and quiz" };

export default function RoadmapScreen({ session, actions, theme, toggleTheme }) {
  const { plan, planEdit, profile, input } = session;
  const sessionId = session.id;
  const [selected, setSelected] = useState(null);
  const [instruction, setInstruction] = useState("");
  const [showSkipCheck, setShowSkipCheck] = useState(false);

  // A plan request that was interrupted (page closed) starts again.
  useEffect(() => {
    if (plan.status === "idle") actions.buildPlan(sessionId);
  }, [plan.status, sessionId, actions]);

  // Prefetch the first stop's cards while the learner looks at the map.
  const firstId = plan.data?.modules[0]?.id;
  const firstStatus = firstId ? session.modules[firstId]?.status : null;
  useEffect(() => {
    if (plan.status === "ready" && planEdit.status !== "loading" && firstId && !firstStatus) actions.loadModule(sessionId, firstId);
  }, [plan.status, planEdit.status, firstId, firstStatus, sessionId, actions]);

  const all = plan.data ? stops(session) : [];
  const started = Object.keys(session.progress.ratings).length + Object.keys(session.progress.answers).length > 0;

  function start() {
    const next = all.find((s) => !isModuleDone(session, s.id)) ?? all[0];
    actions.dispatch({ type: "START_MODULE", sessionId, moduleId: next.id });
  }

  function sendAdjust(text) {
    const value = text.trim();
    if (value.length < 2 || planEdit.status === "loading") return;
    actions.adjustPlan(sessionId, value);
    setInstruction("");
  }

  function rebuild() {
    if (started && !window.confirm("Rebuild the whole road map? Your progress on this map will no longer match.")) return;
    actions.buildPlan(sessionId);
  }

  const totalMinutes = all.reduce((sum, s) => sum + (s.minutes || 0), 0);
  const showAddBasics = plan.data && input.level !== "beginner" && !hasBasics(session);
  const offerSkipCheck = showAddBasics && input.level === "intermediate" && !session.skipCheckResult;
  const droppedStops = plan.warnings?.filter((w) => w.code === "MODULE_DROPPED").length ?? 0;

  return (
    <div className="calm-bg page">
      <AppBar session={session} actions={actions} theme={theme} toggleTheme={toggleTheme} />

      <main className="roadmap">
        <div className="rm-head">
          <button className="icon-btn icon-back" onClick={() => actions.dispatch({ type: "NEW_LEARNING" })} aria-label="Back to start">
            <Icon name="chevronLeft" />
          </button>
          <div className="rm-title">
            <h1>
              Road <em>Map</em>
            </h1>
            <span className="muted">
              {plan.data?.title || input.topic || "Your notes"} · {LEVEL_LABELS[input.level]} · {GOAL_LABELS[input.goal]}
              {totalMinutes ? ` · about ${totalMinutes} min` : ""}
            </span>
          </div>
          {plan.status === "ready" && (
            <div className="rm-actions">
              <button className="btn btn-ghost" onClick={rebuild}>
                <Icon name="redo" size={16} /> Rebuild
              </button>
              <button className="btn btn-primary btn-lg" onClick={start} disabled={all.length === 0}>
                {started ? "Continue" : "Let's start"} <Icon name="arrowRight" />
              </button>
            </div>
          )}
        </div>

        <div className="rm-notices">
          {plan.status === "loading" && (
            <LoadingNotice label="Building your road map..." onRetry={() => actions.buildPlan(sessionId)} onCancel={() => actions.cancel(sessionId, "plan")} />
          )}
          {plan.status === "error" && (
            <StatusBanner
              kind="error"
              title="Couldn't build your road map"
              actions={[
                ...(plan.error?.retryable !== false ? [{ label: "Try again", onClick: () => actions.buildPlan(sessionId), primary: true }] : []),
                { label: "Change topic", onClick: () => actions.dispatch({ type: "NEW_LEARNING" }) },
              ]}
            >
              {plan.error?.message}
            </StatusBanner>
          )}
          {droppedStops > 0 && (
            <StatusBanner kind="partial" title={`${droppedStops} stop${droppedStops > 1 ? "s" : ""} didn't pass our checks`}>
              We left {droppedStops > 1 ? "them" : "it"} out. Use Adjust plan to add more.
            </StatusBanner>
          )}
          {planEdit.status === "error" && (
            <StatusBanner kind="error" title="Couldn't change the road map" actions={[{ label: "Dismiss", onClick: () => actions.dispatch({ type: "SLOT_RESET", sessionId, slot: "planEdit" }) }]}>
              {planEdit.error?.message} Your current map is unchanged.
            </StatusBanner>
          )}
          {offerSkipCheck && (
            <StatusBanner
              kind="info"
              title="Already know the basics?"
              actions={[
                { label: "Take the 3 question check", onClick: () => setShowSkipCheck(true), primary: true },
                { label: "Add basics back", onClick: () => actions.adjustPlan(sessionId, "Add one basics stop at the start.", { addBasics: true }) },
              ]}
            >
              We skipped the basics for you. A quick check makes sure that's right.
            </StatusBanner>
          )}
          {showAddBasics && !offerSkipCheck && (
            <StatusBanner kind="info" title="Basics skipped" actions={[{ label: "Add basics back", onClick: () => actions.adjustPlan(sessionId, "Add one basics stop at the start.", { addBasics: true }) }]}>
              {session.skipCheckResult === "skipped" ? "You passed the basics check." : `At the ${LEVEL_LABELS[input.level]} level we start with the deep dive.`}
            </StatusBanner>
          )}
        </div>

        {plan.status === "loading" || (plan.status === "idle" && !plan.data) ? (
          <SkeletonRoad count={profile.modules + 1} />
        ) : plan.data && plan.data.modules.length === 0 ? (
          <div className="empty panel">
            <h2>This road map is empty</h2>
            <p className="muted">Rebuild it, or describe what you want below.</p>
          </div>
        ) : plan.data ? (
          <Road session={session} all={all} selected={selected} setSelected={setSelected} actions={actions} busy={planEdit.status === "loading"} />
        ) : null}

        {plan.data && (
          <form
            className="adjust glass"
            onSubmit={(e) => {
              e.preventDefault();
              sendAdjust(instruction);
            }}
          >
            <Icon name="sparkle" size={20} className="adjust-icon" />
            <label htmlFor="adjust" className="adjust-label">
              Adjust plan
            </label>
            <input
              id="adjust"
              value={instruction}
              maxLength={300}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Add a stop on QUIC, merge the last two..."
              disabled={planEdit.status === "loading"}
            />
            <div className="adjust-chips">
              {QUICK_EDITS.map((q) => (
                <button type="button" key={q} className="chip" onClick={() => sendAdjust(q)} disabled={planEdit.status === "loading"}>
                  {q}
                </button>
              ))}
            </div>
            {planEdit.status === "loading" ? (
              <span className="spinner adjust-spinner" role="status" aria-label="Updating your road map" />
            ) : (
              <button type="submit" className="icon-btn adjust-send" aria-label="Send adjustment" disabled={instruction.trim().length < 2}>
                <Icon name="arrowRight" />
              </button>
            )}
          </form>
        )}
      </main>

      {showSkipCheck && <SkipCheck session={session} actions={actions} onClose={() => setShowSkipCheck(false)} />}
    </div>
  );
}

// Each stop's color: its card tint. The final test is always aqua.
const stopTint = (stop, index) => (stop.id === FINAL_ID ? "aqua" : tintFor(index));

// Tracks whether the road can scroll left or right, so arrow buttons show only when needed.
function useScrollEdges(ref, deps) {
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () =>
      setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return edges;
}

function Road({ session, all, selected, setSelected, actions, busy }) {
  const sessionId = session.id;
  const modules = session.plan.data.modules;
  const scrollRef = useRef(null);
  const edges = useScrollEdges(scrollRef, [all.length]);
  const scroll = (direction) => scrollRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" });

  // The road line runs through every stop's color, so each segment matches the card under it.
  const lineColors = all.map((stop, i) => {
    const at = all.length > 1 ? (i / (all.length - 1)) * 100 : 0;
    return `var(--tint-${stopTint(stop, i)}-deco) ${at.toFixed(1)}%`;
  });

  // Consecutive stops with the same phase share one bracket above the road.
  const groups = [];
  all.forEach((stop, i) => {
    const last = groups[groups.length - 1];
    if (last && last.phase === stop.phase) last.span++;
    else groups.push({ phase: stop.phase, start: i + 1, span: 1 });
  });

  return (
    <div className="road-wrap">
      {edges.left && (
        <button className="road-arrow road-arrow-left" onClick={() => scroll(-1)} aria-label="Scroll the road left">
          <Icon name="chevronLeft" />
        </button>
      )}
      {edges.right && (
        <button className="road-arrow road-arrow-right" onClick={() => scroll(1)} aria-label="Scroll the road right">
          <Icon name="chevronRight" />
        </button>
      )}
    <div ref={scrollRef} className={`road-scroll ${busy ? "is-busy" : ""} ${edges.left ? "fade-left" : ""} ${edges.right ? "fade-right" : ""}`} aria-busy={busy}>
      <div className="road" style={{ "--stops": all.length }}>
        <div className="road-brackets">
          {groups.map((g) => (
            <div key={`${g.phase}-${g.start}`} className={`bracket bracket-${g.phase}`} style={{ gridColumn: `${g.start} / span ${g.span}` }}>
              <span>{PHASE_LABEL[g.phase]}</span>
            </div>
          ))}
        </div>
        <div className="road-line" style={{ background: `linear-gradient(90deg, ${lineColors.join(", ")})` }} aria-hidden="true" />
        <ol className="road-stops">
          {all.map((stop, i) => (
            <Station
              key={stop.id}
              stop={stop}
              index={i}
              isFirst={i === 0}
              isLastModule={i === modules.length - 1}
              moduleIndex={i}
              session={session}
              selected={selected === stop.id}
              onSelect={() => setSelected(selected === stop.id ? null : stop.id)}
              actions={actions}
              sessionId={sessionId}
              busy={busy}
            />
          ))}
        </ol>
      </div>
    </div>
    </div>
  );
}

function Station({ stop, index, isFirst, isLastModule, session, selected, onSelect, actions, sessionId, busy }) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(stop.title);
  const [addingSub, setAddingSub] = useState(false);
  const [subText, setSubText] = useState("");
  const [inserting, setInserting] = useState(false);
  const [insertText, setInsertText] = useState("");

  const isFinal = stop.id === FINAL_ID;
  const done = isModuleDone(session, stop.id);
  const ready = session.modules[stop.id]?.status === "ready";
  const tint = stopTint(stop, index);
  const dispatch = (action) => actions.dispatch({ sessionId, ...action });

  function saveRename() {
    if (title.trim().length >= 2 && title.trim() !== stop.title) dispatch({ type: "PLAN_RENAME", id: stop.id, title: title.trim() });
    setRenaming(false);
  }

  return (
    <li className={`station ${selected ? "is-selected" : ""}`}>
      {!isFirst && (
        <div className="insert">
          <button className="insert-btn" onClick={() => setInserting((v) => !v)} aria-label={`Insert a stop before ${stop.title}`} disabled={busy}>
            <Icon name="plus" size={13} stroke={3} />
          </button>
          {inserting && (
            <form
              className="insert-pop panel"
              onSubmit={(e) => {
                e.preventDefault();
                if (insertText.trim().length < 2) return;
                dispatch({ type: "PLAN_INSERT", index, title: insertText.trim() });
                setInsertText("");
                setInserting(false);
              }}
            >
              <label htmlFor={`ins-${stop.id}`} className="eyebrow">
                New stop
              </label>
              <input id={`ins-${stop.id}`} autoFocus value={insertText} onChange={(e) => setInsertText(e.target.value)} maxLength={90} placeholder="Title of the stop" onKeyDown={(e) => e.key === "Escape" && setInserting(false)} />
              <button className="btn btn-sm btn-primary">Add</button>
            </form>
          )}
        </div>
      )}

      {selected && !isFinal && (
        <div className="toolbar glass" role="toolbar" aria-label={`Edit ${stop.title}`}>
          <button className="icon-btn icon-btn-sm" onClick={() => dispatch({ type: "PLAN_MOVE", id: stop.id, delta: -1 })} disabled={isFirst || busy} aria-label="Move earlier">
            <Icon name="chevronLeft" size={16} />
          </button>
          <button className="icon-btn icon-btn-sm" onClick={() => setRenaming(true)} aria-label="Rename" disabled={busy}>
            <Icon name="pencil" size={16} />
          </button>
          <button
            className="icon-btn icon-btn-sm danger"
            onClick={() => window.confirm(`Delete "${stop.title}"?`) && dispatch({ type: "PLAN_DELETE", id: stop.id })}
            aria-label="Delete stop"
            disabled={busy || session.plan.data.modules.length <= 1}
          >
            <Icon name="trash" size={16} />
          </button>
          <button className="icon-btn icon-btn-sm" onClick={() => dispatch({ type: "PLAN_MOVE", id: stop.id, delta: 1 })} disabled={isLastModule || busy} aria-label="Move later">
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      )}

      <button
        className={`dot dot-${stop.phase} has-tint tint-${tint} ${done ? "dot-done" : ""}`}
        onClick={isFinal ? undefined : onSelect}
        aria-pressed={isFinal ? undefined : selected}
        aria-label={isFinal ? "Final test" : `Stop ${index + 1}: ${stop.title}. ${selected ? "Hide" : "Show"} edit tools`}
        disabled={isFinal}
      >
        {done ? <Icon name="check" size={18} stroke={3} /> : isFinal ? <Icon name="flag" size={18} /> : index + 1}
      </button>

      <article className={`stop-card tint-${tint}`}>
        <CardDeco />
        <div className="stop-top">
          <span className="pill pill-white">{isFinal ? "Final" : `Stop ${index + 1}`}</span>
          <span className="stop-meta">
            {done ? (
              <span className="stop-done">
                <Icon name="check" size={13} stroke={3} /> Done
              </span>
            ) : ready ? (
              "Cards ready"
            ) : (
              `${stop.minutes} min`
            )}
          </span>
        </div>

        {renaming ? (
          <input
            className="rename"
            autoFocus
            value={title}
            maxLength={90}
            aria-label="Stop title"
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveRename();
              if (e.key === "Escape") {
                setTitle(stop.title);
                setRenaming(false);
              }
            }}
          />
        ) : (
          <h3 className="stop-title">{stop.title}</h3>
        )}
        {stop.summary && <p className="stop-summary">{stop.summary}</p>}

        {isFinal ? (
          <p className="stop-summary">
            {session.profile.finalTest} mixed questions from every stop. Added by BePro, not the model.
          </p>
        ) : (
          <>
            <ul className="subs">
              {stop.subtopics.map((sub, i) => (
                <li key={`${sub}-${i}`} className="sub">
                  {sub}
                  <button onClick={() => dispatch({ type: "SUBTOPIC_REMOVE", id: stop.id, index: i })} aria-label={`Remove subtopic ${sub}`} disabled={busy}>
                    <Icon name="close" size={11} stroke={3} />
                  </button>
                </li>
              ))}
            </ul>
            {addingSub ? (
              <form
                className="sub-add"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (subText.trim()) dispatch({ type: "SUBTOPIC_ADD", id: stop.id, text: subText.trim() });
                  setSubText("");
                  setAddingSub(false);
                }}
              >
                <input autoFocus value={subText} maxLength={60} onChange={(e) => setSubText(e.target.value)} aria-label="New subtopic" placeholder="Subtopic" onKeyDown={(e) => e.key === "Escape" && setAddingSub(false)} onBlur={() => !subText && setAddingSub(false)} />
              </form>
            ) : (
              <button className="add-sub" onClick={() => setAddingSub(true)} disabled={busy || stop.subtopics.length >= 8}>
                <Icon name="plus" size={13} stroke={2.6} /> Add subtopic
              </button>
            )}
          </>
        )}
      </article>
    </li>
  );
}

function SkeletonRoad({ count }) {
  return (
    <div className="road-scroll" aria-label="Loading road map">
      <div className="road" style={{ "--stops": count }}>
        <div className="road-brackets" />
        <div className="road-line road-line-ghost" aria-hidden="true" />
        <ol className="road-stops">
          {Array.from({ length: count }, (_, i) => (
            <li key={i} className="station">
              <Skeleton width={48} height={48} radius={24} className="dot-skeleton" />
              <div className="stop-card stop-card-skeleton">
                <Skeleton width="40%" height={22} radius={999} />
                <Skeleton width="85%" height={18} />
                <Skeleton width="60%" height={14} />
                <div className="row">
                  <Skeleton width={70} height={28} radius={999} />
                  <Skeleton width={90} height={28} radius={999} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
