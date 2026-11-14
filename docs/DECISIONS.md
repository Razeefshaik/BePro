# BePro: decisions

One row per design change, with its reason. Add a dated section per batch of work.

## 2026-11-12 Start

| Decision | By | Status | Reason |
| --- | --- | --- | --- |
| `SPEC.md` at the repo root is the design source of truth; HANDOFF only links to it | razeef | Accept | One place to change the design, so copies can't drift |
| BePro is its own git repo, separate from the parent StudyResource repo | razeef | Accept | The submission must be a clean public repo |
| Plain JavaScript, plain CSS, approved dependency list only | razeef | Accept | Every line must be explainable in the interview |
| Schedule is 4 days to 2026-11-16, not 8 hours; build the full spec | razeef | Accept | Owner's call; the cut order is only a fallback |
| `provider.js` has two modes via `LLM_PROVIDER`: `openai` (fetch) and `codex` (spawns `codex exec` with the prompt on stdin, `-s read-only --ephemeral --skip-git-repo-check`, run in an empty temp dir, answer read from `-o` file) | razeef | Accept | Free local development on the owner's Codex login; no new dependency (Node `child_process`); graders still use the openai path |
| Provider timeout comes from `LLM_TIMEOUT_MS` (25s default; raise to about 90s for codex) and the client timeout follows it | razeef | Accept | A Codex call took 11 to 14s for a tiny plan, so module content can exceed 25s |
| Theme "Meadow Glass" replaces SPEC 10's Ink/Paper tokens (owner approved, with the changes in the 2026-11-12 Build section): Meadow (light, from LangUp: mint to lavender ground, ink pill buttons, Outfit) and Night (dark, from Noryx: ember and cobalt glow, glass cards, thin numerals, highlighter lime for focus). Canvas: https://claude.ai/artifact/NPGo2q3f3m9YUsPAip1Mfi | razeef | Accept | Owner asked for LangUp's look plus Noryx's glass and gradients |
| Color roles stay the same, hues change: focus = lavender / lime, got it = green / mint, review = blush / ember, always with an icon or a word | razeef | Accept | Keeps SPEC's meaning-first rule while fitting the new palettes |
| Codex model `gpt-6-luna` with `model_reasoning_effort="low"` | razeef | Accept | The config default `gpt-6.1-sol` is rejected for ChatGPT-account logins; luna was the fastest tested |

## 2026-11-12 Build (C01 to C10)

| Decision | By | Status | Reason |
| --- | --- | --- | --- |
| Gradient background and big wordmark only on the start screen; working screens use a calm flat background with faint corner washes | razeef | Accept | Owner: the gradient fit the intro but not the learning pages, in both themes |
| Each flashcard, road map stop and true/false card gets its own pastel tint, cycling through the palette | razeef | Accept | Owner asked for differently colored cards, like the reference lesson cards |
| Learning page top band = tracking panel plus a wide notice board (motivation, tip or adaptive hint, session stats) | razeef | Accept | Owner asked for a wider band that reads like a notice board |
| Results use one layout for both themes | razeef | Accept | Owner liked the results design and wanted it the same in both |
| Third provider mode `mock`, plus `LLM_CHAOS` (0 to 1) that breaks replies on purpose | razeef | Accept | Lets graders click through without a key and demo the failure handling on demand |
| One generic `generate()` retry loop in `pipeline.js`, endpoint rules in `checks.js` | razeef | Accept | Keeps the retry logic in one place and each check easy to explain |
| Ids for cards and questions are assigned by our code (`m1-c1`, `m1-q1`), never taken from the model | razeef | Accept | Stable keys for ratings, answers and the retest pile |
| Editing a stop (rename, subtopics, delete) drops its cached cards and their progress | razeef | Accept | Old cards may no longer match the edited stop |
| "New questions on weak spots" adds a new stop built from the lowest scoring stops and opens it | razeef | Accept | Reuses the module endpoint instead of a new one |
| Unanswered quiz questions go to the doubt bot without the answer key | razeef | Accept | The bot must not spoil the question |
| Vite proxy reads the API port from `PORT` (dotenv) | razeef | Accept | Server and proxy always agree on the port |
| Reducer tests (`src/state/*.test.js`) run with `npm test` next to the pipeline tests | razeef | Accept | Proves the stale guard in code, not only in prose |

## 2026-11-14 Start screen rework

| Decision | By | Status | Reason |
| --- | --- | --- | --- |
| Saved learnings move to a full-height left sidebar (drawer under 900px), with New learning and the theme toggle | razeef | Accept | Owner: should feel like a chat app's history list |
| BEPRO wordmark gets its own row above the headline (gradient in Meadow) instead of sitting behind it | razeef | Accept | Owner: text over the wordmark looked congested and wasted it |
| Level and goal are two joined stacked lists with a radio per row, not separate tiles | razeef | Accept | Owner: separated tiles looked confusing |
| Smaller Build my road map button (42px) | razeef | Accept | Owner: it looked too big |
| Road map: no native scrollbar; arrow buttons and soft faded edges appear only when the road overflows | razeef | Accept | Owner: the scrollbar looked ugly |
| Road line segments and stop circle rings use each stop card's tint; circles are white inside | razeef | Accept | Owner: the step bar colors should match the cards |

## 2026-11-14 Learning page band

| Decision | By | Status | Reason |
| --- | --- | --- | --- |
| The current stop's progress bar moves from the top band into the Index entry | razeef | Accept | Owner: the Index already lists the stops, so progress belongs there |
| Notice board replaced by a live board in the style of a railway or airport display (LED font VT323, auto-rotating line, ticker, clock), dark in both themes | razeef | Accept | Owner: should feel like a live announcement screen, not notes you refresh |
| Top band shows the stop's one-line summary and time estimate under the title | razeef | Accept | Fills the space the progress bar left with useful context |

## 2026-11-14 Navigation and flashcards

| Decision | By | Status | Reason |
| --- | --- | --- | --- |
| The top bar loses its + (new learning) button; new learnings start from the home sidebar only | razeef | Accept | Owner: nobody starts a new learning from the middle of a lesson |
| On Learn and Results, Road map opens a road map card over the page (jump to a stop, or Edit road map for the full page) | razeef | Accept | Owner: navigation was confusing; the map should open like Sources |
| Results gets a Back to learning button (Back to road map if no stop was started) | razeef | Accept | Owner: there was no way back from results |
| The top-left band becomes three phase tiles with one mark per stop, plus the current stop in one line | razeef | Accept | Owner: the stop title took too much space; the phase should be the highlight |
| Flashcards get a deck meter, peeking next cards, a big number, Q and A badges, a different back face, click to flip and one control bar | razeef | Accept | Owner: the cards looked boring |
| Card background shapes vary per card from a set of eight instead of one star everywhere | razeef | Accept | Owner: the same star on every card was boring |
| Caveat font removed | razeef | Accept | Only the old notice board used it |

