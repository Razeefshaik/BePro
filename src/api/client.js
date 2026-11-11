// Small fetch wrapper. It NEVER throws: every call resolves to the same envelope the server uses,
//   { ok: true, data, warnings }  or  { ok: false, error: { code, message, retryable } }
// so screens only have one shape to handle.
import {
  planSchema,
  moduleContentSchema,
  finalReadMoreSchema,
  doubtSchema,
  summarizeZodError,
} from "../../shared/schemas.js";

// How long one request may take. The server tells us its real limit on start (see loadServerConfig).
let clientTimeoutMs = 55000;

export async function loadServerConfig() {
  try {
    const response = await fetch("/api/health");
    const json = await response.json();
    if (json?.data?.clientTimeoutMs) clientTimeoutMs = json.data.clientTimeoutMs;
    return json?.data ?? null;
  } catch {
    return null;
  }
}

const failure = (code, message, retryable = true) => ({ ok: false, error: { code, message, retryable } });

export async function postJson(path, body, { signal, schema } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, clientTimeoutMs);
  const forwardAbort = () => controller.abort();
  signal?.addEventListener("abort", forwardAbort);

  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let envelope;
    try {
      envelope = await response.json();
    } catch {
      return failure("PROVIDER_ERROR", "The server sent a reply we could not read.");
    }
    if (!envelope || typeof envelope.ok !== "boolean") {
      return failure("PROVIDER_ERROR", "The server sent a reply we could not read.");
    }
    if (!envelope.ok) {
      return failure(
        envelope.error?.code ?? "PROVIDER_ERROR",
        envelope.error?.message ?? "Something went wrong.",
        envelope.error?.retryable ?? true
      );
    }

    // Never trust the network: check the data again on this side.
    let data = envelope.data;
    if (schema) {
      const checked = schema.safeParse(data);
      if (!checked.success) {
        console.warn("[client] response failed checks:", summarizeZodError(checked.error));
        return failure("INVALID_OUTPUT", "The reply didn't pass our checks.");
      }
      data = checked.data;
    }
    return { ok: true, data, warnings: Array.isArray(envelope.warnings) ? envelope.warnings : [] };
  } catch {
    if (signal?.aborted) return failure("CANCELLED", "Cancelled.");
    if (timedOut) return failure("TIMEOUT", "The AI took too long to answer.");
    return failure("NETWORK", "Can't reach the BePro server. Is it running?");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }
}

export const api = {
  plan: (body, signal) => postJson("/api/plan", body, { signal, schema: planSchema }),
  module: (body, signal) => postJson("/api/module", body, { signal, schema: moduleContentSchema }),
  readMore: (body, signal) => postJson("/api/readmore", body, { signal, schema: finalReadMoreSchema }),
  doubt: (body, signal) => postJson("/api/doubt", body, { signal, schema: doubtSchema }),
};
