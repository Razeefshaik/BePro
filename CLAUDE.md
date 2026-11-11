# BePro (Highlight: AI study assistant)

Flam frontend internship assignment. Topic or notes in, a road map of flashcard-first modules and quizzes out, built from validated LLM JSON. Deadline: 2026-11-16 (IST). We have 4 days; build the full spec well rather than racing a clock.

Before any design or build work, read `SPEC.md` fully, then `docs/DECISIONS.md`.
Also follow `AGENTS.md`. `SPEC.md` is the single source of truth for the design. `docs/PLAN.md` holds the plan, `docs/TASKS.md` the cards.

Project rules:
- React with hooks and functional components, plain JavaScript (no TypeScript), plain CSS with the tokens in SPEC section 10.
- Only the approved dependencies in SPEC section 3. Ask before adding anything else.
- The API key never reaches the browser. Every model call goes through `server/`.
- No crashes on bad model output. Every request has loading, error and empty states. A stale response never overwrites a newer one.
- Code must be simple enough for the owner to explain line by line in the interview. Prefer plain, boring code over clever code.
- `npm install && npm start` must work from a fresh clone at every merge.
- Small, meaningful commits.
