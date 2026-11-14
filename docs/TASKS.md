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

**C12: start screen rework**
- **Owner:** razeef with Claude.
- **Goal:** learnings sidebar, stacked level and goal lists, wordmark on its own row, smaller build button.
- **Files:** `src/screens/StartScreen.jsx`, `src/styles/start.css`.
- **Status:** done on `razeef/c01-build`

**C13: road map colors and scrolling**
- **Owner:** razeef with Claude.
- **Goal:** no native scrollbar (arrows and faded edges), road colors match the stop cards, long subtopic chips wrap.
- **Files:** `src/screens/RoadmapScreen.jsx`, `src/styles/roadmap.css`.
- **Status:** done on `razeef/c01-build`

**C14: learning page band**
- **Owner:** razeef with Claude.
- **Goal:** stop progress moves into the Index; the notice board becomes a live departures-style board.
- **Files:** `src/components/LiveBoard.jsx`, `src/components/IndexNav.jsx`, `src/screens/LearnScreen.jsx`, `src/styles/learn.css`.
- **Status:** done on `razeef/c01-build`

**C15: navigation and flashcards**
- **Owner:** razeef with Claude.
- **Goal:** road map card instead of leaving the page, Back on results, no + in the top bar, phase tiles in the band, livelier flashcards, varied card shapes.
- **Files:** `src/components/{AppBar,RoadPeek,Stepper,Flashcard,common}.jsx`, `src/screens/{LearnScreen,ResultsScreen}.jsx`, `src/styles/*.css`.
- **Status:** done on `razeef/c01-build`

**C16: screen sizes**
- **Goal:** same look from phone to big monitor (zoom step, container queries, sticky card bar).
- **Status:** done on `razeef/c01-build`

**C17: learning page without repeats**
- **Goal:** session hero card, Index on the left edge as list cards, doubt bot as a band card, Night colors fixed.
- **Status:** done on `razeef/c01-build`

**C18: final pass**
- **Goal:** unify the look across screens, real-model test, code clean-up, README screenshots and video script.
- **Status:** done on `razeef/c01-build`; owner still fills two README placeholders and records the video

**C19: smaller top band**
- **Goal:** shrink the session card, doubt card and live board (padding, avatars, big number, ring, board text). The band is about 190px tall at 1440 wide, down from about 295px.
- **Status:** done on `razeef/c01-build`

**C20: one-screen learning page**
- **Goal:** on desktop (901px wide and 600px tall or more) the band, stop title, meter, card and buttons fit in the window with no page scroll. The card is the main element: the band is slimmer (one-line session numbers, one-row doubt chips), the meter is thinner, the card grows into the space left, visuals on the question side shrink to fit, and long answers scroll inside the card (`.flash-body`) with a soft see-through scrollbar.
- **Status:** done on `razeef/c01-build`

**C21: compact card buttons**
- **Goal:** on desktop the card buttons are a compact bar (up to 660px wide, 44px tall) centred under the wider card, so the card reads as the main element. Phones keep the full-width sticky bar.
- **Status:** done on `razeef/c01-build`
