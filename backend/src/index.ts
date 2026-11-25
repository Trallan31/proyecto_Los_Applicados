import mongoose from "mongoose";
import app from "./app";
import { getDBName, getHost, getMongodbUri, getPort } from "./utils/config";
import { logger } from "./utils/logger";

async function startServer(): Promise<void> {
  const mongodbUri = getMongodbUri();
  const port = getPort();
  const host = getHost();
  const dbName = getDBName();
  await mongoose.connect(mongodbUri, { dbName: dbName}).catch(error => console.error('Error al conectar con la base de datos: ', error.message));

  logger.info(`Conexión con MongoDB establecida en ${dbName}.`);

  const server = app.listen(port, host, () => {
    logger.info(`API disponible en http://${host}:${port}/`);
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
