import mongoose from "mongoose";
import app from "./app";
import { getMongodbUri, getPort } from "./utils/config";
import { logger } from "./utils/logger";

async function startServer(): Promise<void> {
  const mongodbUri = getMongodbUri();
  const port = getPort();
  await mongoose.connect(mongodbUri);

  logger.info("Conexión con MongoDB establecida.");

  const server = app.listen(port, () => {
    logger.info(`API disponible en http://localhost:${port}/api`);
  });

  server.on("error", (error) => {
    logger.error("No se pudo iniciar el servidor:", error.message);
    void mongoose.disconnect().finally(() => {
      process.exitCode = 1;
    });
  });
}

startServer().catch((error: unknown) => {
  logger.error(
    "No se pudo iniciar la aplicación:",
    error instanceof Error ? error.message : "Error desconocido"
  );
  process.exitCode = 1;
});
