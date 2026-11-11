import { ApiError, toEnvelope } from "./errors.js";

// Check a request body against a zod schema. Bad input fails fast, before any model call.
export function parseInput(schema, body) {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const first = result.error.issues[0];
    const field = first.path.length ? `${first.path.join(".")}: ` : "";
    throw new ApiError("BAD_INPUT", `${field}${first.message}`, false);
  }
  return result.data;
}

// Wraps a route function `(body, signal) => { data, warnings }` into an Express handler
// that always answers with the same envelope.
export function handle(routeFn) {
  return async (req, res) => {
    // If the browser goes away (user cancelled or started a newer request), stop the model call too.
    const controller = new AbortController();
    res.on("close", () => {
      if (!res.writableEnded) controller.abort();
    });

    try {
      const { data, warnings = [] } = await routeFn(req.body, controller.signal);
      res.json({ ok: true, data, warnings });
    } catch (error) {
      const { status, body } = toEnvelope(error);
      if (!res.headersSent) res.status(status).json(body);
    }
  };
}
