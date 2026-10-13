import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import config from "./config/env.js";
import healthRouter from "./routes/health.js";
import leadsRouter from "./routes/leads.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin, credentials: true }));
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
