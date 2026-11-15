# Submission checklist

**Deadline: 2026-11-16 (IST).** Brief: `docs/assignment.pdf`.

## From the brief
- **Grading:** React and frontend architecture 25%, AI integration and data handling 25%, handling bad AI output 20%, UI/UX and product sense 15%, communication and understanding 15%.
- **Required items:** public GitHub repo (or private with access); small meaningful commits; README with setup, usage, AI usage note, known limitations and time spent; a short screen recording; `npm install && npm start` works.
- **Interview:** demo, code walkthrough, review an AI-generated snippet, fix a planted bug, add a small feature live.

## Requirements
- [x] React hooks and functional components.
- [x] Free form text input.
- [x] Real LLM API, key only on the server.
- [x] Structured JSON parsed and rendered as interactive, stateful UI (not a chatbot).
- [x] Malformed, wrong shape, empty, slow and failed output all handled: no crash, a retry shown.
- [x] A stale response never overwrites a newer one.
- [x] Loading, error and empty states.
- [x] Works on mobile.

## Repo
- [ ] README filled, no placeholders.
- [x] Fresh clone test: `npm install && npm start`.
- [x] `.env` not committed; `.env.example` present.

## Video
- [ ] Recorded following the HANDOFF demo story.
- [ ] Uploaded; link in the README.

## Audit 2026-11-15 (against the brief)
- Fresh clone with no `.env`: falls back to demo content (mock) and says so; before, every request failed.
- `LLM_CHAOS=1`: truncated JSON retried, prose stripped, empty and slow replies end in Try again; no crash.
- Full flow checked in the browser on desktop and phone, keyboard included: start, road map, flip, rate, quiz, results, retest.
- Still open for the owner: README AI-usage line and time spent, the video link, and fresh README screenshots (the UI changed on 2026-11-14/15).

## Last check
- [ ] No placeholders left: `rg -n '‹|›' README.md docs/submission/`.
