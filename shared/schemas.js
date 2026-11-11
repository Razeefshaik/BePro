// Zod schemas shared by the server (to validate model output and requests)
// and the client (to re-check every response: never trust the network).
import { z } from "zod";

const text = (max) => z.string().trim().min(1).max(max);
const finiteNumber = z.number().finite();

export const LEVELS = ["beginner", "intermediate", "pro"];
export const GOALS = ["master", "mid", "crash"];
const level = z.enum(LEVELS);
const goal = z.enum(GOALS);

// ---------- Visuals: the model sends data, our components draw it ----------

const flowVisual = z.object({
  kind: z.literal("flow"),
  steps: z.array(text(90)).min(2).max(6),
});

const chartVisual = z.object({
  kind: z.literal("chart"),
  chartType: z.enum(["bar", "line"]),
  labels: z.array(text(30)).min(2).max(12),
  values: z.array(finiteNumber).min(2).max(12),
  caption: z.string().trim().max(160).default(""),
});

const diagramVisual = z.object({
  kind: z.literal("diagram"),
  nodes: z.array(z.object({ id: text(30), label: text(48) })).min(2).max(8),
  edges: z
    .array(z.object({ from: text(30), to: text(30), label: z.string().trim().max(32).optional() }))
    .max(16),
});

const animationVisual = z.object({
  kind: z.literal("animation"),
  labels: z.array(text(30)).max(12).optional(),
  frames: z
    .array(z.object({ caption: text(140), values: z.array(finiteNumber).min(1).max(12) }))
    .min(2)
    .max(8),
});

const imageVisual = z.object({
  kind: z.literal("image"),
  searchTerm: text(60),
});

// Cross-field checks that a plain object schema cannot express.
export const visualSchema = z
  .discriminatedUnion("kind", [flowVisual, chartVisual, diagramVisual, animationVisual, imageVisual])
  .superRefine((v, ctx) => {
    const fail = (message) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (v.kind === "chart" && v.labels.length !== v.values.length) {
      fail("chart labels and values have different lengths");
    }
    if (v.kind === "diagram") {
      const ids = v.nodes.map((n) => n.id);
      if (new Set(ids).size !== ids.length) fail("diagram node ids are not unique");
      for (const edge of v.edges) {
        if (!ids.includes(edge.from) || !ids.includes(edge.to)) {
          fail(`diagram edge ${edge.from} -> ${edge.to} points to a missing node`);
        }
      }
    }
    if (v.kind === "animation") {
      const size = v.frames[0].values.length;
      if (v.frames.some((f) => f.values.length !== size)) fail("animation frames have different value counts");
      if (v.labels && v.labels.length !== size) fail("animation labels do not match the value count");
    }
    if (v.kind === "image") {
      const words = v.searchTerm.split(/\s+/).filter(Boolean).length;
      if (words < 2 || words > 6) fail("image searchTerm must be 2 to 6 words");
    }
  });

// ---------- Cards and questions (as the model sends them) ----------

export const rawCardSchema = z.object({
  id: z.any().optional(), // ignored: our code assigns ids
  front: text(220),
  answer: text(700),
  visual: z.any().optional(), // checked separately so a bad visual never drops the card
  sourceQuote: z.string().trim().max(500).optional(),
});

const mcqSchema = z.object({
  id: z.any().optional(),
  type: z.literal("mcq"),
  question: text(320),
  options: z.array(text(200)).min(2).max(6),
  answerIndex: z.number().int(),
  explanation: text(600),
  sourceQuote: z.string().trim().max(500).optional(),
});

const trueFalseSchema = z.object({
  id: z.any().optional(),
  type: z.literal("truefalse"),
  statement: text(320),
  answer: z.boolean(),
  explanation: text(600),
  sourceQuote: z.string().trim().max(500).optional(),
});

export const rawQuestionSchema = z.discriminatedUnion("type", [mcqSchema, trueFalseSchema]);

// Outer shapes only. Items inside are validated one by one so one bad item never sinks the rest.
export const moduleContainerSchema = z.object({
  cards: z.array(z.unknown()),
  quiz: z.array(z.unknown()),
});

export const quizContainerSchema = z.object({
  quiz: z.array(z.unknown()),
});

