// The one place that talks to a language model.
//   complete({ system, user, signal, task, meta }) -> Promise<string>  (the raw reply text)
//
// LLM_PROVIDER picks how:
//   openai (default) any OpenAI compatible /chat/completions endpoint (Groq, OpenRouter, Ollama...), plain fetch
//   codex            the local Codex CLI (`codex exec`), for free development on the owner's machine
//   mock             canned replies, no network: for UI work and for trying the app without a key
//
// LLM_CHAOS (0 to 1) breaks that share of replies on purpose, to demo the failure handling.

import { spawn, execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ApiError } from "../errors.js";
import { mockReply } from "./mock.js";

export const PROVIDER = (process.env.LLM_PROVIDER || "openai").toLowerCase();
export const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || (PROVIDER === "codex" ? 120000 : 25000);
const CHAOS = Math.min(1, Math.max(0, Number(process.env.LLM_CHAOS) || 0));

export async function complete({ system, user, signal, task, meta }) {
  // Our own controller: it fires on the timeout OR when the caller's signal fires (client went away).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), TIMEOUT_MS);
  const forwardAbort = () => controller.abort("cancelled");
  signal?.addEventListener("abort", forwardAbort);

  try {
    let text;
    if (PROVIDER === "codex") text = await completeWithCodex({ system, user, signal: controller.signal });
    else if (PROVIDER === "mock") text = await mockReply({ task, meta, signal: controller.signal });
    else text = await completeWithFetch({ system, user, signal: controller.signal });
    return CHAOS > 0 ? await addChaos(text, controller.signal) : text;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiError("TIMEOUT", controller.signal.reason === "cancelled" ? "The request was cancelled." : undefined);
    }
    if (error instanceof ApiError) throw error;
    console.error("[provider]", error.message);
    throw new ApiError("PROVIDER_ERROR");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }
}

// ---------- OpenAI compatible endpoint ----------

async function completeWithFetch({ system, user, signal }) {
  const baseUrl = (process.env.LLM_BASE_URL || "").replace(/\/+$/, "");
  const model = process.env.LLM_MODEL;
  if (!baseUrl || !model) {
    throw new ApiError("PROVIDER_ERROR", "No AI model is set up on the server. Copy .env.example to .env and fill it in.");
  }

  const body = {
    model,
    temperature: 0.4,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (process.env.LLM_JSON_MODE === "true") body.response_format = { type: "json_object" };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.LLM_API_KEY ? { Authorization: `Bearer ${process.env.LLM_API_KEY}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (response.status === 429) throw new ApiError("RATE_LIMITED");
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[provider] HTTP ${response.status}: ${detail.slice(0, 300)}`);
    throw new ApiError("PROVIDER_ERROR");
  }

  const json = await response.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

// ---------- Local Codex CLI ----------
// Runs in an empty temp folder with a read-only sandbox, so the agent has nothing to touch.

async function completeWithCodex({ system, user, signal }) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "bepro-codex-"));
  const outFile = path.join(dir, "answer.txt");
  const model = process.env.CODEX_MODEL || "gpt-6-luna";
  const args = [
    "exec", "-m", model, "-c", "model_reasoning_effort=low",
    "-s", "read-only", "--ephemeral", "--skip-git-repo-check",
    "-C", dir, "-o", outFile, "-",
  ];
  const isWindows = process.platform === "win32";

  try {
    await new Promise((resolve, reject) => {
      // On Windows `codex` is a .cmd shim, which needs a shell. Every argument is ours (no user text),
      // and the user's prompt goes in through stdin, never through the command line.
      const stdio = ["pipe", "ignore", "pipe"];
      const child = isWindows
        ? spawn(["codex", ...args.map((a) => `"${a}"`)].join(" "), { shell: true, stdio })
        : spawn("codex", args, { stdio });
      let stderr = "";
      const stop = () => {
        if (isWindows) execFile("taskkill", ["/pid", String(child.pid), "/T", "/F"], () => {});
        else child.kill();
      };
      signal.addEventListener("abort", stop, { once: true });
      child.stderr.on("data", (chunk) => (stderr = (stderr + chunk).slice(-2000)));
      child.on("error", reject);
      child.on("close", (code) => {
        signal.removeEventListener("abort", stop);
        if (signal.aborted) reject(new Error("aborted"));
        else if (code === 0) resolve();
        else reject(new Error(`codex exited with ${code}: ${stderr.slice(-300)}`));
      });
      child.stdin.end(`${system}\n\nDo not run commands or read files. Answer from your own knowledge.\n\n${user}`);
    });
    return await readFile(outFile, "utf8").catch(() => "");
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

// ---------- Chaos: break replies on purpose ----------

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    }, { once: true });
  });

async function addChaos(text, signal) {
  if (Math.random() >= CHAOS) return text;
  const tricks = [
    () => "Sure! Here you go:\n```json\n" + text + "\n```\nLet me know if you need more.", // pipeline still copes
    () => text.slice(0, Math.floor(text.length / 2)), // truncated JSON, forces a retry
    () => "", // empty reply
    () => text.replace(/"answerIndex":\s*\d+/, '"answerIndex": 9'), // a bad answer index, item gets dropped
    async () => {
      await sleep(22000, signal); // slow: shows "Taking longer than usual"
      return text;
    },
  ];
  const trick = tricks[Math.floor(Math.random() * tricks.length)];
  console.warn("[chaos] breaking this reply on purpose");
  return trick();
}
