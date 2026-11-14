# Highlight: AI study assistant (project spec)

This is the single source of truth for the project. Read it fully before any work.
Design canvas (all screens, Ink and Paper themes): https://claude.ai/artifact/QDDTYCNwXiQwmZAdmnGbzA
The original assignment brief is in `docs/assignment.pdf`.

---

## 1. Assignment constraints (from the brief, non negotiable)

* React with hooks and functional components. TypeScript is optional and not graded (we use JavaScript).
* A free form text input. A real LLM API. The model returns **structured JSON** that our code parses and renders as **interactive, stateful UI**. It must **not** be a chatbot as the core experience.
* Handle bad model output: malformed JSON, wrong shape, empty, slow, failed. **No crashes.** Show an error or a retry. **A stale response must never overwrite a newer one.**
* Loading, error and empty states. Works on mobile.
* The API key never ships to the browser. Every model call goes through our small backend.
* `npm install && npm start` must work from a fresh clone.
* README with setup, usage, AI usage note, known limitations, time spent.
* Small, meaningful commits. Time budget: 8 hours of actual work.
* Grading: React and frontend architecture 25%, AI integration and data handling 25%, handling bad AI output 20%, UI/UX and product sense 15%, communication and understanding 15%. "A clean, solid core beats a pile of half working features."
* In the interview the user must explain decisions, fix a planted bug and add a feature live. **Code must be simple enough to explain line by line.**

---

## 2. Product in one paragraph

The user says what they want to learn, their level (Beginner, Intermediate, Pro) and their goal (Master, Mid level, Crash course). The app builds an editable **road map** of modules. Each module is learned **flashcard first**: a card shows a question and a visual (flowchart, chart, diagram, animation, image), flips to a short answer, and offers **Read further** for a fuller explanation. Then a short quiz. Wrong answers and cards marked "Review again" go to a **retest pile**. How much the app teaches depends on the user's level and goal: **our code decides the structure, the model only fills in content.**

---

## 3. Stack and repo layout

* **One package** at the repo root, so `npm install && npm start` just works.
* Client: Vite + React (JavaScript). Plain CSS with CSS variables (tokens in section 10). No CSS framework.
* Server: Node + Express in `server/`, port 8787. Vite dev server proxies `/api` to it.
* Validation: `zod`, with schemas in `shared/` used by **both** server and client.
* LLM: one adapter for any **OpenAI compatible** chat completions endpoint (Groq, OpenRouter, Ollama and others), configured by env vars. Uses plain `fetch`, no provider SDK, so every line is explainable.
* Development mode: `LLM_PROVIDER=codex` makes the same adapter run the local Codex CLI (`codex exec`, read-only sandbox, prompt on stdin) instead of `fetch`. Same `complete({ system, user, signal })` contract, so nothing above the adapter changes. See DECISIONS 2026-11-12.
* `npm start` runs both processes with `concurrently`.
* Tests: Node's built in `node:test` for the validation pipeline (no extra test framework).

Approved dependencies: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `express`, `dotenv`, `zod`, `concurrently`. Ask before adding anything else.

```
/
  package.json            scripts: start, dev, test
  vite.config.js          proxy /api to http://localhost:8787
  .env.example            LLM_BASE_URL, LLM_API_KEY, LLM_MODEL, PORT
  SPEC.md  CLAUDE.md  README.md
  docs/assignment.pdf
  shared/
    schemas.js            zod schemas for plan, module content, read more, doubt
    profile.js            level and goal profiles, compileProfile()
  server/
    index.js              express app, routes, error handler
    llm/provider.js       complete({ system, user, signal }) using fetch
    llm/prompts.js        prompt builders for each endpoint
    llm/pipeline.js       extract, parse, validate, retry (section 7)
    routes/plan.js  routes/module.js  routes/readmore.js  routes/doubt.js
    test/pipeline.test.js fixtures of bad model output
  src/
    main.jsx  App.jsx
    api/client.js         fetch wrapper: timeout, AbortController, requestId
    state/sessionReducer.js
    state/persistence.js  localStorage load and save
    data/quotes.json      30 original motivation and humor lines
    screens/StartScreen.jsx  RoadmapScreen.jsx  LearnScreen.jsx  ResultsScreen.jsx
    components/           Flashcard, visuals/*, QuizQuestion, DoubtBot, IndexNav, SessionCard, LiveBoard, RoadPeek, StatusBanner...
    styles/               tokens.css (both themes), base.css, then one file per screen or component
```

