# BePro agent state

Updated: 2026-11-14. Rewrite this file rather than appending to it. It doesn't replace AGENTS.md or the source documents. No secret values.

## Project
Highlight / BePro: an AI study assistant for the Flam frontend internship assignment. Design in `SPEC.md`, decisions in `docs/DECISIONS.md`, cards in `docs/TASKS.md`.

## Now
- **Branch:** `razeef/c01-build` holds C01 to C11 (one commit or two per card). `main` has only C00. Not pushed; no remote yet.
- **Built:** every screen in SPEC 10, both themes, phone layout, all four endpoints, validation pipeline, stale guard, persistence, chaos mode. `npm test` passes 24 tests; `npm run build` passes.
- **Verified by hand:** clicked through every screen in Meadow and Night and at 390px width (headless Chrome screenshots); all endpoints against `mock` and a real `codex` model; 20 requests under `LLM_CHAOS=1` (all answered with a proper envelope, retries visible in the server log).
- **Blockers:** none.

## Next
1. Owner: merge `razeef/c01-build` into `main`, create the GitHub repo, push.
2. Owner: fill the two placeholders in `README.md` (AI usage detail, time spent).
3. Get a free Groq key, set `LLM_PROVIDER=openai` in `.env`, run one full session, so the graders' path is tested with a real fetch provider.
4. Record the screen recording following HANDOFF "story to demo" (use `LLM_CHAOS=0.5` for the failure part).
5. Optional: deploy.
