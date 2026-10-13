import { createApp } from "./app.js";
import config from "./config/env.js";
import { initDbConnection } from "./db/connection.js";
import { initDb } from "./db/schema.js";
import { getLeadCount } from "./repositories/leadRepository.js";
import { seedLeads } from "./db/seed.js";

async function main() {
  await initDbConnection();
  initDb();

  // Auto-seed when the database is empty (handles ephemeral hosts like Render free tier
  // where the filesystem resets on every deploy/restart).
  const count = getLeadCount();
  if (count === 0) {
    console.log("[server] No leads found — seeding database with synthetic data...");
    seedLeads();
    console.log("[server] Seed complete.");
  } else {
    console.log(`[server] Database ready with ${count} leads.`);
  }

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`[server] SaaSquatch Lead Intelligence API running on http://localhost:${config.port}`);
    console.log(`[server] Environment: ${config.nodeEnv}`);
  });
}

main().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});
