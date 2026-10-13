/**
 * Vercel Serverless Function entry point.
 *
 * Vercel routes ALL requests (via vercel.json rewrite) to this single handler.
 * The Express app is created once and reused across warm invocations (module-level
 * singleton), but we must ensure the DB is initialised before the first request
 * because `initDbConnection` is async and `index.ts` (which calls app.listen)
 * is NOT used on Vercel.
 *
 * DB strategy on Vercel (stateless / ephemeral filesystem):
 *   - We cannot persist the SQLite file between invocations.
 *   - On cold starts dbInstance is null; we init + seed in-memory.
 *   - On warm invocations dbInstance is already set — the module singleton
 *     ensures we skip re-init (fast path).
 *   - saveDb() writes to /tmp which is ephemeral but available within an
 *     invocation. We keep it so the write-path code paths don't throw.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../src/app.js";
import { initDbConnection } from "../src/db/connection.js";
import { initDb } from "../src/db/schema.js";
import { getLeadCount } from "../src/repositories/leadRepository.js";
import { seedLeads } from "../src/db/seed.js";
import type { Express } from "express";

// Module-level singleton — survives across warm Vercel invocations.
let app: Express | null = null;

async function getApp(): Promise<Express> {
  if (app) return app;

  // 1. Init the in-memory SQLite database (no disk path needed on Vercel).
  await initDbConnection();

  // 2. Create tables and seed reference data (lead_statuses etc.).
  initDb();

  // 3. Auto-seed synthetic leads when the DB is empty (every cold start on Vercel
  //    since the filesystem is ephemeral — the in-memory DB starts blank).
  const count = getLeadCount();
  if (count === 0) {
    seedLeads();
  }

  // 4. Build the Express app (registers routes, CORS, error handler).
  app = createApp();
  return app;
}

// Vercel serverless handler — called for every request.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressApp = await getApp();
  // Delegate to Express — it handles routing, params, response, etc.
  expressApp(req as any, res as any);
}
