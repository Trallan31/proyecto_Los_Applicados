import "dotenv/config";
import mongoose from "mongoose";
import app from "./app";

async function startServer(): Promise<void> {
  const mongodbUri = process.env.MONGODB_URI;
  const port = Number(process.env.PORT ?? 3001);
  if (!mongodbUri) {
    throw new Error("Falta MONGODB_URI en el archivo .env.");
  }
  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error("PORT debe ser un puerto válido.");
  }
  await mongoose.connect(mongodbUri);

  console.log("Conexión con MongoDB establecida.");

  const server = app.listen(port, () => {
    console.log(`API disponible en http://localhost:${port}/api`);
  });

  server.on("error", (error) => {
    console.error("No se pudo iniciar el servidor:", error.message);
    void mongoose.disconnect().finally(() => {
      process.exitCode = 1;
    });
  });
}

startServer().catch((error: unknown) => {
  console.error(
    "No se pudo iniciar la aplicación:",
    error instanceof Error ? error.message : "Error desconocido"
  );
  process.exitCode = 1;
});
