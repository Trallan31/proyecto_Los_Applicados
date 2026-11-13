import express from "express";
import cookieParser from "cookie-parser";
import routes from "./routes";
import authRouter from "./routes/auth";
import testingRouter from "./routes/testing";
import {
  errorHandler,
  unknownEndpoint,
} from "./middleware/errorHandler";
import { isTestEnv } from "./utils/config";

const app = express();

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
if (isTestEnv()) {
  app.use("/api/testing", testingRouter);
} else {
  app.use("/api/testing", unknownEndpoint);
}
app.use("/api", routes);

app.use(unknownEndpoint);
app.use(errorHandler);

export default app;
