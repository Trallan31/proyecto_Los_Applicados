import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import bcrypt from "bcrypt";
import supertest from "supertest";
import app from "../src/app";
import Course from "../src/models/course";
import User from "../src/models/user";
import {
  connectTestDb,
  disconnectTestDb,
  extractSessionHeaders,
  registerTestUser,
  resetTestDb,
} from "./helpers/testDb";

describe("Autenticación y protección CSRF (/api/auth)", () => {
  before(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  after(async () => {
    await disconnectTestDb();
  });

  describe("Registro (POST /api/auth/register)", () => {
    it("crea usuario válido, normaliza correo, omite passwordHash/_id y emite cookie HttpOnly y X-CSRF-Token", async () => {
      const payload = {
        username: "  lucia.gomez  ",
        name: "Lucia",
        lastName: "Gomez",
        mail: "  Lucia.Gomez@Ejemplo.COM  ",
        password: "ClaveSegura123",
      };

      const response = await supertest(app)
        .post("/api/auth/register")
        .send(payload);

      assert.equal(response.status, 201);
      assert.equal(response.body.id, "user-lucia.gomez");
      assert.equal(response.body.username, "lucia.gomez");
      assert.equal(response.body.name, "Lucia");
      assert.equal(response.body.lastName, "Gomez");
      assert.equal(response.body.mail, "lucia.gomez@ejemplo.com");
      assert.equal(response.body.initials, "LG");
      assert.match(response.body.avatarColor, /^#[0-9a-f]{6}$/i);
      assert.equal("passwordHash" in response.body, false);
      assert.equal("_id" in response.body, false);

      const { cookie, csrfToken } = extractSessionHeaders(response);
      assert.ok(cookie.startsWith("token="));
      assert.ok(csrfToken.length > 0);

      const rawCookies = response.headers["set-cookie"];
      const setCookies = Array.isArray(rawCookies)
        ? rawCookies
        : [String(rawCookies)];
      const tokenHeader = setCookies.find((item) =>
        item.startsWith("token=")
      );
      assert.ok(tokenHeader);
      assert.match(tokenHeader, /HttpOnly/i);
      assert.match(tokenHeader, /SameSite=Strict/i);
      assert.match(tokenHeader, /Path=\/(?:;|$)/i);

      const storedUser = await User.findById("user-lucia.gomez").select(
        "+passwordHash"
      );
      assert.ok(storedUser);
      assert.ok(storedUser.passwordHash);
      assert.notEqual(storedUser.passwordHash, payload.password);
      assert.equal(
        await bcrypt.compare(payload.password, storedUser.passwordHash),
        true
      );
    });

    it("rechaza con 400 cuando faltan campos obligatorios o están vacíos", async () => {
      const invalidPayloads = [
        {
          name: "Lucia",
          lastName: "Gomez",
          mail: "lucia@ejemplo.com",
          password: "ClaveSegura123",
        },
        {
          username: "   ",
          name: "Lucia",
          lastName: "Gomez",
          mail: "lucia@ejemplo.com",
          password: "ClaveSegura123",
        },
        {
          username: "lucia.gomez",
          name: "",
          lastName: "Gomez",
          mail: "lucia@ejemplo.com",
          password: "ClaveSegura123",
        },
        {
          username: "lucia.gomez",
          name: "Lucia",
          lastName: "   ",
          mail: "lucia@ejemplo.com",
          password: "ClaveSegura123",
        },
        {
          username: "lucia.gomez",
          name: "Lucia",
          lastName: "Gomez",
          mail: "",
          password: "ClaveSegura123",
        },
        {
          username: "lucia.gomez",
          name: "Lucia",
          lastName: "Gomez",
          mail: "lucia@ejemplo.com",
        },
        {
          username: "lucia.gomez",
          name: "Lucia",
          lastName: "Gomez",
          mail: "lucia@ejemplo.com",
          password: "",
        },
      ];

      for (const payload of invalidPayloads) {
        const response = await supertest(app)
          .post("/api/auth/register")
          .send(payload);
        assert.equal(response.status, 400);
        assert.equal(typeof response.body.error, "string");
      }
    });

    it("rechaza con 400 formatos inválidos de username, correo, contraseña o cuerpo no objeto", async () => {
      const invalidCases = [
        {
          username: "ab",
          name: "Lucia",
          lastName: "Gomez",
          mail: "lucia@ejemplo.com",
          password: "ClaveSegura123",
        },
        {
          username: "usuario con espacios",
          name: "Lucia",
          lastName: "Gomez",
          mail: "lucia@ejemplo.com",
          password: "ClaveSegura123",
        },
        {
          username: "usuario_demasiado_largo_21",
          name: "Lucia",
          lastName: "Gomez",
          mail: "lucia@ejemplo.com",
          password: "ClaveSegura123",
        },
        {
          username: "lucia.gomez",
          name: "Lucia",
          lastName: "Gomez",
          mail: "correo-invalido",
          password: "ClaveSegura123",
        },
        {
          username: "lucia.gomez",
          name: "Lucia",
          lastName: "Gomez",
          mail: "lucia@ejemplo.com",
          password: "1234567",
        },
        {
          username: "lucia.gomez",
          name: "Lucia",
          lastName: "Gomez",
          mail: "lucia@ejemplo.com",
          password: "        ",
        },
        {
          username: "lucia.gomez",
          name: "Lucia",
          lastName: "Gomez",
          mail: "lucia@ejemplo.com",
          password: "a".repeat(73),
        },
        {
          username: "lucia.gomez",
          name: "Lucia",
          lastName: "Gomez",
          mail: "lucia@ejemplo.com",
          password: "ñ".repeat(37),
        },
      ];

      for (const payload of invalidCases) {
        const response = await supertest(app)
          .post("/api/auth/register")
          .send(payload);
        assert.equal(response.status, 400);
        assert.equal(typeof response.body.error, "string");
      }

      const arrayBodyResponse = await supertest(app)
        .post("/api/auth/register")
        .send(["no", "objeto"]);
      assert.equal(arrayBodyResponse.status, 400);
      assert.equal(
        arrayBodyResponse.body.error,
        "El cuerpo debe ser un objeto JSON."
      );
    });

    it("rechaza con 409 cuando username o mail ya están registrados", async () => {
      await registerTestUser({
        username: "lucia.gomez",
        mail: "lucia.gomez@ejemplo.com",
      });

      const duplicateUsername = await supertest(app)
        .post("/api/auth/register")
        .send({
          username: "lucia.gomez",
          name: "Otra",
          lastName: "Persona",
          mail: "otra.persona@ejemplo.com",
          password: "ClaveSegura123",
        });
      assert.equal(duplicateUsername.status, 409);
      assert.equal(
        duplicateUsername.body.error,
        "Ese usuario ya está registrado."
      );

      const duplicateMail = await supertest(app)
        .post("/api/auth/register")
        .send({
          username: "otra.persona",
          name: "Otra",
          lastName: "Persona",
          mail: "LUCIA.GOMEZ@EJEMPLO.COM",
          password: "ClaveSegura123",
        });
      assert.equal(duplicateMail.status, 409);
      assert.equal(
        duplicateMail.body.error,
        "Ese correo ya está registrado."
      );
    });
  });

  describe("Inicio de sesión (POST /api/auth/login)", () => {
    it("inicia sesión con username (incluyendo espacios alrededor) o correo en mayúsculas/mixto", async () => {
      await registerTestUser({
        username: "camila.soto",
        mail: "camila.soto@ejemplo.com",
        password: "ClaveLogin123",
      });

      const loginByUsername = await supertest(app)
        .post("/api/auth/login")
        .send({
          username: "  camila.soto  ",
          password: "ClaveLogin123",
        });

      assert.equal(
        loginByUsername.status,
        200,
        `Se esperaba 200 al iniciar sesión por usuario: ${JSON.stringify(loginByUsername.body)}`
      );
      assert.equal(loginByUsername.body.id, "user-camila.soto");
      assert.equal("passwordHash" in loginByUsername.body, false);
      assert.equal("_id" in loginByUsername.body, false);
      extractSessionHeaders(loginByUsername);

      const loginByMail = await supertest(app)
        .post("/api/auth/login")
        .send({
          username: "  CaMiLa.SoTo@EJEMPLO.COM ",
          password: "ClaveLogin123",
        });

      assert.equal(
        loginByMail.status,
        200,
        `Se esperaba 200 al iniciar sesión por correo: ${JSON.stringify(loginByMail.body)}`
      );
      assert.equal(loginByMail.body.id, "user-camila.soto");
      extractSessionHeaders(loginByMail);
    });

    it("responde 401 ante contraseña incorrecta o usuario inexistente", async () => {
      await registerTestUser({
        username: "tomas.vera",
        mail: "tomas.vera@ejemplo.com",
        password: "ClaveCorrecta123",
      });

      const wrongPassword = await supertest(app)
        .post("/api/auth/login")
        .send({
          username: "tomas.vera",
          password: "ClaveIncorrecta123",
        });
      assert.equal(wrongPassword.status, 401);
      assert.equal(
        wrongPassword.body.error,
        "Usuario o contraseña incorrectos."
      );

      const unknownUser = await supertest(app)
        .post("/api/auth/login")
        .send({
          username: "no.existe",
          password: "ClaveCorrecta123",
        });
      assert.equal(unknownUser.status, 401);
      assert.equal(
        unknownUser.body.error,
        "Usuario o contraseña incorrectos."
      );
      assert.equal(wrongPassword.body.error, unknownUser.body.error);
    });

    it("responde 400 cuando faltan credenciales o están vacías", async () => {
      const invalidBodies = [
        {},
        { username: "   ", password: "ClaveLogin123" },
        { username: "camila.soto", password: "" },
        { username: "camila.soto" },
        { password: "ClaveLogin123" },
      ];

      for (const body of invalidBodies) {
        const response = await supertest(app)
          .post("/api/auth/login")
          .send(body);
        assert.equal(response.status, 400);
      }
    });
  });

  describe("Sesión actual (GET /api/auth/me) y protección CSRF", () => {
    it("devuelve 200 con perfil público cuando la cookie y X-CSRF-Token son válidos", async () => {
      const { user, cookie, csrfToken } = await registerTestUser();

      const response = await supertest(app)
        .get("/api/auth/me")
        .set("Cookie", cookie)
        .set("X-CSRF-Token", csrfToken);

      assert.equal(response.status, 200);
      assert.deepEqual(response.body, user);
      assert.equal("passwordHash" in response.body, false);
      assert.equal("_id" in response.body, false);
    });

    it("responde 401 sin cookie, sin X-CSRF-Token o con X-CSRF-Token incorrecto", async () => {
      const { cookie, csrfToken } = await registerTestUser();

      const withoutCookie = await supertest(app)
        .get("/api/auth/me")
        .set("X-CSRF-Token", csrfToken);
      assert.equal(withoutCookie.status, 401);

      const withoutCsrf = await supertest(app)
        .get("/api/auth/me")
        .set("Cookie", cookie);
      assert.equal(withoutCsrf.status, 401);

      const wrongCsrf = await supertest(app)
        .get("/api/auth/me")
        .set("Cookie", cookie)
        .set("X-CSRF-Token", "token-csrf-invalido");
      assert.equal(wrongCsrf.status, 401);
    });

    it("responde 401 cuando el token está manipulado o el usuario ya no existe en BD", async () => {
      const { user, cookie, csrfToken } = await registerTestUser();

      const tokenValue = cookie.slice("token=".length);
      const segments = tokenValue.split(".");
      assert.equal(segments.length, 3);
      const lastChar = segments[2].slice(-1);
      const alteredChar = lastChar === "a" ? "b" : "a";
      const tamperedCookie = `token=${segments[0]}.${segments[1]}.${segments[2].slice(0, -1)}${alteredChar}`;

      const tamperedResponse = await supertest(app)
        .get("/api/auth/me")
        .set("Cookie", tamperedCookie)
        .set("X-CSRF-Token", csrfToken);
      assert.equal(tamperedResponse.status, 401);

      await User.deleteOne({ _id: user.id });

      const missingUserResponse = await supertest(app)
        .get("/api/auth/me")
        .set("Cookie", cookie)
        .set("X-CSRF-Token", csrfToken);
      assert.equal(missingUserResponse.status, 401);
    });

    it("protege rutas de recursos (POST /api/courses) exigiendo X-CSRF-Token", async () => {
      const { user, cookie, csrfToken } = await registerTestUser();
      const coursePayload = {
        name: "Bases de Datos",
        code: "CC3201",
        shortName: "BD",
        color: "#4f7cff",
      };

      const rejected = await supertest(app)
        .post("/api/courses")
        .set("Cookie", cookie)
        .send(coursePayload);
      assert.equal(rejected.status, 401);
      assert.equal(await Course.countDocuments(), 0);

      const created = await supertest(app)
        .post("/api/courses")
        .set("Cookie", cookie)
        .set("X-CSRF-Token", csrfToken)
        .send(coursePayload);
      assert.equal(created.status, 201);
      assert.equal(created.body.userId, user.id);
      assert.equal(created.body.name, "Bases de Datos");
      assert.equal(await Course.countDocuments(), 1);
    });
  });

  describe("Cierre de sesión (POST /api/auth/logout)", () => {
    it("responde 204, limpia la cookie token e invalida llamadas posteriores del agente", async () => {
      const agent = supertest.agent(app);

      const registerResponse = await agent
        .post("/api/auth/register")
        .send({
          username: "mateo.diaz",
          name: "Mateo",
          lastName: "Diaz",
          mail: "mateo.diaz@ejemplo.com",
          password: "ClaveLogout123",
        });
      assert.equal(registerResponse.status, 201);

      const { csrfToken } = extractSessionHeaders(registerResponse);

      const meBeforeLogout = await agent
        .get("/api/auth/me")
        .set("X-CSRF-Token", csrfToken);
      assert.equal(meBeforeLogout.status, 200);

      const logoutResponse = await agent.post("/api/auth/logout");
      assert.equal(logoutResponse.status, 204);
      assert.equal(logoutResponse.text, "");

      const rawSetCookie = logoutResponse.headers["set-cookie"];
      const setCookies = Array.isArray(rawSetCookie)
        ? rawSetCookie
        : [String(rawSetCookie)];
      const clearedCookie = setCookies.find((item) =>
        item.startsWith("token=")
      );
      assert.ok(clearedCookie);
      assert.match(clearedCookie, /^token=;/);

      const meAfterLogout = await agent
        .get("/api/auth/me")
        .set("X-CSRF-Token", csrfToken);
      assert.equal(meAfterLogout.status, 401);
    });
  });
});
