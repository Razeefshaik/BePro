# BePro: task board

**How to use this board:**
- Each card says who owns it, which files it covers, and its status.
- Ownership is in `AGENTS.md`, and interfaces are in `docs/CONTRACTS.md`.
- "Needs the owner" marks a step an agent cannot do, such as getting an API key or recording a video.

**Cut order if time runs short:** see HANDOFF.

---

**C01: repo skeleton**
- **Owner:** razeef with Claude.
- **Goal:** one package; Vite and React client, Express on 8787, `/api` proxy, `concurrently`; `npm start` and `npm test` work from a fresh clone.
- **Files:** `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `server/index.js`.
- **Status:** done on `razeef/c01-build`

**C02: shared schemas and profile**
- **Owner:** razeef with Claude.
- **Goal:** zod schemas and `compileProfile()` as in SPEC 5 and 6.
- **Files:** `shared/schemas.js`, `shared/profile.js`.
- **Status:** done on `razeef/c01-build`

**C03: validation pipeline and tests**
- **Owner:** razeef with Claude.
- **Goal:** SPEC 7 steps 1 to 9, with all ten fixtures passing under `node:test`.
- **Files:** `server/llm/pipeline.js`, `server/test/pipeline.test.js`.
- **Status:** done on `razeef/c01-build`

**C04: provider, prompts, routes**
- **Owner:** razeef with Claude. **Needs the owner:** an LLM API key in `.env`.
- **Goal:** real model calls for all four endpoints, with input checks, 25 second timeout and the envelope.
- **Files:** `server/llm/provider.js`, `server/llm/prompts.js`, `server/routes/*.js`, `server/index.js`.
- **Status:** done on `razeef/c01-build`

**C05: client data layer**
- **Owner:** razeef with Claude.
- **Goal:** fetch wrapper (40 second timeout, abort, requestId), session reducer with the stale guard, persistence.
- **Files:** `src/api/client.js`, `src/state/sessionReducer.js`, `src/state/persistence.js`.
- **Status:** done on `razeef/c01-build`

**C06: theme and start screen**
- **Owner:** razeef with Claude. **Needs the owner:** the UI and theme choice.
- **Goal:** tokens, Ink and Paper toggle, start screen with the saved learnings sidebar and inline input validation.
- **Files:** `src/styles/*`, `src/screens/StartScreen.jsx`.
- **Status:** done on `razeef/c01-build`

**C07: road map screen**
- **Owner:** razeef with Claude.
- **Goal:** stations, subtopic chips, edit toolbar, Adjust plan, Add basics back, skeleton and empty states.
- **Files:** `src/screens/RoadmapScreen.jsx` and its components.
- **Status:** done on `razeef/c01-build`

**C08: learn screen, quiz, results**
- **Owner:** razeef with Claude.
- **Goal:** flashcards with visuals, quiz with shuffled options, retest pile, results, per-module error and partial banners.
- **Files:** `src/screens/LearnScreen.jsx`, `src/screens/ResultsScreen.jsx`, `src/components/*`.
- **Status:** done on `razeef/c01-build`

**C09: read further, doubt bot, sources, motivation**
- **Owner:** to be decided.
- **Goal:** the extras in SPEC 10, built in reverse cut order.
- **Files:** `src/components/DoubtBot.jsx`, `src/data/quotes.json`, read more and sources components.
- **Status:** done on `razeef/c01-build`

**C10: mobile, keyboard, polish**
- **Owner:** razeef with Claude.
- **Goal:** Index drawer under 760px, keyboard shortcuts, visible focus, no blank screen anywhere.
- **Files:** `src/styles/app.css`, screens as needed.
- **Status:** done on `razeef/c01-build`

**C11: README and submission**
- **Owner:** razeef. **Needs the owner:** the screen recording and repo link.
- **Goal:** README with setup, usage, AI usage note, known limitations and time spent.
- **Files:** `README.md`, `docs/submission/*`.
- **Status:** README written; owner fills AI usage detail and time spent, records video, pushes
