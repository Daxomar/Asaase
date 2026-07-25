import path from "node:path";
import "dotenv/config";
import cors from "cors";
import express from "express";
import { isDbReachable } from "./db/client.js";
import { alertsRouter } from "./routes/alerts.js";
import { gamificationRouter } from "./routes/gamification.js";
import { scansRouter } from "./routes/scans.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
// JSON body parser — needed by the gamification routes (auth/device, quiz/submit,
// marketplace/redeem all read `req.body`). Only parses `application/json` requests; multer on
// `/api/scans/analyze` handles its own `multipart/form-data` body independently, no conflict.
app.use(express.json());
// Serves persisted scan photos back out at the `imageUrl` path stored on the Scan row.
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/health", async (_req, res) => {
  const dbUp = await isDbReachable();
  // No-mock policy (A-04): DB down is reported explicitly at a non-200 status, never a silent 200.
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? "ok" : "degraded", db: dbUp ? "up" : "down" });
});

app.use("/api/scans", scansRouter);
app.use("/api", alertsRouter);
app.use("/api", gamificationRouter);

app.listen(port, () => {
  console.log(`backend listening on ${port}`);
});
