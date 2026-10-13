import { Router } from "express";
import config from "../config/env.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "saasquatch-lead-intelligence",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

export default router;
