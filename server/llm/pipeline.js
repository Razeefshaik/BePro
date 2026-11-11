// The validation pipeline (SPEC section 7). Every model reply goes through here.
//
//   1. empty check      -> EMPTY_OUTPUT
//   2. extract          -> strip code fences, slice first "{" to last "}"
//   3. parse            -> JSON.parse
//   4-8. check          -> an endpoint specific function from checks.js
//                          (container shape, item by item validation, semantic checks,
//                           visual fallback, thresholds)
//   9. return           -> { data, warnings }
//
// Any failure in steps 1 to 8 gets ONE retry, with the problem appended to the prompt.
// At most 2 model calls per request in total.

import { ApiError, MESSAGES } from "../errors.js";

export const MAX_ATTEMPTS = 2;

// Step 2: models often wrap JSON in prose or markdown fences.
export function extractJson(text) {
  const withoutFences = String(text).replace(/```[a-zA-Z]*\s*/g, "").replace(/```/g, "");
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return withoutFences.slice(start, end + 1);
}

// Steps 1 to 3. Returns { ok: true, value } or { ok: false, code, hint }.
export function parseModelText(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return { ok: false, code: "EMPTY_OUTPUT", hint: "Your reply was empty." };
  }
  const json = extractJson(text);
  if (json === null) {
    return { ok: false, code: "INVALID_OUTPUT", hint: "Your reply did not contain a JSON object." };
  }
  try {
    return { ok: true, value: JSON.parse(json) };
  } catch (error) {
    return { ok: false, code: "INVALID_OUTPUT", hint: `Your reply was not valid JSON (${error.message}).` };
  }
}

// Runs the model and the checks, retrying once with feedback.
//   prompt:   { system, user }
//   complete: the provider function, ({ system, user, signal }) => Promise<string>
//   check:    (value) => { ok: true, data, warnings } or { ok: false, hint }
export async function generate({ prompt, complete, check, signal }) {
  let user = prompt.user;
  let lastFailure = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const text = await complete({ system: prompt.system, user, signal, task: prompt.task, meta: prompt.meta });

    const parsed = parseModelText(text);
    const result = parsed.ok ? check(parsed.value) : parsed;
    if (result.ok) {
      return { data: result.data, warnings: result.warnings || [] };
    }

    lastFailure = { code: result.code || "INVALID_OUTPUT", hint: result.hint };
    console.warn(`[pipeline] attempt ${attempt} rejected: ${result.hint}`);
    user =
      `${prompt.user}\n\n` +
      `IMPORTANT: your previous reply was rejected. Problem: ${result.hint}\n` +
      `Return only valid JSON that matches the schema exactly.`;
  }

  throw new ApiError(lastFailure.code, MESSAGES[lastFailure.code], true);
}
