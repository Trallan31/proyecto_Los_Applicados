import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import supertest from "supertest";
import app from "../src/app";
import User from "../src/models/user";
import {
  connectTestDb,
  disconnectTestDb,
  registerTestUser,
  resetTestDb,
  type RegisteredTestUser,
} from "./helpers/testDb";

interface UserResponseItem {
  id: string;
  username: string;
  name: string;
  lastName: string;
  initials: string;
  avatarColor: string;
  mail?: string;
  passwordHash?: string;
  tokenVersion?: number;
  _id?: string;
  __v?: number;
}

/**
 * Ejecuta una petición GET autenticada con la cookie y el token CSRF de la sesión dada.
 */
function authenticatedGet(
  url: string,
  session: Pick<RegisteredTestUser, "cookie" | "csrfToken">
) {
  return supertest(app)
    .get(url)
    .set("Cookie", session.cookie)
    .set("X-CSRF-Token", session.csrfToken);
}

describe("Listado y búsqueda de usuarios (GET /api/users)", () => {
  before(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  after(async () => {
    await disconnectTestDb();
  });

  describe("Autenticación y protección CSRF", () => {
    it("rechaza la petición con 401 si no se envía cookie de sesión ni CSRF", async () => {
      const response = await supertest(app).get("/api/users");

      assert.equal(response.status, 401);
      assert.equal(
        typeof (response.body as { error?: unknown }).error,
        "string"
      );
    });

    it("rechaza la petición con 401 si falta el encabezado X-CSRF-Token", async () => {
      const session = await registerTestUser();

      const response = await supertest(app)
        .get("/api/users")
        .set("Cookie", session.cookie);

      assert.equal(response.status, 401);
      assert.equal(
        typeof (response.body as { error?: unknown }).error,
        "string"
      );
    });

    it("permite el acceso con cookie de sesión válida y encabezado X-CSRF-Token", async () => {
      const session = await registerTestUser();

      const response = await authenticatedGet("/api/users", session);

      assert.equal(response.status, 200);
      assert.ok(Array.isArray(response.body));
      assert.ok(response.body.length >= 1);
    });
  });

  describe("Exclusión de PII y estructura de respuesta", () => {
    it("devuelve los usuarios con campos públicos y excluye estrictamente mail, passwordHash, tokenVersion, _id y __v", async () => {
      const session = await registerTestUser({
        username: "sofia_dev",
        name: "Sofia",
        lastName: "Mendoza",
        mail: "sofia.privado@ejemplo.com",
      });

      await registerTestUser({
        username: "martin_qa",
        name: "Martin",
        lastName: "Rivas",
        mail: "martin.privado@ejemplo.com",
      });

      const response = await authenticatedGet("/api/users", session);

      assert.equal(response.status, 200);
      assert.ok(Array.isArray(response.body));
      assert.equal(response.body.length, 2);

      for (const item of response.body as UserResponseItem[]) {
        assert.ok(typeof item.id === "string" && item.id.length > 0);
        assert.ok(typeof item.username === "string" && item.username.length > 0);
        assert.ok(typeof item.name === "string" && item.name.length > 0);
        assert.ok(typeof item.lastName === "string" && item.lastName.length > 0);
        assert.ok(typeof item.initials === "string" && item.initials.length > 0);
        assert.match(item.avatarColor, /^#[0-9a-f]{6}$/i);

        // Exclusión estricta de información sensible o metadatos internos
        assert.equal(
          Object.hasOwn(item, "mail"),
          false,
          `El usuario ${item.username} no debe incluir el campo mail.`
        );
        assert.equal(
          Object.hasOwn(item, "passwordHash"),
          false,
          `El usuario ${item.username} no debe incluir passwordHash.`
        );
        assert.equal(
          Object.hasOwn(item, "tokenVersion"),
          false,
          `El usuario ${item.username} no debe incluir tokenVersion.`
        );
        assert.equal(
          Object.hasOwn(item, "_id"),
          false,
          `El usuario ${item.username} no debe incluir _id.`
        );
        assert.equal(
          Object.hasOwn(item, "__v"),
          false,
          `El usuario ${item.username} no debe incluir __v.`
        );
      }
    });

    it("mantiene el campo mail en GET /api/auth/me para el perfil del usuario autenticado", async () => {
      const session = await registerTestUser({
        username: "camila_propia",
        name: "Camila",
        lastName: "Navarro",
        mail: "camila.propia@ejemplo.com",
      });

      // El listado general en /api/users debe omitir mail
      const usersResponse = await authenticatedGet("/api/users", session);
      assert.equal(usersResponse.status, 200);
      const foundInList = (usersResponse.body as UserResponseItem[]).find(
        (u) => u.username === "camila_propia"
      );
      assert.ok(foundInList, "El usuario debe aparecer en el listado general.");
      assert.equal(
        Object.hasOwn(foundInList, "mail"),
        false,
        "El listado general no debe contener mail."
      );

      // GET /api/auth/me del usuario autenticado sí debe incluir mail
      const meResponse = await supertest(app)
        .get("/api/auth/me")
        .set("Cookie", session.cookie);

      assert.equal(meResponse.status, 200);
      assert.equal(
        (meResponse.body as { mail?: unknown }).mail,
        "camila.propia@ejemplo.com"
      );
      assert.equal(
        Object.hasOwn(meResponse.body as object, "mail"),
        true,
        "El perfil propio en /api/auth/me sí debe incluir mail."
      );
    });
  });

  describe("Búsqueda con parámetro ?q=", () => {
    it("filtra de forma case-insensitive y tolerando espacios por coincidencia parcial en username, name o lastName", async () => {
      const session = await registerTestUser({
        username: "alicia_dev",
        name: "Alicia",
        lastName: "Fernandez",
      });
      await registerTestUser({
        username: "bernardo_b",
        name: "Bernardo",
        lastName: "Alvarez",
      });
      await registerTestUser({
        username: "camilo_x",
        name: "Camilo",
        lastName: "Zuniga",
      });

      // Coincidencia por username / name con mayúsculas y espacios
      const resAlicia = await authenticatedGet("/api/users?q=  ALICIA  ", session);
      assert.equal(resAlicia.status, 200);
      assert.equal((resAlicia.body as UserResponseItem[]).length, 1);
      assert.equal((resAlicia.body as UserResponseItem[])[0].username, "alicia_dev");

      // Coincidencia parcial por apellido
      const resAlvarez = await authenticatedGet("/api/users?q=alva", session);
      assert.equal(resAlvarez.status, 200);
      assert.equal((resAlvarez.body as UserResponseItem[]).length, 1);
      assert.equal((resAlvarez.body as UserResponseItem[])[0].username, "bernardo_b");

      // Coincidencia parcial por subcadena en username
      const resDev = await authenticatedGet("/api/users?q=dev", session);
      assert.equal(resDev.status, 200);
      assert.equal((resDev.body as UserResponseItem[]).length, 1);
      assert.equal((resDev.body as UserResponseItem[])[0].username, "alicia_dev");

      // Coincidencia parcial por subcadena en nombre
      const resMilo = await authenticatedGet("/api/users?q=milo", session);
      assert.equal(resMilo.status, 200);
      assert.equal((resMilo.body as UserResponseItem[]).length, 1);
      assert.equal((resMilo.body as UserResponseItem[])[0].username, "camilo_x");
    });

    it("NO coincide por mail cuando el término buscado existe únicamente en el correo", async () => {
      const session = await registerTestUser({
        username: "mateo_r",
        name: "Mateo",
        lastName: "Rios",
        mail: "tokensecreto123@ejemplo.com",
      });
      await registerTestUser({
        username: "valentina_v",
        name: "Valentina",
        lastName: "Vega",
        mail: "valen.vega@otrodominio.com",
      });

      // Búsqueda por token que existe únicamente en el mail de Mateo
      const resToken = await authenticatedGet(
        "/api/users?q=tokensecreto123",
        session
      );
      assert.equal(resToken.status, 200);
      assert.deepEqual(resToken.body, []);

      // Búsqueda por dominio de correo exclusivo
      const resDomain = await authenticatedGet(
        "/api/users?q=otrodominio",
        session
      );
      assert.equal(resDomain.status, 200);
      assert.deepEqual(resDomain.body, []);
    });

    it("escapa metacaracteres de expresión regular y no falla con 500 ni interpreta comodines regex", async () => {
      const session = await registerTestUser({
        username: "user.dot",
        name: "Carlos.Eduardo",
        lastName: "Perez",
      });
      await registerTestUser({
        username: "user_plus",
        name: "Ana+Maria",
        lastName: "Gomez",
      });
      await registerTestUser({
        username: "user_normal",
        name: "Lucia",
        lastName: "Diaz",
      });

      // El punto '.' no debe ser interpretado como comodín regex que coincida con todos los usuarios
      const resDot = await authenticatedGet("/api/users?q=.", session);
      assert.equal(resDot.status, 200);
      const usernamesWithDot = (resDot.body as UserResponseItem[]).map(
        (u) => u.username
      );
      assert.deepEqual(usernamesWithDot, ["user.dot"]);

      // Caracteres especiales que romperían un RegExp no escapado ('*', '(', '[')
      const resAsterisk = await authenticatedGet("/api/users?q=*", session);
      assert.equal(resAsterisk.status, 200);
      assert.deepEqual(resAsterisk.body, []);

      const resParen = await authenticatedGet("/api/users?q=(test", session);
      assert.equal(resParen.status, 200);
      assert.deepEqual(resParen.body, []);

      const resComplex = await authenticatedGet(
        "/api/users?q=(test)+[1]",
        session
      );
      assert.equal(resComplex.status, 200);
      assert.deepEqual(resComplex.body, []);

      // Búsqueda con comodín '.*' no debe coincidir si la cadena literal no está presente
      const resWildcard = await authenticatedGet(
        "/api/users?q=Carlos.*",
        session
      );
      assert.equal(resWildcard.status, 200);
      assert.deepEqual(resWildcard.body, []);
    });

    it("devuelve el listado sin filtrar cuando ?q= está vacío o contiene solo espacios", async () => {
      const session = await registerTestUser({
        username: "usuario_uno",
        name: "Usuario",
        lastName: "Uno",
      });
      await registerTestUser({
        username: "usuario_dos",
        name: "Usuario",
        lastName: "Dos",
      });

      const resEmpty = await authenticatedGet("/api/users?q=", session);
      assert.equal(resEmpty.status, 200);
      assert.equal((resEmpty.body as UserResponseItem[]).length, 2);

      const resSpaces = await authenticatedGet("/api/users?q=   ", session);
      assert.equal(resSpaces.status, 200);
      assert.equal((resSpaces.body as UserResponseItem[]).length, 2);
    });

    it("responde 400 con { error } cuando ?q= supera los 100 caracteres", async () => {
      const session = await registerTestUser();
      const longQ = "a".repeat(101);
      const response = await authenticatedGet(`/api/users?q=${longQ}`, session);

      assert.equal(response.status, 400);
      assert.equal(
        typeof (response.body as { error?: unknown }).error,
        "string"
      );
      assert.ok(((response.body as { error: string }).error).length > 0);
    });
  });

  describe("Paginación, ordenamiento y validación con ?limit=", () => {
    it("ordena de forma determinista por username ascendente al aplicar ?limit=", async () => {
      const session = await registerTestUser({
        username: "zaira_test",
        name: "Zaira",
        lastName: "Torres",
      });
      await registerTestUser({
        username: "alberto_test",
        name: "Alberto",
        lastName: "Sanchez",
      });
      await registerTestUser({
        username: "marcos_test",
        name: "Marcos",
        lastName: "Lopez",
      });

      const resLimit1 = await authenticatedGet("/api/users?limit=1", session);
      assert.equal(resLimit1.status, 200);
      assert.equal((resLimit1.body as UserResponseItem[]).length, 1);
      assert.equal(
        (resLimit1.body as UserResponseItem[])[0].username,
        "alberto_test"
      );

      const resLimit2 = await authenticatedGet("/api/users?limit=2", session);
      assert.equal(resLimit2.status, 200);
      assert.equal((resLimit2.body as UserResponseItem[]).length, 2);
      assert.equal(
        (resLimit2.body as UserResponseItem[])[0].username,
        "alberto_test"
      );
      assert.equal(
        (resLimit2.body as UserResponseItem[])[1].username,
        "marcos_test"
      );
    });

    it("aplica DEFAULT_LIMIT (50) por defecto y acota a MAX_LIMIT (100) ante ?limit=500 con orden determinista", async () => {
      const session = await registerTestUser({
        username: "usuario_000",
        name: "Usuario",
        lastName: "Cero",
      });

      const bulkUsers = Array.from({ length: 104 }, (_, index) => {
        const paddedIndex = String(index + 1).padStart(3, "0");
        const username = `usuario_${paddedIndex}`;
        return {
          _id: `user-${username}`,
          username,
          name: `Nombre${paddedIndex}`,
          lastName: `Apellido${paddedIndex}`,
          mail: `usuario_${paddedIndex}@ejemplo.com`,
          initials: "US",
          avatarColor: "#0284c7",
        };
      });
      await User.insertMany(bulkUsers);

      // Sin ?limit= debe retornar exactamente DEFAULT_LIMIT (50) usuarios
      const resDefault = await authenticatedGet("/api/users", session);
      assert.equal(resDefault.status, 200);
      assert.ok(Array.isArray(resDefault.body));
      assert.equal((resDefault.body as UserResponseItem[]).length, 50);
      assert.equal(
        (resDefault.body as UserResponseItem[])[0].username,
        "usuario_000"
      );
      assert.equal(
        (resDefault.body as UserResponseItem[])[49].username,
        "usuario_049"
      );

      // Con ?limit=500 debe acotarse estrictamente a MAX_LIMIT (100) usuarios
      const res500 = await authenticatedGet("/api/users?limit=500", session);
      assert.equal(res500.status, 200);
      assert.ok(Array.isArray(res500.body));
      assert.equal((res500.body as UserResponseItem[]).length, 100);
      assert.equal(
        (res500.body as UserResponseItem[])[0].username,
        "usuario_000"
      );
      assert.equal(
        (res500.body as UserResponseItem[])[99].username,
        "usuario_099"
      );

      // Verificar orden estrictamente ascendente por username
      const usersList = res500.body as UserResponseItem[];
      for (let i = 0; i < usersList.length - 1; i++) {
        assert.ok(
          usersList[i].username.localeCompare(usersList[i + 1].username) < 0,
          `El orden debe ser ascendente: ${usersList[i].username} < ${usersList[i + 1].username}`
        );
      }
    });

    it("responde 400 con { error } ante valores de ?limit= inválidos (vacío, 0, negativos, no numéricos o decimales)", async () => {
      const session = await registerTestUser();

      const invalidLimits = ["", "0", "-3", "abc", "1.5"];

      for (const limitVal of invalidLimits) {
        const url =
          limitVal === ""
            ? "/api/users?limit="
            : `/api/users?limit=${encodeURIComponent(limitVal)}`;
        const response = await authenticatedGet(url, session);

        assert.equal(
          response.status,
          400,
          `Se esperaba 400 para ?limit=${limitVal}, se recibió ${response.status}.`
        );
        assert.equal(
          typeof (response.body as { error?: unknown }).error,
          "string",
          `La respuesta debe incluir un mensaje de error tipo string para ?limit=${limitVal}.`
        );
        assert.ok(
          ((response.body as { error: string }).error).length > 0,
          `El mensaje de error no debe estar vacío para ?limit=${limitVal}.`
        );
      }
    });

    it("responde 400 con { error } ante consultas malformadas o parámetros no soportados", async () => {
      const session = await registerTestUser();

      const malformedQueries = [
        "/api/users?q[a]=b",
        "/api/users?limit[]=2",
        "/api/users?q=a&q=b",
        "/api/users?limit=1&limit=2",
        "/api/users?mail=test@ejemplo.com",
      ];

      for (const queryUrl of malformedQueries) {
        const response = await authenticatedGet(queryUrl, session);

        assert.equal(
          response.status,
          400,
          `Se esperaba 400 para la query ${queryUrl}, se recibió ${response.status}.`
        );
        assert.equal(
          typeof (response.body as { error?: unknown }).error,
          "string",
          `La respuesta debe incluir un mensaje de error tipo string para ${queryUrl}.`
        );
        assert.ok(
          ((response.body as { error: string }).error).length > 0,
          `El mensaje de error no debe estar vacío para ${queryUrl}.`
        );
      }
    });
  });
});
