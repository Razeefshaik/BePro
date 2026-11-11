import "dotenv/config";
import express from "express";

const app = express();
app.use(express.json({ limit: "200kb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, data: { status: "up" }, warnings: [] });
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  console.log(`BePro server on http://localhost:${port}`);
});
