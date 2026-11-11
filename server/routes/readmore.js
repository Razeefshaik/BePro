// POST /api/readmore  { card, planTitle, level, notes? }
import { readMoreRequest } from "../../shared/schemas.js";
import { compileProfile } from "../../shared/profile.js";
import { parseInput } from "../http.js";
import { complete } from "../llm/provider.js";
import { readMorePrompt } from "../llm/prompts.js";
import { generate } from "../llm/pipeline.js";
import { checkReadMore } from "../llm/checks.js";

export async function readMoreRoute(body, signal) {
  const input = parseInput(readMoreRequest, body);
  const profile = compileProfile(input.level, "mid");
  return generate({ prompt: readMorePrompt({ ...input, profile }), complete, signal, check: checkReadMore });
}
