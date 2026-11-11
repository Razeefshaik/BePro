# Submission checklist

**Deadline: 2026-11-16 (IST).** Brief: `docs/assignment.pdf`.

## From the brief
- **Grading:** React and frontend architecture 25%, AI integration and data handling 25%, handling bad AI output 20%, UI/UX and product sense 15%, communication and understanding 15%.
- **Required items:** public GitHub repo (or private with access); small meaningful commits; README with setup, usage, AI usage note, known limitations and time spent; a short screen recording; `npm install && npm start` works.
- **Interview:** demo, code walkthrough, review an AI-generated snippet, fix a planted bug, add a small feature live.

## Requirements
- [ ] React hooks and functional components.
- [ ] Free form text input.
- [ ] Real LLM API, key only on the server.
- [ ] Structured JSON parsed and rendered as interactive, stateful UI (not a chatbot).
- [ ] Malformed, wrong shape, empty, slow and failed output all handled: no crash, a retry shown.
- [ ] A stale response never overwrites a newer one.
- [ ] Loading, error and empty states.
- [ ] Works on mobile.

## Repo
- [ ] README filled, no placeholders.
- [ ] Fresh clone test: `npm install && npm start`.
- [ ] `.env` not committed; `.env.example` present.

## Video
- [ ] Recorded following the HANDOFF demo story.
- [ ] Uploaded; link in the README.

## Last check
- [ ] No placeholders left: `rg -n '‹|›' README.md docs/submission/`.
