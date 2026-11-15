import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

// Hosting: after `npm run build`, this same server also serves the built app from dist/,
// so one service runs everything. In development dist/ doesn't exist and Vite serves the app.
const distDir = fileURLToPath(new URL("../dist", import.meta.url));
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (req, res) => res.sendFile(path.join(distDir, "index.html")));
}
app.use((error, req, res, next) => {
  res.status(400).json({ ok: false, error: { code: "BAD_INPUT", message: "The request body was not valid JSON.", retryable: false } });
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  console.log(`BePro server on http://localhost:${port} (provider: ${PROVIDER}, timeout ${TIMEOUT_MS} ms)`);
  if (PROVIDER === "mock") {
    console.log("Using demo content (no real model). To use one, copy .env.example to .env and fill it in.");
  }
});
