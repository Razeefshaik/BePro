import "dotenv/config";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The browser only ever talks to /api on the Vite dev server.
// Vite forwards those calls to our Express server, so the API key stays on the server.
// PORT comes from .env (or the shell), the same value the server listens on.
const apiPort = Number(process.env.PORT) || 8787;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": `http://localhost:${apiPort}`,
    },
  },
});
