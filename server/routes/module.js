// POST /api/module
//   a module:        { planTitle, module, level, goal, notes? }
//   the final test:  { kind: "final", planTitle, modules, level, goal, notes? }
//   the skip check:  { kind: "skipcheck", planTitle, level, goal }   (3 basics questions)
import { moduleRequest, finalTestRequest, skipCheckRequest } from "../../shared/schemas.js";
import { compileProfile } from "../../shared/profile.js";
import { parseInput } from "../http.js";
import { complete } from "../llm/provider.js";
import { modulePrompt, finalTestPrompt, skipCheckPrompt } from "../llm/prompts.js";
import { generate } from "../llm/pipeline.js";
import { checkModuleContent } from "../llm/checks.js";

export async function moduleRoute(body, signal) {
  const kind = body?.kind;

  if (kind === "final") {
    const input = parseInput(finalTestRequest, body);
    const profile = compileProfile(input.level, input.goal);
    return generate({
      prompt: finalTestPrompt({ ...input, profile }),
      complete,
      signal,
      check: (value) =>
        checkModuleContent(value, { moduleId: "final", cardCount: 0, quizCount: profile.finalTest, notes: input.notes, cardsRequired: false }),
    });
  }

  if (kind === "skipcheck") {
    const input = parseInput(skipCheckRequest, body);
    return generate({
      prompt: skipCheckPrompt(input),
      complete,
      signal,
      check: (value) => checkModuleContent(value, { moduleId: "skipcheck", cardCount: 0, quizCount: 3, cardsRequired: false }),
    });
  }

  const input = parseInput(moduleRequest, body);
  const profile = compileProfile(input.level, input.goal);
  return generate({
    prompt: modulePrompt({ ...input, profile }),
    complete,
    signal,
    check: (value) =>
      checkModuleContent(value, {
        moduleId: input.module.id,
        cardCount: profile.cardsPerModule,
        quizCount: profile.quizPerModule,
        notes: input.notes,
      }),
  });
}
