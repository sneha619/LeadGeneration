import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = err.status ?? 500;
  const message = nodeEnvMessage(err);

  console.error(`[errorHandler] ${statusCode} - ${err.message}`);

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

function nodeEnvMessage(err: Error & { status?: number; message: string }): string {
  if (process.env.NODE_ENV === "production" && err.status && err.status >= 500) {
    return "Internal Server Error";
  }
  return err.message ?? "Internal Server Error";
}
