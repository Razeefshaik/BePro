// POST /api/doubt  { question, context, history }
// The answer is plain text; the client renders it as text, never as HTML.
import { doubtRequest } from "../../shared/schemas.js";
import { parseInput } from "../http.js";
import { complete } from "../llm/provider.js";
import { doubtPrompt } from "../llm/prompts.js";
import { generate } from "../llm/pipeline.js";
import { checkDoubt } from "../llm/checks.js";

export async function doubtRoute(body, signal) {
  const input = parseInput(doubtRequest, body);
  return generate({ prompt: doubtPrompt(input), complete, signal, check: checkDoubt });
}
