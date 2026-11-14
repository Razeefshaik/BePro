# Video script

Target length: about 3 minutes. Record at 1440 x 900 or similar, browser zoom 100%.

**Before recording**
- `.env`: a real model (`LLM_PROVIDER=openai` with a Groq key, or `codex`). Run `npm start`.
- Clear old sessions: delete them in the sidebar, so the list starts empty.
- For the chaos part you restart the server once with `LLM_CHAOS=0.5` (keep a second terminal ready).

| Time | On screen | Say |
| --- | --- | --- |
| 0:00 | Start screen | "BePro is a study assistant that is not a chatbot. I type a topic, pick my level and goal, and it builds a road map of flashcards and quizzes." |
| 0:10 | Pick Beginner and Crash course, type "TCP congestion control", press Build my road map. Skeleton stops appear | "While the model works you see skeleton stops, never a blank screen. My code decides the structure: a crash course for a beginner is three stops with four cards each. The model only fills in the content." |
| 0:25 | Road map. Rename a stop, remove a subtopic chip, type "add a stop on QUIC" in Adjust plan | "The plan is editable. Adjust plan sends the current plan plus my instruction, and the old map stays on screen until the new one passes the checks." |
| 0:45 | Let's start. Flip a card, open Read further, press 1 on one card and 2 on another | "Each stop is flashcards first. Click or Space flips, 1 and 2 rate the card. Read further loads a longer explanation once and caches it. The next stop is prefetched in the background: you can see it loading in the Index." |
| 1:10 | Quiz tab. Answer one right and one wrong | "Then a short quiz. Options are shuffled by my code, because models like to put the right answer first. The wrong answer goes to my retest pile: the session card shows the count." |
| 1:25 | Ask a doubt: click "Explain it simpler" | "The doubt bot only answers about the card on screen, and for an unanswered question it doesn't get the answer key, so it can't spoil it." |
| 1:40 | Terminal: restart with `LLM_CHAOS=0.5`. Open the next stop | "Now the part the assignment cares about: bad output. Chaos mode breaks half of the model's replies on purpose: wrapped in prose, cut off, empty, a wrong answer index, or very slow." |
| 1:50 | Server log shows "attempt 1 rejected", content still appears. Then a stop that fails: the error banner with Try again and Skip | "Every reply goes through one pipeline: extract the JSON, parse it, check the shape, check each card on its own, then semantic checks. A bad card is dropped and the rest survive. A failed reply gets one retry with the problem added to the prompt. If that fails too, I get a plain error with Try again, and only this stop is affected." |
| 2:15 | Road map: press Rebuild twice quickly (or send two Adjust plan instructions fast) | "Stale replies: each request has an id stored in its slot, and starting a new one aborts the old one. A late reply with an old id is ignored. There's a unit test for exactly this." |
| 2:30 | Results. Press Retest the N I missed, answer one | "Results show the score per stop and my retest pile. Retest brings back what I missed, with the options reshuffled." |
| 2:42 | Reload the page. Toggle the theme. Narrow the window to phone width | "Sessions are saved in localStorage and come back after a reload. There's a dark theme, and on a phone the Index becomes a drawer and the buttons stick to the bottom." |
| 2:55 | Editor: `server/llm/pipeline.js`, then `npm test` output | "The pipeline is seventy lines, and 24 tests cover the bad output cases and the stale guard. Thanks for watching." |

**If something goes wrong while recording:** that's fine to keep. An error banner with Try again is the feature.