---

## 4. API endpoints

Every response has the same envelope:

```json
{ "ok": true,  "data": { }, "warnings": [ { "code": "VISUAL_DROPPED", "message": "..." } ] }
{ "ok": false, "error": { "code": "INVALID_OUTPUT", "message": "plain words for the user", "retryable": true } }
```

Error codes: `BAD_INPUT` (400), `TIMEOUT`, `PROVIDER_ERROR`, `RATE_LIMITED`, `EMPTY_OUTPUT`, `INVALID_OUTPUT`.

| Endpoint | Request | Returns |
|---|---|---|
| `POST /api/plan` | `{ topic, notes?, level, goal }` or `{ existingPlan, instruction, level, goal }` for "Adjust plan" | `Plan` |
| `POST /api/module` | `{ planTitle, module, level, goal, notes? }`, or `{ kind: "final", planTitle, modules, level, goal }` for the final test | `ModuleContent` |
| `POST /api/readmore` | `{ card, planTitle, level, notes? }` | `ReadMore` |
| `POST /api/doubt` | `{ question, context, history }` (context = the current card or quiz question JSON, history = last 6 messages max) | `{ answer }` (plain text, rendered as text, never as HTML) |

Input checks on the server: topic 3 to 200 characters unless notes are given; notes up to 12,000 characters; level and goal must be one of the allowed values. Fail fast with `BAD_INPUT`.

---

## 5. Learning profile: the code decides how much to teach

`shared/profile.js` compiles the two start screen choices into one profile object. The profile is sent to the prompt as **hard constraints** and the validator checks the response against it.

```js
export const LEVEL = {
  beginner:     { basics: "include", answerLength: "2 to 3 sentences", readMore: "suggested",
                  focus: "definitions, intuition, everyday analogies", quiz: "recall and simple application" },
  intermediate: { basics: "skip",    answerLength: "1 to 2 sentences", readMore: "on request",
                  focus: "mechanisms and why they work", quiz: "medium, apply the concept" },
  pro:          { basics: "skip",    answerLength: "1 sentence",       readMore: "on request",
                  focus: "edge cases, tradeoffs, comparisons", quiz: "hard, scenario based" },
};

export const GOAL = {
  crash:  { modules: 3, cardsPerModule: 4, quizPerModule: 2, finalTest: 6 },
  mid:    { modules: 5, cardsPerModule: 5, quizPerModule: 3, finalTest: 10 },
  master: { modules: 7, cardsPerModule: 6, quizPerModule: 4, finalTest: 15 },
};

export function compileProfile(level, goal) { return { level, goal, ...LEVEL[level], ...GOAL[goal] }; }
```

UI label mapping: Beginner, Intermediate, Pro map to `beginner`, `intermediate`, `pro`. Master, Mid level, Crash course map to `master`, `mid`, `crash`.

Rules:
* Level controls **depth** (how much each card says). Goal controls **breadth** (how many modules and cards). Keep them independent.
* `modules` counts learning modules. The final test is always added by our code as the last stop; the model never generates it in the plan.
* Beginner: the plan must contain 1 basics module (2 for master). Intermediate and Pro: no basics module. The road map shows an **"Add basics back"** button that asks `/api/plan` to insert one.
* Pro cards: one sentence answers, "Read further" stays collapsed.
* Intermediate "skip check": 3 basics questions; 2 or more right means skip basics, otherwise insert it.
* Adapt during the session: If the user marks "Review again" on 2 cards in a row in a module, suggest Read further for that module's remaining cards. A reducer rule, not a model call.

---

## 6. Data schemas (implemented with zod in `shared/schemas.js`)

