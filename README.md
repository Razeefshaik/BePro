# BePro

An AI study assistant that is **not a chatbot**. Type a topic (or paste your notes), pick your level and goal, and BePro builds an editable **road map** of stops. Each stop is learned flashcard first: a card with a question and a visual, flip for the answer, rate it, then take a short quiz. Wrong answers and cards you mark "Review again" go to a **retest pile**.

The model only fills in content. **Our code decides the structure** (how many stops, cards and questions, how long answers are) and **checks every reply** before it reaches the screen.

## Setup

Needs Node 18 or newer.

```bash
npm install
cp .env.example .env      # then fill in a model, see below
npm start                 # app on http://localhost:5173, API on :8787
```

Pick a model backend in `.env`:

| `LLM_PROVIDER` | What it needs | Notes |
| --- | --- | --- |
| `openai` (default) | `LLM_BASE_URL`, `LLM_MODEL`, usually `LLM_API_KEY` | Any OpenAI compatible endpoint: Groq (free tier), OpenRouter, Ollama, OpenAI. Groq example is prefilled. |
| `mock` | nothing | Canned replies, no network. Good for clicking through the UI without a key. |
| `codex` | a logged in local Codex CLI | What I used during development. |

`npm test` runs 24 tests: bad model output fixtures and the reducer rules.

To watch the failure handling, set `LLM_CHAOS=0.5` in `.env`. Half of the model replies then get broken on purpose (wrapped in prose, truncated, empty, wrong answer index, or 22 seconds slow).

## Usage

1. **Start:** type a topic, choose *I am* (Beginner, Intermediate, Pro) and *I want to* (Master, Mid level, Crash course). "+ Add your notes" switches to notes mode: cards then quote your notes.
2. **Road map:** stops grouped into phases. Click a stop's number to move, rename or delete it; **+** on the road inserts a stop; subtopic chips can be removed or added. **Adjust plan** sends an instruction ("add a stop on QUIC") and the model edits the existing plan instead of starting over. Intermediate learners get a 3 question basics check.
3. **Learn:** flip cards (Space), rate them (1 = Review again, 2 = Got it), **Read further** opens a longer explanation inside the card. Then the quiz (1 to 4 answers, Enter for next). The notice board shows a motivation line, a study tip and live stats. The round button at the bottom right is a small **doubt bot** that only answers about the card on screen.
4. **Results:** score gauge, score per stop, the retest pile, "Retest the N I missed", and "New questions on weak spots".

Sessions save to localStorage and come back on reload. The moon button switches between the Meadow (light) and Night (dark) themes. It works on phones: the index becomes a drawer and the card actions stick to the bottom.

## How bad model output is handled

Every reply goes through `server/llm/pipeline.js` and `server/llm/checks.js`:

1. **Empty** reply: `EMPTY_OUTPUT`.
2. **Extract:** strip markdown fences, slice from the first `{` to the last `}`.
3. **Parse** with `JSON.parse`.
4. **Shape:** zod checks the outer object (for example, `cards` and `quiz` arrays).
5. **Item by item:** each card and question is checked on its own. A bad one is **dropped with a warning**, the rest survive.
6. **Semantic checks:** `answerIndex` inside the options, no duplicate options, no repeated cards, chart arrays of equal length, diagram edges pointing to real nodes, and in notes mode the quote must really be in your notes (else the card shows "Not found in your notes").
7. **Bad visual:** the visual is dropped and the card stays.
8. **Too little left:** fewer than 60% valid cards (or fewer than 2 questions) counts as a failure.

Any failure in steps 1 to 8 gets **one retry** with the problem appended to the prompt. If that also fails, the UI shows a plain error with **Try again** (and **Skip** for a single stop). Each model call times out after 25 seconds.

On the client (`src/api/client.js`, `src/state/`):

* The response is **checked again** with the same zod schemas. Never trust the network.
* **Stale guard:** every request gets a `requestId` stored in its slot. A reply whose id isn't the slot's current one is ignored, and the previous request for the same slot is aborted. The doubt bot does the same for its own questions. There's a test for this in `src/state/sessionReducer.test.js`.
* After 20 seconds the UI says "Taking longer than usual" with Try again and Cancel.
* Quiz options are **shuffled** (and `answerIndex` remapped), because models like to put the right answer first.
* An error boundary means a render bug shows a reload screen, never a blank page.

The API key only lives on the server. The browser calls `/api/*`, and Vite proxies it to Express.

## Project layout

```
shared/       zod schemas and the learning profile, used by server AND client
server/       Express API: routes, provider (fetch / codex / mock), prompts, pipeline, checks, tests
src/api       fetch wrapper (timeout, abort, re-validation)
src/state     reducer with the stale guard, derived selectors, localStorage, the useApp hook
src/screens   Start, Roadmap, Learn, Results
src/components flashcard, five visual renderers, quiz question, notice board, doubt bot...
```

Design decisions and their reasons are in `docs/DECISIONS.md`. The full spec is `SPEC.md`.

## AI usage

I used AI heavily and want to be clear about how:

* **Claude (Claude Code)** wrote most of the code from my spec (`SPEC.md`), which I wrote and iterated on with it. It also produced the design mockups from reference images I collected, and drove a headless browser to screenshot every screen in both themes and at phone width.
* **Codex CLI** was the model behind the app during development (`LLM_PROVIDER=codex`).
* I reviewed the code and steered the design: the theme, colored cards, the notice board, and a calm learning page instead of heavy gradients. ‹OWNER: add what you changed or rewrote yourself.›

## Known limitations

* Visuals are drawn by our own components, so they are simple. The diagram layout is a basic layered layout and can look crowded with 8 nodes.
* Image visuals come from the Wikimedia Commons search API. A vague search term can return an unrelated picture.
* No streaming: each stop's content arrives in one piece. The next stop is prefetched while you study, which hides most of the wait.
* Editing a stop (rename, subtopics) clears its cached cards and their progress, because the old cards may no longer fit.
* Sessions live in this browser's localStorage only. No accounts, no sync.
* Small local models (for example via Ollama) fail the checks more often. The app stays usable but shows more retries.

## Time spent

‹OWNER: fill in›. The schedule was 4 days. I spent the time on the spec, design, build and testing.
