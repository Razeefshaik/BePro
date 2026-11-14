# BePro agent state

Updated: 2026-11-14. Rewrite this file rather than appending to it. It doesn't replace AGENTS.md or the source documents. No secret values.

## Project
Highlight / BePro: an AI study assistant for the Flam frontend internship assignment. Design in `SPEC.md`, decisions in `docs/DECISIONS.md`, cards in `docs/TASKS.md`.

## Now
- **Branch:** `razeef/c01-build` holds C01 to C27. `main` is at C18 (fast-forwarded on owner request). Remote `origin` is set; nothing pushed yet.
- **Built:** every screen in SPEC 10, both themes, all screen sizes, all four endpoints, validation pipeline, stale guard, persistence, chaos mode. Owner-driven UI rounds C12 to C17; C18 unified the look (`hero-surface`), split `learn.css` by component, added README screenshots and the video script. `npm test` passes 24 tests; `npm run build` passes.
- **Verified:** every screen in Meadow and Night, 390px to 2560px; a full session against a real `codex` model through the UI and by curl (topic mode and notes mode); earlier, 20 requests under `LLM_CHAOS=1`.
- **Blockers:** none.

## Next
1. Owner: merge `razeef/c01-build` into `main`, create the GitHub repo, push.
2. Owner: fill the two placeholders in `README.md` (AI usage detail, time spent).
3. Get a free Groq key, set `LLM_PROVIDER=openai` in `.env`, run one full session, so the graders' path is tested with a real fetch provider (the `codex` path is tested; the `openai` fetch path has only been run against tests and mock).
4. Record the screen recording following `docs/submission/VIDEO-SCRIPT.md` (use `LLM_CHAOS=0.5` for the failure part).
5. Optional: deploy.
