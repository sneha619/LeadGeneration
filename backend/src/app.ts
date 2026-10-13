import express, { type Request, type Response, type NextFunction } from "express";
import cors, { type CorsOptions } from "cors";
import config from "./config/env.js";
import healthRouter from "./routes/health.js";
import leadsRouter from "./routes/leads.js";
import { errorHandler } from "./middleware/errorHandler.js";

/**
 * Build CORS options once so the same config is reused for both the
 * global middleware and the explicit OPTIONS preflight handler.
 *
 * Why a function instead of a plain string for `origin`:
 *   The cors package with a static string echoes that value in
 *   Access-Control-Allow-Origin for EVERY request regardless of the
 *   actual Origin header. Vercel's CDN can then cache that response
 *   and serve it to a different origin, producing a mismatch.
 *   A function only echoes the origin when it matches; for non-matching
 *   origins it passes `false`, which causes cors to omit the header
 *   entirely — the browser sees a correct rejection, and Vercel does
 *   not cache a response it can reuse for an unrelated origin.
 */
function buildCorsOptions(): CorsOptions {
  // Trim any accidental whitespace that env vars can carry.
  const allowed = config.corsOrigin.trim();

  return {
    origin(requestOrigin, callback) {
      // No Origin header → server-to-server or same-origin → allow.
      if (!requestOrigin) return callback(null, true);
      if (requestOrigin === allowed) return callback(null, true);
      // Explicitly reject; do not echo wrong origins.
      callback(null, false);
    },
    credentials: true,
    // Enumerate every method the frontend actually uses.
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
    // Enumerate every request header the frontend sends.
    // `Content-Type` is required for PATCH requests with a JSON body.
    allowedHeaders: ["Content-Type", "Authorization"],
    // Expose Content-Disposition so the CSV export can read the filename.
    exposedHeaders: ["Content-Disposition"],
    optionsSuccessStatus: 204,
  };
}

export function createApp() {
  const app = express();
  const corsOptions = buildCorsOptions();

  // Apply CORS headers to every response.
  app.use(cors(corsOptions));

  // Explicit preflight handler — must come before any route registration.
  // This ensures OPTIONS requests are answered with 204 immediately,
  // before Express tries to match them against GET/PATCH/etc. route handlers.
  // Also sets Cache-Control: no-store to prevent Vercel's CDN from caching
  // the preflight response (a cached preflight from one origin served to a
  // different origin is the primary cause of the CORS failures seen in prod).
  app.options("*", (req: Request, res: Response) => {
    cors(corsOptions)(req, res, () => {
      res.setHeader("Cache-Control", "no-store");
      res.sendStatus(204);
    });
  });

  app.use(express.json());

  app.get("/", (_req: Request, res: Response) => {
    res.json({
      service: "saasquatch-lead-intelligence",
      version: "0.1.0",
      docs: "GET /api/health, GET /api/leads",
    });
  });

  app.use("/api", healthRouter);
  app.use("/api", leadsRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found" });
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
  });

  return app;
}

export default createApp;