**Plan**
```json
{
  "title": "TCP congestion control",
  "modules": [
    { "id": "m1", "title": "Slow start", "summary": "How cwnd grows and when it stops.",
      "phase": "basics | deepdive", "minutes": 6, "subtopics": ["cwnd", "Doubling per RTT", "ssthresh"] }
  ]
}
```
Checks: module count equals `profile.modules` plus or minus 1; ids unique; 1 to 5 subtopics each; `phase: "basics"` only if the profile includes basics; minutes 2 to 15.

**ModuleContent**
```json
{
  "moduleId": "m1",
  "cards": [ Card ],
  "quiz":  [ Question ]
}
```

**Card** (flashcard first)
```json
{
  "id": "c1",
  "front": "What happens to cwnd during slow start?",
  "answer": "It doubles every round trip until it reaches ssthresh.",
  "visual": Visual or null,
  "sourceQuote": "only in notes mode: a short verbatim line from the user's notes"
}
```

**Visual** (discriminated union on `kind`; the model sends data, our components draw it)

| kind | fields | checks | rendered by |
|---|---|---|---|
| `flow` | `steps: string[]` | 2 to 6 non empty steps | boxes and arrows in a row |
| `chart` | `chartType: "bar" or "line"`, `labels: string[]`, `values: number[]`, `caption` | same length, 2 to 12 points, all finite numbers | bars or a line drawn with plain elements |
| `diagram` | `nodes: [{id, label}]`, `edges: [{from, to, label?}]` | 2 to 8 nodes, unique ids, every edge points to a real node | a simple layered layout |
| `animation` | `frames: [{ caption, values: number[] }]` | 2 to 8 frames, every frame has the same number of values | Play / Next through frames with CSS transitions |
| `image` | `searchTerm: string` | 2 to 6 words | our code fetches it from the Wikimedia Commons API; no result means no image, not an error |

**Question**
```json
{ "id": "q1", "type": "mcq", "question": "...", "options": ["...", "..."], "answerIndex": 2,
  "explanation": "...", "sourceQuote": "notes mode only" }
{ "id": "q2", "type": "truefalse", "statement": "...", "answer": true, "explanation": "..." }
```

**ReadMore**
```json
{ "paragraphs": ["...", "..."], "example": "optional", "commonMistake": "optional" }
```
1 to 4 paragraphs, each under 120 words.

---

## 7. Validation pipeline (`server/llm/pipeline.js`), the most important code in the repo

Run every model response through these steps, in order:

1. **Empty check.** Blank output means `EMPTY_OUTPUT` (retryable).
2. **Extract.** Strip markdown code fences. Slice from the first `{` to the last `}`. Models often wrap JSON in prose or fences.
3. **Parse.** `JSON.parse`. On failure, **retry once**, appending to the prompt: the parse error message and "Return only valid JSON."
4. **Container shape.** Validate the outer object (for example: has a `cards` array and a `quiz` array). If wrong, retry once with the zod error summary appended.
5. **Validate items individually.** Use `safeParse` on each card and question. **Drop invalid items one by one** instead of failing the whole response. Record each drop as a warning.
6. **Semantic checks.**
   * `answerIndex` is within the options.
   * Options are unique after normalizing (trim, lowercase).
   * No duplicate card fronts or questions.
   * The visual passes the checks for its kind.
   * Notes mode: `sourceQuote` must appear in the notes after normalizing whitespace and case. If not, keep the item but mark it `ungrounded: true` so the UI shows "Not found in your notes".
7. **Visual fallback.** An invalid visual becomes `visual: null`. The card stays. Add a `VISUAL_DROPPED` warning.
8. **Thresholds.** Valid cards must be at least 60% of `cardsPerModule`, and valid questions at least `max(2, 60% of quizPerModule)`. Otherwise retry once. After the retry still fails, return `INVALID_OUTPUT`.
9. Return `{ ok: true, data, warnings }`.

Limits: each provider call times out after 25 seconds (AbortController). At most 2 attempts per request in total.

The client **also** runs `safeParse` on every response (never trust the network) and **shuffles quiz options**, remapping `answerIndex`, because models favor putting the right answer early.

