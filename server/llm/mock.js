// Canned, well formed replies for LLM_PROVIDER=mock.
// Lets anyone click through the whole app without an API key, and keeps UI work fast.
// The text is generic on purpose: this is not a real model.

const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    }, { once: true });
  });

const VISUALS = [
  (t) => ({ kind: "flow", steps: [`Notice ${t}`, "Name the parts", "See how they connect", "Apply it"] }),
  (t) => ({ kind: "chart", chartType: "bar", labels: ["Week 1", "Week 2", "Week 3", "Week 4"], values: [2, 4, 7, 9], caption: `How comfort with ${t} grows with practice` }),
  () => ({
    kind: "diagram",
    nodes: [{ id: "a", label: "Idea" }, { id: "b", label: "Example" }, { id: "c", label: "Rule" }, { id: "d", label: "Use" }],
    edges: [{ from: "a", to: "b", label: "shown by" }, { from: "b", to: "c" }, { from: "c", to: "d", label: "lets you" }],
  }),
  () => ({
    kind: "animation",
    labels: ["A", "B", "C", "D"],
    frames: [
      { caption: "Start: everything is equal", values: [3, 3, 3, 3] },
      { caption: "A change hits B", values: [3, 6, 3, 3] },
      { caption: "It spreads to C", values: [3, 5, 6, 3] },
      { caption: "The system settles", values: [4, 4, 5, 4] },
    ],
  }),
  (t) => ({ kind: "image", searchTerm: `${t} diagram`.split(/\s+/).slice(0, 4).join(" ") }),
  () => null,
];

function plan({ topic, profile }) {
  const title = topic || "Your notes";
  const modules = [];
  for (let i = 0; i < profile.basicsModules; i++) {
    modules.push({ id: `m${i + 1}`, title: i === 0 ? `What ${title} is about` : `Key words in ${title}`, summary: "The words and ideas everything else builds on.", phase: "basics", minutes: 5, subtopics: ["Core terms", "Why it matters", "A first example"] });
  }
  const deep = ["How it works", "The main parts", "Common patterns", "Tricky cases", "Comparing approaches", "Putting it together", "Going further"];
  for (let i = modules.length, d = 0; i < profile.modules; i++, d++) {
    modules.push({ id: `m${i + 1}`, title: `${deep[d % deep.length]}`, summary: `A closer look at ${title}: ${deep[d % deep.length].toLowerCase()}.`, phase: "deepdive", minutes: 6 + (d % 3), subtopics: ["Mechanism", "Example", "Pitfall"] });
  }
  return { title, modules };
}

function adjustPlan({ existingPlan, instruction, addBasics }) {
  const modules = existingPlan.modules.map((m) => ({ ...m }));
  if (addBasics) {
    modules.unshift({ id: "basics1", title: `Basics of ${existingPlan.title}`, summary: "Prerequisites, added back on request.", phase: "basics", minutes: 5, subtopics: ["Core terms", "A first example"] });
  } else {
    modules.push({ id: `m${modules.length + 10}`, title: `Practice: ${instruction.slice(0, 40)}`, summary: "Added from your instruction.", phase: "deepdive", minutes: 6, subtopics: ["Worked example", "Try it"] });
  }
  return { title: existingPlan.title, modules };
}

function cards(module, count) {
  const t = module.title;
  const fronts = [
    `What is the core idea of "${t}"?`,
    `Why does ${t.toLowerCase()} matter?`,
    `What is a simple example of ${t.toLowerCase()}?`,
    `What is a common mistake with ${t.toLowerCase()}?`,
    `How does ${t.toLowerCase()} connect to the rest of the topic?`,
    `When would you NOT use ${t.toLowerCase()}?`,
  ];
  return fronts.slice(0, count).map((front, i) => ({
    front,
    answer: `This is a placeholder answer from the mock provider about ${t}. Connect a real model in .env to get real content.`,
    visual: VISUALS[i % VISUALS.length](t),
  }));
}

function quiz(label, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(
      i % 2 === 0
        ? { type: "mcq", question: `Mock question ${i + 1} about ${label}: which option is right?`, options: ["The first idea", "The right idea", "A distractor", "Another distractor"], answerIndex: 1, explanation: "The mock provider always marks the second option as right." }
        : { type: "truefalse", statement: `Mock statement ${i + 1}: ${label} can be learned step by step.`, answer: true, explanation: "True in the mock data." }
    );
  }
  return out;
}

export async function mockReply({ task, meta = {}, signal }) {
  await wait(700 + Math.random() * 900, signal);
  let value;
  if (task === "plan") value = plan(meta);
  else if (task === "adjustPlan") value = adjustPlan(meta);
  else if (task === "module") value = { cards: cards(meta.module, meta.profile.cardsPerModule), quiz: quiz(meta.module.title, meta.profile.quizPerModule) };
  else if (task === "final") value = { quiz: quiz(meta.planTitle, meta.count) };
  else if (task === "skipcheck") value = { quiz: quiz(`the basics of ${meta.planTitle}`, 3) };
  else if (task === "readmore")
    value = {
      paragraphs: [
        "This is a longer explanation from the mock provider. With a real model it would expand on the card in plain words.",
        "A second paragraph would give the reasoning behind the answer and link it to what you learned before.",
      ],
      example: "A short worked example would go here.",
      commonMistake: "A typical misunderstanding would go here.",
    };
  else if (task === "doubt") value = { answer: "I am the mock doubt bot. Connect a real model in .env and I will answer questions about this card." };
  else value = {};
  return JSON.stringify(value);
}
