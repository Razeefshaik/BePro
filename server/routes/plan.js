// POST /api/plan
//   new plan:    { topic, notes?, level, goal }
//   adjust plan: { existingPlan, instruction, level, goal, notes?, addBasics? }
import { newPlanRequest, adjustPlanRequest } from "../../shared/schemas.js";
import { compileProfile } from "../../shared/profile.js";
import { parseInput } from "../http.js";
import { complete } from "../llm/provider.js";
import { planPrompt, adjustPlanPrompt } from "../llm/prompts.js";
import { generate } from "../llm/pipeline.js";
import { checkPlan } from "../llm/checks.js";

export async function planRoute(body, signal) {
  if (body && body.existingPlan) {
    const input = parseInput(adjustPlanRequest, body);
    const profile = compileProfile(input.level, input.goal);
    return generate({
      prompt: adjustPlanPrompt({ ...input, profile }),
      complete,
      signal,
      check: (value) => checkPlan(value, { profile, mode: "adjust", addBasics: input.addBasics }),
    });
  }

  const input = parseInput(newPlanRequest, body);
  const profile = compileProfile(input.level, input.goal);
  return generate({
    prompt: planPrompt({ ...input, profile }),
    complete,
    signal,
    check: (value) => checkPlan(value, { profile, mode: "new" }),
  });
}