`server/test/pipeline.test.js` covers these fixtures:
* JSON inside markdown fences
* JSON with prose before and after
* a truncated JSON object
* an empty string
* the wrong top level shape
* an `answerIndex` out of range
* duplicate options
* a chart with mismatched arrays
* a diagram edge pointing to a missing node
* a notes mode quote that is not in the notes

---

## 8. Prompt rules (`server/llm/prompts.js`)

Every prompt:
* States: "Return only one JSON object. No markdown, no code fences, no commentary."
* Includes a compact schema description and one tiny example.
* Includes the compiled profile as explicit constraints, for example: "Exactly 5 cards. Answers must be 1 to 2 sentences. Focus: mechanisms and why they work."
* Tells the model about visuals: "Add a visual only where it genuinely helps understanding; otherwise use null. Never output SVG, HTML, code, or URLs."
* In notes mode: "Use only facts from the notes. Each card and question must include a sourceQuote copied word for word from the notes."
* Wraps user text in clear delimiters and says it is data, not instructions (basic prompt injection hygiene).

---

## 9. Client state (`src/state/sessionReducer.js`)

```js
session = {
  id, createdAt,
  input:   { topic, notes, level, goal },
  profile,                                   // from compileProfile
  plan:    { status, data, error, requestId },        // status: idle | loading | ready | error
  modules: { [moduleId]: { status, data, warnings, error, requestId } },  // + partial
  readMore:{ [cardId]: { status, data, error, requestId } },
  progress:{ ratings: { [cardId]: "got" | "review" },
             answers: { [questionId]: { chosen, correct } } },
  currentModuleId,
  view: "cards" | "quiz",
}
```

Rules:
* **Stale guard.** Every request gets `requestId = crypto.randomUUID()`. A `*_REQUEST` action stores it in its slot. A `*_SUCCESS` or `*_FAILURE` whose `requestId` doesn't match the slot's current one is ignored. The client also aborts the previous AbortController for the same slot.
* **Retest pile is derived, not stored**: wrong answers plus cards rated "review".
* **Prefetch** the next module's content once the current one is ready.
* Changing the plan keeps progress for modules whose `id` is unchanged.
* **Persistence:** save sessions to localStorage under `highlight.sessions.v1` (debounced 500ms). Load them on start. Wrap every read and write in try/catch. Corrupted data is ignored and cleared, never crashes the app. Include a schema version field.
* Client timeout: 40 seconds per request. After 20 seconds with no response, show "Taking longer than usual" with Try again and Cancel.

---

## 10. UI specification

**Theme: "Meadow Glass"** (replaced the original Ink/Paper tokens, see DECISIONS 2026-11-12). Design canvas: https://claude.ai/artifact/NPGo2q3f3m9YUsPAip1Mfi
* Tokens live in `src/styles/tokens.css`. The root element gets class `t-meadow` (default, light) or `t-night` (dark). The toggle is saved in localStorage.
* Only the start screen gets the full gradient background (`public/bg/intro-*.svg`) and the big wordmark. Working screens (road map, learn, results) use a calm, flat background with two faint corner washes, so content stays readable.
* Flashcards, road map stops and true/false cards each get a pastel tint from the palette (lavender, aqua, meadow, butter, blush, peach), cycling per item, and a background shape from a set of eight (star, flower, rings, sparkles, waves, blob, dots, arches), so neighbouring cards never look the same.
* Results use the same layout in both themes.

