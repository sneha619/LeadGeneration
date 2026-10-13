import { createApp } from "./app.js";
import config from "./config/env.js";
import { initDbConnection } from "./db/connection.js";
import { initDb } from "./db/schema.js";

async function main() {
  await initDbConnection();
  initDb();

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