// ---------- Plan ----------

export const rawPlanModuleSchema = z.object({
  id: z.any().optional(),
  title: text(90),
  summary: z.string().trim().max(240).default(""),
  phase: z.enum(["basics", "deepdive"]),
  minutes: finiteNumber.default(6),
  subtopics: z.array(text(60)).min(1),
});

export const planContainerSchema = z.object({
  title: text(120),
  modules: z.array(z.unknown()),
});

// ---------- Read more and doubt ----------

export const readMoreSchema = z.object({
  paragraphs: z.array(z.string()).min(1),
  example: z.string().trim().max(500).nullish(),
  commonMistake: z.string().trim().max(500).nullish(),
});

export const doubtSchema = z.object({
  answer: text(2000),
});

// ---------- Final shapes our server returns (the client re-checks these) ----------

const finalModuleSchema = z.object({
  id: text(60),
  title: text(90),
  summary: z.string().max(240),
  phase: z.enum(["basics", "deepdive"]),
  minutes: z.number().int().min(2).max(15),
  subtopics: z.array(text(60)).max(8),
});

export const planSchema = z.object({
  title: text(120),
  modules: z.array(finalModuleSchema).min(1).max(12),
});

const finalCardSchema = z.object({
  id: text(80),
  front: text(220),
  answer: text(700),
  visual: visualSchema.nullable(),
  sourceQuote: z.string().optional(),
  ungrounded: z.boolean().optional(),
});

const finalQuestionSchema = z.discriminatedUnion("type", [
  mcqSchema.extend({ id: text(80), ungrounded: z.boolean().optional() }),
  trueFalseSchema.extend({ id: text(80), ungrounded: z.boolean().optional() }),
]);

export const moduleContentSchema = z.object({
  moduleId: text(80),
  cards: z.array(finalCardSchema),
  quiz: z.array(finalQuestionSchema),
});

export const finalReadMoreSchema = z.object({
  paragraphs: z.array(text(1200)).min(1).max(4),
  example: z.string().nullish(),
  commonMistake: z.string().nullish(),
});

// ---------- Requests (checked on the server, fail fast with BAD_INPUT) ----------

export const newPlanRequest = z
  .object({
    topic: z.string().trim().max(200).default(""),
    notes: z.string().max(12000).default(""),
    level,
    goal,
  })
  .refine((b) => b.topic.length >= 3 || b.notes.trim().length >= 20, {
    message: "Type at least 3 characters, or paste some notes.",
  });

export const adjustPlanRequest = z.object({
  existingPlan: planSchema,
  instruction: z.string().trim().min(2, "Say what to change.").max(300),
  level,
  goal,
  notes: z.string().max(12000).default(""),
  addBasics: z.boolean().default(false),
});

const moduleRef = z.object({
  id: text(60),
  title: text(90),
  summary: z.string().max(240).default(""),
  subtopics: z.array(text(60)).max(8).default([]),
});

export const moduleRequest = z.object({
  kind: z.literal("module").default("module"),
  planTitle: text(120),
  module: moduleRef,
  level,
  goal,
  notes: z.string().max(12000).default(""),
});

export const finalTestRequest = z.object({
  kind: z.literal("final"),
  planTitle: text(120),
  modules: z.array(moduleRef).min(1).max(12),
  level,
  goal,
  notes: z.string().max(12000).default(""),
});

export const skipCheckRequest = z.object({
  kind: z.literal("skipcheck"),
  planTitle: text(120),
  level,
  goal,
});

export const readMoreRequest = z.object({
  card: z.object({ front: text(220), answer: text(700) }),
  planTitle: text(120),
  level,
  notes: z.string().max(12000).default(""),
});

export const doubtRequest = z.object({
  question: z.string().trim().min(2, "Type your question.").max(500),
  context: z.any(),
  history: z
    .array(z.object({ role: z.enum(["user", "bot"]), text: z.string().max(2000) }))
    .max(6)
    .default([]),
});

// Short, readable summary of a zod error, used in retry hints and BAD_INPUT messages.
export function summarizeZodError(error, max = 4) {
  return error.issues
    .slice(0, max)
    .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
    .join("; ");
}
