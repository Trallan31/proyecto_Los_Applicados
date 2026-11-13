import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import {
  errorHandler,
  unknownEndpoint,
} from "./middleware/errorHandler";
import { apiRateLimiter } from "./middleware/rateLimit";
import routes from "./routes";
import authRouter from "./routes/auth";
import testingRouter from "./routes/testing";
import {
  getClientOrigin,
  isProductionEnv,
  isTestEnv,
} from "./utils/config";

const app = express();

if (isProductionEnv()) {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, !origin || origin === getClientOrigin());
    },
    credentials: true,
    exposedHeaders: ["X-CSRF-Token"],
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", (_request, response) => {
  const connected = mongoose.connection.readyState === 1;
  response.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "error",
    db: connected ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRouter);
if (isTestEnv()) {
  app.use("/api/testing", testingRouter);
} else {
  app.use("/api/testing", unknownEndpoint);
}
app.use("/api", apiRateLimiter, routes);

app.use(unknownEndpoint);
app.use(errorHandler);

export default app;