Fonts (Google Fonts): Outfit (everything), VT323 (the live board's LED text only).

Color meaning, same roles in both themes: **focus now = lavender (Meadow) / highlighter lime (Night), got it = green / mint, review this = blush pink / ember.** Never rely on color alone; always pair it with text or an icon.

**Start screen.**
* Left sidebar: saved learnings with a progress bar and a "what's next" line, plus a "New learning" button.
* Main area: an "I am" box (Beginner, Intermediate, Pro), an "I want to" box (Master, Mid level, Crash course), then the input "Type what you want to learn.." with a + button that opens a notes paste area.
* Primary button: "Build my road map". Example chips below.

**Navigation.** The top bar on the working screens has the logo (home: all learnings), the session title, screen buttons and the theme toggle. New learnings start only from the home sidebar. On Learn and Results, **Road map** opens the road map as a card on top of the page (every stop with its status; pick one to jump there; "Edit road map" opens the full road map page). Results has a **Back to learning** button.

**Road map screen.**
* Title "Road Map" and a "Let's start" button.
* A horizontal road with one station per module, grouped under phase brackets. Cards under each station show subtopic chips (removable) and "Add subtopic".
* Selecting a station shows a toolbar: move earlier, rename, delete, move later. A + on the road between stations inserts a stop.
* "Adjust plan" input with quick chips at the bottom; it calls `/api/plan` with `existingPlan` and `instruction`.
* "Add basics back" appears when basics were skipped.
* On a phone, the road scrolls horizontally.

**Learning page.**
* Layout: the **Index** (each stop a small card: number tile in the stop's road map color, title, "status • minutes") is a sidebar attached to the left edge (full height under the top bar; a drawer below 900px). Next to it, the content column: the top band, the stop name with the Cards / Quiz tabs, and the card or quiz.
* Top band, three cards: a **session hero card** (gradient card with a glass panel: the share of the road map done as a big number with a ring, then accuracy with its level in a word, cards known and minutes studying against a 15 minute goal, each with a small bar; a round Retest button with the pile count in its header), the **doubt bot** card (input and suggestion chips; answers drop down under it), and the live board. Nothing in the band repeats the Index. On narrow screens the doubt bot moves under the card.
* **Live board**, styled like a station departures display: a LIVE light, the stop, the message label and a clock; a main line that rotates by itself every 7 seconds through motivation lines (`src/data/quotes.json`) and study tips (`src/data/tips.json`), replaced by an adaptive "Attention" hint after 2 "Review again" in a row; a thin scrolling ticker with the next stops and the shortcuts.
* Body: the Index (modules grouped by phase, current module expanded with its subtopics) and the content window.
* Content window tabs: **Cards** (default) and **Quiz**.
  * Flashcard: a meter above the deck (one segment per card, colored by rating, click to jump), the next cards peeking out from behind, a big card number, Q and A badges. Front: question plus visual; click the card or press Space to flip. Back: a lighter face that repeats the question small above the answer. **Read further** expands the explanation inside the card (lazy loaded and cached). One control bar: previous, "Review again", Flip, "Got it", next.
  * Quiz: options, then feedback with the explanation, then Next. "Report a wrong question" removes the question and adds it to the warnings.
* **Doubt bot**: a card in the top band (not a floating button). It answers about the current card or question only.
* **Motivation lines:** `src/data/quotes.json`, 30 original lines (motivation, light humor, learning tips) with **no attributions to real people**, shown on the live board.
* **Sources:**
  * Notes mode: the quoted lines from the notes.
  * Topic mode: "Search Wikipedia for X" links that our code builds from module titles. The model never supplies URLs.

**Results screen.**
* A score per station along a mini road.
* The retest pile list.
* Buttons: "Retest the N I missed", "New questions on weak spots", "Save session".

**States** (all required):
* Skeleton stations while the plan arrives.
* "Couldn't build X" with Try again and Skip, scoped to one module.
* A partial banner ("3 of 5 questions passed checks").
* "Not found in your notes" flag.
* Inline validation for too short input.
* Empty plan message.
* Never a blank screen.

**Keyboard:** Space flips a card. 1 and 2 rate a card. 1 to 4 answer a question. Enter goes next. Focus is always visible.

**Mobile, below 760px:** the Index becomes a drawer, the top band compacts, and actions stick to the bottom.

**Every screen size:** content shares one page width (`--page-max`) and side gutter, and the top bar lines up with it. Monitors from 1800px wide scale the whole interface up a step with CSS `zoom` (1.1, 1.3 at 2200px, 1.6 at 2800px); the CSS uses `--vh` / `--vw`, which undo the zoom, instead of raw `vh` / `vw`. On the learning page the deck, the phase band and the live board adapt to their own width (container queries). The Index becomes a drawer below 900px, the band stacks below 860px, the card's control bar always sticks to the bottom, and short screens (820px tall or less) get a smaller card and visuals.
