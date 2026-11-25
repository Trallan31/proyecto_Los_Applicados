import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";

const envPath = resolve(__dirname, "../../.env");
if (existsSync(envPath)) {
  dotenv.config({ path: envPath, quiet: true });
}

const DEFAULT_PORT = 3001;
const DEFAULT_CLIENT_ORIGIN = "http://localhost:5173";
const MIN_JWT_SECRET_LENGTH = 16;
const MONGO_URI_DATABASE_REGEX =
  /^mongodb(?:\+srv)?:\/\/[^/?#]+(?:\/([^?#]*))?/i;

function extractMongoDatabaseName(uri: string): string | null {
  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname.replace(/^\/+|\/+$/g, "");
    return dbName || null;
  } catch {
    const match = MONGO_URI_DATABASE_REGEX.exec(uri);
    const dbName = match?.[1]?.replace(/^\/+|\/+$/g, "");
    return dbName || null;
  }
}

/** Indica si la aplicación se ejecuta en el entorno de pruebas. */
export function isTestEnv(): boolean {
  return process.env.NODE_ENV === "test";
}

/** Indica si la aplicación se ejecuta en el entorno de producción. */
export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Devuelve el puerto HTTP validado (1..65535). */
export function getPort(): number {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT debe ser un puerto válido.");
  }
  return port;
}

export function getHost(): string {
  return process.env.HOST ?? '0.0.0.0';
}

export function getDBName(): string {
  const dbName = !isTestEnv() ? process.env.MONGODB_DBNAME?.trim() : process.env.TEST_MONGODB_DBNAME?.trim()
  if (!dbName) {
    throw new Error("Falta nombre de la base de datos");
  }
  return dbName;
}

/** Devuelve el secreto JWT validando que exista y tenga al menos 16 caracteres. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("Falta JWT_SECRET en la configuración de entorno.");
  }
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET debe tener al menos ${MIN_JWT_SECRET_LENGTH} caracteres.`
    );
  }
  return secret;
}

/**
 * Devuelve la URI de MongoDB según el entorno.
 * En pruebas exige TEST_MONGODB_URI y verifica que no apunte a la base de desarrollo.
 */
export function getMongodbUri(): string {
  const devUri = process.env.MONGODB_URI?.trim();

  if (isTestEnv()) {
    const testUri = process.env.TEST_MONGODB_URI?.trim();
    if (!testUri) {
      throw new Error(
        "Falta TEST_MONGODB_URI para ejecutar en entorno de pruebas."
      );
    }

    if (devUri) {
      const testDbName = extractMongoDatabaseName(testUri);
      const devDbName = extractMongoDatabaseName(devUri);

      if (
        testUri === devUri ||
        (testDbName && devDbName && testDbName === devDbName)
      ) {
        throw new Error(
          "TEST_MONGODB_URI no puede apuntar a la misma base de datos que MONGODB_URI."
        );
      }
    }

    return testUri;
  }

  if (!devUri) {
    throw new Error("Falta MONGODB_URI en la configuración de entorno.");
  }

  return devUri;
}

/** Devuelve el origen permitido del cliente frontend. */
export function getClientOrigin(): string {
  return process.env.CLIENT_ORIGIN?.trim() || DEFAULT_CLIENT_ORIGIN;
}
