import assert from "node:assert/strict";
import mongoose from "mongoose";
import supertest, { type Response } from "supertest";
import app from "../../src/app";
import { clearTestCollections, testModels } from "../../src/routes/testing";
import { getMongodbUri, isTestEnv } from "../../src/utils/config";

export interface SessionHeaders {
  cookie: string;
  csrfToken: string;
}

export interface PublicTestUser {
  id: string;
  username: string;
  name: string;
  lastName: string;
  mail: string;
  initials: string;
  avatarColor: string;
}

export interface RegisterTestUserOverrides {
  username?: string;
  name?: string;
  lastName?: string;
  mail?: string;
  password?: string;
}

export interface RegisteredTestUser extends SessionHeaders {
  user: PublicTestUser;
}

let testUserSequence = 0;

/**
 * Conecta Mongoose a la base de datos de pruebas y sincroniza los índices
 * de los modelos antes de ejecutar los casos.
 */
export async function connectTestDb(): Promise<void> {
  assert.ok(
    isTestEnv(),
    "Las pruebas solo pueden ejecutarse con NODE_ENV=test."
  );

  const mongodbUri = getMongodbUri();
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongodbUri);
  }

  await Promise.all(testModels.map((model) => model.syncIndexes()));
}

/** Elimina todos los documentos de las siete colecciones en la base de pruebas. */
export async function resetTestDb(): Promise<void> {
  assert.ok(
    isTestEnv(),
    "Solo se puede limpiar la BD en entorno de pruebas."
  );
  getMongodbUri();
  await clearTestCollections();
}

/** Cierra la conexión de Mongoose si sigue activa. */
export async function disconnectTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

/**
 * Extrae la cookie de sesión `token` y el encabezado `X-CSRF-Token`
 * desde una respuesta HTTP de autenticación.
 */
export function extractSessionHeaders(response: Response): SessionHeaders {
  const rawSetCookie = response.headers["set-cookie"];
  const setCookies = Array.isArray(rawSetCookie)
    ? rawSetCookie
    : typeof rawSetCookie === "string"
      ? [rawSetCookie]
      : [];

  const tokenEntry = setCookies.find((entry) =>
    entry.startsWith("token=")
  );
  assert.ok(
    tokenEntry,
    "La respuesta debe incluir la cookie token en Set-Cookie."
  );

  const cookie = tokenEntry.split(";")[0];
  assert.ok(
    cookie.length > "token=".length,
    "La cookie token no puede estar vacía."
  );

  const rawCsrf = response.headers["x-csrf-token"];
  const csrfToken = Array.isArray(rawCsrf) ? rawCsrf[0] : rawCsrf;
  assert.ok(
    typeof csrfToken === "string" && csrfToken.length > 0,
    "La respuesta debe incluir el encabezado X-CSRF-Token."
  );

  return { cookie, csrfToken };
}

/**
 * Registra un usuario único vía `POST /api/auth/register` y devuelve
 * su perfil público junto con la cookie y el token CSRF de la sesión.
 */
export async function registerTestUser(
  overrides: RegisterTestUserOverrides = {}
): Promise<RegisteredTestUser> {
  testUserSequence += 1;
  const suffix = `${Date.now().toString(36).slice(-5)}${testUserSequence}`;
  const payload = {
    username: overrides.username ?? `u_${suffix}`,
    name: overrides.name ?? "Sofía",
    lastName: overrides.lastName ?? "Mendoza",
    mail: overrides.mail ?? `sofia.${suffix}@ejemplo.com`,
    password: overrides.password ?? "ClaveSegura123",
  };

  const response = await supertest(app)
    .post("/api/auth/register")
    .send(payload);

  assert.equal(
    response.status,
    201,
    `Se esperaba estado 201 al registrar usuario de prueba, se recibió ${response.status}.`
  );

  const { cookie, csrfToken } = extractSessionHeaders(response);
  return {
    user: response.body as PublicTestUser,
    cookie,
    csrfToken,
  };
}
