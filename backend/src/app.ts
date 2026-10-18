import express from "express";
import cookieParser from "cookie-parser";
import routes from "./routes";
import authRouter from "./routes/auth";
import {
  errorHandler,
  unknownEndpoint,
} from "./middleware/errorHandler";

const app = express();

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api", routes);

app.use(unknownEndpoint);
app.use(errorHandler);

export default app;
