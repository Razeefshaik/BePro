import "dotenv/config";
import express from "express";
import { handle } from "./http.js";
import { PROVIDER, TIMEOUT_MS } from "./llm/provider.js";
import { MAX_ATTEMPTS } from "./llm/pipeline.js";
import { planRoute } from "./routes/plan.js";
import { moduleRoute } from "./routes/module.js";
import { readMoreRoute } from "./routes/readmore.js";
import { doubtRoute } from "./routes/doubt.js";

const app = express();
app.use(express.json({ limit: "200kb" }));

// The client asks once how long a request may take (2 model attempts plus a margin).
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    data: { status: "up", provider: PROVIDER, clientTimeoutMs: TIMEOUT_MS * MAX_ATTEMPTS + 5000 },
    warnings: [],
  });
});

app.post("/api/plan", handle(planRoute));
app.post("/api/module", handle(moduleRoute));
app.post("/api/readmore", handle(readMoreRoute));
app.post("/api/doubt", handle(doubtRoute));

// Unknown API path or a body that is not JSON: still answer with the envelope.
app.use("/api", (req, res) => {
  res.status(404).json({ ok: false, error: { code: "BAD_INPUT", message: "Unknown endpoint.", retryable: false } });
});
app.use((error, req, res, next) => {
  res.status(400).json({ ok: false, error: { code: "BAD_INPUT", message: "The request body was not valid JSON.", retryable: false } });
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  console.log(`BePro server on http://localhost:${port} (provider: ${PROVIDER}, timeout ${TIMEOUT_MS} ms)`);
});
