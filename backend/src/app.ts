import express from "express";
import routes from "./routes";
import {
  errorHandler,
  unknownEndpoint,
} from "./middleware/errorHandler";

const app = express();

app.use(express.json({ limit: "100kb" }));

app.use("/api", routes);

app.use(unknownEndpoint);
app.use(errorHandler);

export default app;
