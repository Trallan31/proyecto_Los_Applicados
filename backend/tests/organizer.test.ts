import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import supertest from "supertest";
import app from "../src/app";
import Course from "../src/models/course";
import Session from "../src/models/session";
import Task from "../src/models/task";
import {
  connectTestDb,
  disconnectTestDb,
  registerTestUser,
  resetTestDb,
  type RegisteredTestUser,
} from "./helpers/testDb";

interface CourseLink {
  id: string;
  title: string;
  url: string;
  category?: "lms" | "drive" | "video" | "web" | "otro";
}

interface CourseResponse {
  id: string;
  userId: string;
  name: string;
  code: string;
  shortName: string;
  color: string;
  links: CourseLink[];
}

interface SessionResponse {
  id: string;
  courseId: string;
  dayOfWeek: number;
  startHour: number;
  duration: number;
  type: "Cátedra" | "Auxiliar" | "Laboratorio";
}

interface TaskResponse {
  id: string;
  userId: string;
  title: string;
  scope: "Ramo" | "Proyecto Universitario" | "Personal";
  courseId: string | null;
  type: "Tarea" | "Evaluación" | "Proyecto" | "Lectura";
  endDate: string;
  dueTime: string | null;
  status: "Pendiente" | "En curso" | "Completada";
  priority: "Alta" | "Media" | "Baja";
  notes: string | null;
}

type AuthSession = Pick<RegisteredTestUser, "cookie" | "csrfToken">;

/** Petición GET autenticada con cookie de sesión y token CSRF. */
function authGet(url: string, session: AuthSession) {
  return supertest(app)
    .get(url)
    .set("Cookie", session.cookie)
    .set("X-CSRF-Token", session.csrfToken);
}

/** Petición POST autenticada con cookie de sesión y token CSRF. */
function authPost(
  url: string,
  session: AuthSession,
  body?: Record<string, unknown>
) {
  const request = supertest(app)
    .post(url)
    .set("Cookie", session.cookie)
    .set("X-CSRF-Token", session.csrfToken);
  return body !== undefined ? request.send(body) : request;
}

/** Petición PATCH autenticada con cookie de sesión y token CSRF. */
function authPatch(
  url: string,
  session: AuthSession,
  body?: Record<string, unknown>
) {
  const request = supertest(app)
    .patch(url)
    .set("Cookie", session.cookie)
    .set("X-CSRF-Token", session.csrfToken);
  return body !== undefined ? request.send(body) : request;
}

/** Petición PUT autenticada con cookie de sesión y token CSRF. */
function authPut(
  url: string,
  session: AuthSession,
  body?: Record<string, unknown>
) {
  const request = supertest(app)
    .put(url)
    .set("Cookie", session.cookie)
    .set("X-CSRF-Token", session.csrfToken);
  return body !== undefined ? request.send(body) : request;
}

/** Petición DELETE autenticada con cookie de sesión y token CSRF. */
function authDelete(url: string, session: AuthSession) {
  return supertest(app)
    .delete(url)
    .set("Cookie", session.cookie)
    .set("X-CSRF-Token", session.csrfToken);
}

/** Comprueba que la serialización JSON exponga `id` y oculte `_id` y `__v`. */
function assertPublicJsonShape(body: unknown): void {
  assert.equal(typeof body, "object");
  assert.notEqual(body, null);
  const record = body as Record<string, unknown>;
  assert.equal(typeof record.id, "string");
  assert.ok((record.id as string).length > 0, "El recurso debe incluir id.");
  assert.equal("_id" in record, false, "No debe exponerse _id en el JSON.");
  assert.equal("__v" in record, false, "No debe exponerse __v en el JSON.");
}

/** Crea un ramo de prueba vía API. */
async function createTestCourse(
  session: RegisteredTestUser,
  overrides: Record<string, unknown> = {}
): Promise<CourseResponse> {
  const payload = {
    name: "Ingeniería de Software",
    code: "CC4401",
    shortName: "Ing. Soft",
    color: "#2563EB",
    links: [
      {
        id: "link-1",
        title: "U-Cursos",
        url: "https://www.u-cursos.cl",
        category: "lms",
      },
    ],
    ...overrides,
  };
  const response = await authPost("/api/courses", session, payload);
  assert.equal(
    response.status,
    201,
    `Error al crear ramo base: ${JSON.stringify(response.body)}`
  );
  return response.body as CourseResponse;
}

/** Crea una sesión académica de prueba vía API. */
async function createTestSession(
  session: RegisteredTestUser,
  courseId: string,
  overrides: Record<string, unknown> = {}
): Promise<SessionResponse> {
  const payload = {
    courseId,
    dayOfWeek: 1,
    startHour: 10.5,
    duration: 1.5,
    type: "Cátedra",
    ...overrides,
  };
  const response = await authPost("/api/sessions", session, payload);
  assert.equal(
    response.status,
    201,
    `Error al crear sesión base: ${JSON.stringify(response.body)}`
  );
  return response.body as SessionResponse;
}

/** Crea una tarea de prueba vía API. */
async function createTestTask(
  session: RegisteredTestUser,
  overrides: Record<string, unknown> = {}
): Promise<TaskResponse> {
  const payload = {
    title: "Entregar informe",
    scope: "Personal",
    courseId: null,
    type: "Tarea",
    endDate: "2026-11-20",
    ...overrides,
  };
  const response = await authPost("/api/tasks", session, payload);
  assert.equal(
    response.status,
    201,
    `Error al crear tarea base: ${JSON.stringify(response.body)}`
  );
  return response.body as TaskResponse;
}

describe("Suite del Organizador Personal (courses, sessions, tasks)", () => {
  before(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  after(async () => {
    await disconnectTestDb();
  });

  // =========================================================================
  // Bloque 1: Ramos (/api/courses) — CRUD y validaciones
  // =========================================================================
  describe("Ramos (/api/courses) — CRUD y validaciones", () => {
    it("ejecuta CRUD completo con estados HTTP esperados y formato JSON sin _id ni __v", async () => {
      const user = await registerTestUser();

      // POST /api/courses
      const createRes = await authPost("/api/courses", user, {
        name: "Bases de Datos",
        code: "CC3201",
        shortName: "BD",
        color: "#0EA5E9",
        links: [
          {
            id: "lnk-lms",
            title: "Material del curso",
            url: "https://ejemplo.cl/bd",
            category: "lms",
          },
        ],
      });
      assert.equal(createRes.status, 201);
      assertPublicJsonShape(createRes.body);
      const created = createRes.body as CourseResponse;
      assert.equal(created.userId, user.user.id);
      assert.equal(created.name, "Bases de Datos");
      assert.equal(created.code, "CC3201");
      assert.equal(created.shortName, "BD");
      assert.equal(created.color, "#0EA5E9");
      assert.equal(created.links.length, 1);

      // GET /api/courses
      const listRes = await authGet("/api/courses", user);
      assert.equal(listRes.status, 200);
      assert.equal(Array.isArray(listRes.body), true);
      const list = listRes.body as CourseResponse[];
      assert.equal(list.length, 1);
      assertPublicJsonShape(list[0]);
      assert.equal(list[0].id, created.id);

      // GET /api/courses/:id
      const getRes = await authGet(`/api/courses/${created.id}`, user);
      assert.equal(getRes.status, 200);
      assertPublicJsonShape(getRes.body);
      assert.equal((getRes.body as CourseResponse).id, created.id);

      // PATCH /api/courses/:id
      const patchRes = await authPatch(`/api/courses/${created.id}`, user, {
        shortName: "Bases",
        color: "#10B981",
      });
      assert.equal(patchRes.status, 200);
      assertPublicJsonShape(patchRes.body);
      const patched = patchRes.body as CourseResponse;
      assert.equal(patched.shortName, "Bases");
      assert.equal(patched.color, "#10B981");
      assert.equal(patched.name, "Bases de Datos");

      // PUT /api/courses/:id
      const putRes = await authPut(`/api/courses/${created.id}`, user, {
        name: "Bases de Datos Avanzadas",
        code: "CC5201",
        shortName: "BDA",
        color: "#8B5CF6",
        links: [],
      });
      assert.equal(putRes.status, 200);
      assertPublicJsonShape(putRes.body);
      const replaced = putRes.body as CourseResponse;
      assert.equal(replaced.name, "Bases de Datos Avanzadas");
      assert.equal(replaced.code, "CC5201");
      assert.equal(replaced.shortName, "BDA");
      assert.equal(replaced.color, "#8B5CF6");
      assert.deepEqual(replaced.links, []);

      // DELETE /api/courses/:id
      const deleteRes = await authDelete(`/api/courses/${created.id}`, user);
      assert.equal(deleteRes.status, 204);
      assert.equal(deleteRes.text, "");

      const afterDeleteGet = await authGet(`/api/courses/${created.id}`, user);
      assert.equal(afterDeleteGet.status, 404);
    });

    it("impide spoofing de userId en POST y PATCH manteniendo al usuario autenticado", async () => {
      const userA = await registerTestUser();
      const userB = await registerTestUser();

      const createRes = await authPost("/api/courses", userA, {
        userId: userB.user.id,
        name: "Algoritmos y Estructuras de Datos",
        code: "CC3001",
        shortName: "AED",
        color: "#F59E0B",
      });
      assert.equal(createRes.status, 201);
      const created = createRes.body as CourseResponse;
      assert.equal(created.userId, userA.user.id);

      const patchRes = await authPatch(`/api/courses/${created.id}`, userA, {
        userId: userB.user.id,
        shortName: "AED-2",
      });
      assert.equal(patchRes.status, 200);
      assert.equal((patchRes.body as CourseResponse).userId, userA.user.id);

      const dbCourse = await Course.findById(created.id);
      assert.ok(dbCourse);
      assert.equal(dbCourse.userId, userA.user.id);
    });

    it("rechaza con 400 enlaces inseguros o categoría inválida en POST y PATCH", async () => {
      const user = await registerTestUser();
      const validCourse = await createTestCourse(user);

      const invalidLinkPayloads: Array<Record<string, unknown>> = [
        {
          id: "bad-js",
          title: "XSS",
          url: "javascript:alert(1)",
          category: "web",
        },
        {
          id: "bad-data",
          title: "Data URI",
          url: "data:text/html,<script>alert(1)</script>",
          category: "web",
        },
        {
          id: "bad-ftp",
          title: "FTP",
          url: "ftp://ejemplo.cl",
          category: "drive",
        },
        {
          id: "bad-creds",
          title: "Credenciales",
          url: "https://user:pass@ejemplo.cl",
          category: "web",
        },
        {
          id: "bad-slash",
          title: "Host vacío",
          url: "https:///ruta",
          category: "web",
        },
        {
          id: "bad-cat",
          title: "Categoría inválida",
          url: "https://ejemplo.cl/recurso",
          category: "social",
        },
      ];

      for (const badLink of invalidLinkPayloads) {
        const postRes = await authPost("/api/courses", user, {
          name: "Ramo con link inválido",
          code: "CC1000",
          shortName: "RCI",
          color: "#111827",
          links: [badLink],
        });
        assert.equal(
          postRes.status,
          400,
          `POST debía rechazar enlace ${JSON.stringify(badLink)}`
        );

        const patchRes = await authPatch(
          `/api/courses/${validCourse.id}`,
          user,
          { links: [badLink] }
        );
        assert.equal(
          patchRes.status,
          400,
          `PATCH debía rechazar enlace ${JSON.stringify(badLink)}`
        );
      }
    });

    it("rechaza con 400 color hexadecimal inválido, campos faltantes/vacíos y campos extra no permitidos", async () => {
      const user = await registerTestUser();
      const validCourse = await createTestCourse(user);

      for (const invalidColor of ["rojo", "#12345", "#GGGGGG"]) {
        const postRes = await authPost("/api/courses", user, {
          name: "Cálculo",
          code: "MA1001",
          shortName: "Cálc",
          color: invalidColor,
        });
        assert.equal(
          postRes.status,
          400,
          `Color inválido ${invalidColor} debía devolver 400 en POST`
        );

        const patchRes = await authPatch(
          `/api/courses/${validCourse.id}`,
          user,
          { color: invalidColor }
        );
        assert.equal(
          patchRes.status,
          400,
          `Color inválido ${invalidColor} debía devolver 400 en PATCH`
        );
      }

      // Campos requeridos faltantes o vacíos tras trim
      const missingOrEmptyPayloads: Array<Record<string, unknown>> = [
        { code: "MA1001", shortName: "Cálc", color: "#2563EB" },
        { name: "Cálculo", shortName: "Cálc", color: "#2563EB" },
        { name: "Cálculo", code: "MA1001", color: "#2563EB" },
        { name: "Cálculo", code: "MA1001", shortName: "Cálc" },
        { name: "   ", code: "MA1001", shortName: "Cálc", color: "#2563EB" },
        { name: "Cálculo", code: "", shortName: "Cálc", color: "#2563EB" },
        { name: "Cálculo", code: "MA1001", shortName: "  ", color: "#2563EB" },
      ];

      for (const payload of missingOrEmptyPayloads) {
        const res = await authPost("/api/courses", user, payload);
        assert.equal(
          res.status,
          400,
          `Payload incompleto debía devolver 400: ${JSON.stringify(payload)}`
        );
      }

      // Campo extra en raíz (whitelist / strict)
      const extraTopLevel = await authPost("/api/courses", user, {
        name: "Cálculo",
        code: "MA1001",
        shortName: "Cálc",
        color: "#2563EB",
        credits: 10,
      });
      assert.equal(extraTopLevel.status, 400);

      // Campo extra en subdocumento links (embeddedOptions strict: "throw")
      const extraEmbedded = await authPost("/api/courses", user, {
        name: "Cálculo",
        code: "MA1001",
        shortName: "Cálc",
        color: "#2563EB",
        links: [
          {
            id: "l1",
            title: "Sitio",
            url: "https://ejemplo.cl",
            category: "web",
            campoExtra: true,
          },
        ],
      });
      assert.equal(extraEmbedded.status, 400);
    });
  });

  // =========================================================================
  // Bloque 2: Sesiones (/api/sessions) — CRUD y validaciones horarias
  // =========================================================================
  describe("Sesiones (/api/sessions) — CRUD y validaciones horarias", () => {
    it("permite crear y editar sesiones válidas (dayOfWeek 0..6, 22 + 2 = 24, tipos válidos)", async () => {
      const user = await registerTestUser();
      const course = await createTestCourse(user);

      // Borde inferior día 0 y fin exacto a las 24:00 (22 + 2 = 24)
      const lateRes = await authPost("/api/sessions", user, {
        courseId: course.id,
        dayOfWeek: 0,
        startHour: 22,
        duration: 2,
        type: "Cátedra",
      });
      assert.equal(lateRes.status, 201);
      assertPublicJsonShape(lateRes.body);
      const lateSession = lateRes.body as SessionResponse;
      assert.equal(lateSession.courseId, course.id);
      assert.equal(lateSession.dayOfWeek, 0);
      assert.equal(lateSession.startHour, 22);
      assert.equal(lateSession.duration, 2);
      assert.equal(lateSession.type, "Cátedra");

      // Borde superior día 6 y tipo Auxiliar
      const auxRes = await authPost("/api/sessions", user, {
        courseId: course.id,
        dayOfWeek: 6,
        startHour: 0,
        duration: 0.25,
        type: "Auxiliar",
      });
      assert.equal(auxRes.status, 201);

      // Tipo Laboratorio y edición PATCH / PUT / GET / DELETE
      const labRes = await authPost("/api/sessions", user, {
        courseId: course.id,
        dayOfWeek: 3,
        startHour: 14,
        duration: 2,
        type: "Laboratorio",
      });
      assert.equal(labRes.status, 201);
      const labSession = labRes.body as SessionResponse;

      const listRes = await authGet("/api/sessions", user);
      assert.equal(listRes.status, 200);
      assert.equal((listRes.body as SessionResponse[]).length, 3);

      const getRes = await authGet(`/api/sessions/${labSession.id}`, user);
      assert.equal(getRes.status, 200);
      assertPublicJsonShape(getRes.body);

      const patchRes = await authPatch(`/api/sessions/${labSession.id}`, user, {
        dayOfWeek: 4,
        startHour: 15.5,
      });
      assert.equal(patchRes.status, 200);
      assert.equal((patchRes.body as SessionResponse).dayOfWeek, 4);
      assert.equal((patchRes.body as SessionResponse).startHour, 15.5);

      const putRes = await authPut(`/api/sessions/${labSession.id}`, user, {
        courseId: course.id,
        dayOfWeek: 5,
        startHour: 8.5,
        duration: 1.5,
        type: "Auxiliar",
      });
      assert.equal(putRes.status, 200);
      assert.equal((putRes.body as SessionResponse).type, "Auxiliar");

      const delRes = await authDelete(`/api/sessions/${labSession.id}`, user);
      assert.equal(delRes.status, 204);
    });

    it("rechaza con 400 cuando startHour + duration > 24 en POST y en PATCH parcial", async () => {
      const user = await registerTestUser();
      const course = await createTestCourse(user);

      // Rechazo en POST
      for (const badSchedule of [
        { startHour: 22, duration: 3 },
        { startHour: 23.5, duration: 1 },
      ]) {
        const res = await authPost("/api/sessions", user, {
          courseId: course.id,
          dayOfWeek: 2,
          type: "Cátedra",
          ...badSchedule,
        });
        assert.equal(
          res.status,
          400,
          `POST debía rechazar exceso de medianoche: ${JSON.stringify(badSchedule)}`
        );
      }

      // Sesión válida base: 20 + 2 = 22
      const session = await createTestSession(user, course.id, {
        dayOfWeek: 2,
        startHour: 20,
        duration: 2,
        type: "Cátedra",
      });

      // PATCH parcial solo startHour -> 23 + 2 = 25 > 24
      const patchStart = await authPatch(`/api/sessions/${session.id}`, user, {
        startHour: 23,
      });
      assert.equal(patchStart.status, 400);

      // PATCH parcial solo duration -> 20 + 5 = 25 > 24
      const patchDuration = await authPatch(
        `/api/sessions/${session.id}`,
        user,
        { duration: 5 }
      );
      assert.equal(patchDuration.status, 400);

      const dbSession = await Session.findById(session.id);
      assert.ok(dbSession);
      assert.equal(dbSession.startHour, 20);
      assert.equal(dbSession.duration, 2);
    });

    it("rechaza con 400 dayOfWeek, startHour, duration y type inválidos", async () => {
      const user = await registerTestUser();
      const course = await createTestCourse(user);

      const invalidCases: Array<Record<string, unknown>> = [
        { dayOfWeek: -1, startHour: 10, duration: 1, type: "Cátedra" },
        { dayOfWeek: 7, startHour: 10, duration: 1, type: "Cátedra" },
        { dayOfWeek: 1.5, startHour: 10, duration: 1, type: "Cátedra" },
        { dayOfWeek: 1, startHour: -0.5, duration: 1, type: "Cátedra" },
        { dayOfWeek: 1, startHour: 24, duration: 1, type: "Cátedra" },
        { dayOfWeek: 1, startHour: 10, duration: 0, type: "Cátedra" },
        { dayOfWeek: 1, startHour: 10, duration: 0.1, type: "Cátedra" },
        { dayOfWeek: 1, startHour: 10, duration: 25, type: "Cátedra" },
        { dayOfWeek: 1, startHour: 10, duration: 1, type: "Ayudantía" },
      ];

      for (const payload of invalidCases) {
        const res = await authPost("/api/sessions", user, {
          courseId: course.id,
          ...payload,
        });
        assert.equal(
          res.status,
          400,
          `Debía devolver 400 para sesión inválida: ${JSON.stringify(payload)}`
        );
      }
    });
  });

  // =========================================================================
  // Bloque 3: Tareas (/api/tasks) — CRUD, fechas, horas y coherencia
  // =========================================================================
  describe("Tareas (/api/tasks) — CRUD, fechas, horas y coherencia scope/courseId", () => {
    it("crea y edita tareas para los tres scopes con defaults, normalización de dueTime y anti-spoofing", async () => {
      const userA = await registerTestUser();
      const userB = await registerTestUser();
      const course = await createTestCourse(userA);

      // 1. Scope "Ramo" con defaults y normalización dueTime: "" -> null + anti-spoofing
      const courseTaskRes = await authPost("/api/tasks", userA, {
        userId: userB.user.id,
        title: "Estudiar Control 1",
        scope: "Ramo",
        courseId: course.id,
        type: "Evaluación",
        endDate: "2026-11-25",
        dueTime: "",
      });
      assert.equal(courseTaskRes.status, 201);
      assertPublicJsonShape(courseTaskRes.body);
      const courseTask = courseTaskRes.body as TaskResponse;
      assert.equal(courseTask.userId, userA.user.id);
      assert.equal(courseTask.scope, "Ramo");
      assert.equal(courseTask.courseId, course.id);
      assert.equal(courseTask.status, "Pendiente");
      assert.equal(courseTask.priority, "Media");
      assert.equal(courseTask.dueTime, null);

      // 2. Scope "Personal" con courseId: null y dueTime límite 00:00
      const personalTaskRes = await authPost("/api/tasks", userA, {
        title: "Comprar cuaderno",
        scope: "Personal",
        courseId: null,
        type: "Tarea",
        endDate: "2026-11-18",
        dueTime: "00:00",
      });
      assert.equal(personalTaskRes.status, 201);
      const personalTask = personalTaskRes.body as TaskResponse;
      assert.equal(personalTask.courseId, null);
      assert.equal(personalTask.dueTime, "00:00");

      // 3. Scope "Proyecto Universitario" con dueTime límite 23:59
      const projectTaskRes = await authPost("/api/tasks", userA, {
        title: "Presentar hito 2",
        scope: "Proyecto Universitario",
        courseId: null,
        type: "Proyecto",
        endDate: "2026-12-01",
        dueTime: "23:59",
        status: "En curso",
        priority: "Alta",
        notes: "Llevar proyector",
      });
      assert.equal(projectTaskRes.status, 201);
      const projectTask = projectTaskRes.body as TaskResponse;
      assert.equal(projectTask.scope, "Proyecto Universitario");
      assert.equal(projectTask.dueTime, "23:59");
      assert.equal(projectTask.status, "En curso");
      assert.equal(projectTask.priority, "Alta");

      // PATCH con anti-spoofing y normalización dueTime: "" -> null
      const patchRes = await authPatch(`/api/tasks/${projectTask.id}`, userA, {
        userId: userB.user.id,
        dueTime: "",
        status: "Completada",
      });
      assert.equal(patchRes.status, 200);
      const patched = patchRes.body as TaskResponse;
      assert.equal(patched.userId, userA.user.id);
      assert.equal(patched.dueTime, null);
      assert.equal(patched.status, "Completada");

      // GET listado, GET por ID, PUT y DELETE
      const listRes = await authGet("/api/tasks", userA);
      assert.equal(listRes.status, 200);
      assert.equal((listRes.body as TaskResponse[]).length, 3);

      const getRes = await authGet(`/api/tasks/${personalTask.id}`, userA);
      assert.equal(getRes.status, 200);

      const putRes = await authPut(`/api/tasks/${personalTask.id}`, userA, {
        title: "Comprar archivador",
        scope: "Personal",
        courseId: null,
        type: "Lectura",
        endDate: "2026-11-19",
        dueTime: "18:30",
        status: "En curso",
        priority: "Baja",
        notes: null,
      });
      assert.equal(putRes.status, 200);
      assert.equal((putRes.body as TaskResponse).title, "Comprar archivador");

      const delRes = await authDelete(`/api/tasks/${personalTask.id}`, userA);
      assert.equal(delRes.status, 204);
    });

    it("rechaza con 400 fechas imposibles o formato inválido y acepta año bisiesto 2024-02-29", async () => {
      const user = await registerTestUser();

      // Año bisiesto válido
      const leapRes = await authPost("/api/tasks", user, {
        title: "Entrega bisiesta",
        scope: "Personal",
        courseId: null,
        type: "Tarea",
        endDate: "2024-02-29",
      });
      assert.equal(leapRes.status, 201);
      const created = leapRes.body as TaskResponse;
      assert.equal(created.endDate, "2024-02-29");

      const invalidDates = [
        "2026-02-31",
        "2026-02-29",
        "2026-13-01",
        "2026/11/17",
        "",
      ];

      for (const badDate of invalidDates) {
        const postRes = await authPost("/api/tasks", user, {
          title: "Fecha inválida",
          scope: "Personal",
          courseId: null,
          type: "Tarea",
          endDate: badDate,
        });
        assert.equal(
          postRes.status,
          400,
          `POST debía rechazar endDate="${badDate}"`
        );

        const patchRes = await authPatch(`/api/tasks/${created.id}`, user, {
          endDate: badDate,
        });
        assert.equal(
          patchRes.status,
          400,
          `PATCH debía rechazar endDate="${badDate}"`
        );
      }
    });

    it("rechaza con 400 dueTime con formato o rango inválido", async () => {
      const user = await registerTestUser();

      for (const badTime of ["24:00", "23:60", "9:30", "mediodía"]) {
        const res = await authPost("/api/tasks", user, {
          title: "Hora inválida",
          scope: "Personal",
          courseId: null,
          type: "Tarea",
          endDate: "2026-11-20",
          dueTime: badTime,
        });
        assert.equal(
          res.status,
          400,
          `Debía rechazar dueTime="${badTime}"`
        );
      }
    });

    it("rechaza con 400 incoherencias entre scope y courseId en POST y PATCH parcial", async () => {
      const user = await registerTestUser();
      const course = await createTestCourse(user);

      // "Ramo" sin courseId (null u omitido)
      const ramoNull = await authPost("/api/tasks", user, {
        title: "Sin ramo explícito",
        scope: "Ramo",
        courseId: null,
        type: "Tarea",
        endDate: "2026-11-20",
      });
      assert.equal(ramoNull.status, 400);

      const ramoOmitted = await authPost("/api/tasks", user, {
        title: "Sin ramo omitido",
        scope: "Ramo",
        type: "Tarea",
        endDate: "2026-11-20",
      });
      assert.equal(ramoOmitted.status, 400);

      // "Personal" con courseId
      const personalWithCourse = await authPost("/api/tasks", user, {
        title: "Personal con ramo",
        scope: "Personal",
        courseId: course.id,
        type: "Tarea",
        endDate: "2026-11-20",
      });
      assert.equal(personalWithCourse.status, 400);

      // PATCH parcial: cambiar solo scope a "Personal" manteniendo el courseId actual -> 400
      const task = await createTestTask(user, {
        scope: "Ramo",
        courseId: course.id,
      });

      const badPatch = await authPatch(`/api/tasks/${task.id}`, user, {
        scope: "Personal",
      });
      assert.equal(badPatch.status, 400);

      const dbUnchanged = await Task.findById(task.id);
      assert.ok(dbUnchanged);
      assert.equal(dbUnchanged.scope, "Ramo");
      assert.equal(dbUnchanged.courseId?.toString(), course.id);

      // PATCH válido limpiando courseId a null al cambiar a "Personal"
      const validPatch = await authPatch(`/api/tasks/${task.id}`, user, {
        scope: "Personal",
        courseId: null,
      });
      assert.equal(validPatch.status, 200);
      assert.equal((validPatch.body as TaskResponse).scope, "Personal");
      assert.equal((validPatch.body as TaskResponse).courseId, null);
    });
  });

  // =========================================================================
  // Bloque 4: Aislamiento estricto entre usuarios y autenticación/CSRF
  // =========================================================================
  describe("Aislamiento estricto entre usuarios y autenticación/CSRF", () => {
    it("rechaza con 401 peticiones sin cookie o sin X-CSRF-Token en courses, sessions y tasks", async () => {
      const user = await registerTestUser();

      for (const path of ["/api/courses", "/api/sessions", "/api/tasks"]) {
        const noCookieGet = await supertest(app).get(path);
        assert.equal(noCookieGet.status, 401);

        const noCsrfGet = await supertest(app)
          .get(path)
          .set("Cookie", user.cookie);
        assert.equal(noCsrfGet.status, 401);

        const noCookiePost = await supertest(app).post(path).send({});
        assert.equal(noCookiePost.status, 401);

        const badCsrfPost = await supertest(app)
          .post(path)
          .set("Cookie", user.cookie)
          .set("X-CSRF-Token", "token-csrf-invalido")
          .send({});
        assert.equal(badCsrfPost.status, 401);
      }
    });

    it("devuelve [] al listar recursos ajenos y 404 en GET/PATCH/PUT/DELETE sin alterar la BD", async () => {
      const userA = await registerTestUser();
      const userB = await registerTestUser();

      const courseA = await createTestCourse(userA);
      const sessionA = await createTestSession(userA, courseA.id);
      const taskA = await createTestTask(userA, {
        scope: "Ramo",
        courseId: courseA.id,
      });

      // Listados de userB deben ser vacíos
      for (const endpoint of ["/api/courses", "/api/sessions", "/api/tasks"]) {
        const listRes = await authGet(endpoint, userB);
        assert.equal(listRes.status, 200);
        assert.deepEqual(listRes.body, []);
      }

      // Acceso directo a courseA por userB -> 404
      assert.equal(
        (await authGet(`/api/courses/${courseA.id}`, userB)).status,
        404
      );
      assert.equal(
        (
          await authPatch(`/api/courses/${courseA.id}`, userB, {
            name: "Secuestrado",
          })
        ).status,
        404
      );
      assert.equal(
        (
          await authPut(`/api/courses/${courseA.id}`, userB, {
            name: "Secuestrado",
            code: "XX0000",
            shortName: "SEC",
            color: "#000000",
          })
        ).status,
        404
      );
      assert.equal(
        (await authDelete(`/api/courses/${courseA.id}`, userB)).status,
        404
      );

      // Acceso directo a sessionA por userB -> 404
      assert.equal(
        (await authGet(`/api/sessions/${sessionA.id}`, userB)).status,
        404
      );
      assert.equal(
        (
          await authPatch(`/api/sessions/${sessionA.id}`, userB, {
            duration: 1,
          })
        ).status,
        404
      );
      assert.equal(
        (
          await authPut(`/api/sessions/${sessionA.id}`, userB, {
            courseId: courseA.id,
            dayOfWeek: 1,
            startHour: 9,
            duration: 1,
            type: "Auxiliar",
          })
        ).status,
        404
      );
      assert.equal(
        (await authDelete(`/api/sessions/${sessionA.id}`, userB)).status,
        404
      );

      // Acceso directo a taskA por userB -> 404
      assert.equal(
        (await authGet(`/api/tasks/${taskA.id}`, userB)).status,
        404
      );
      assert.equal(
        (
          await authPatch(`/api/tasks/${taskA.id}`, userB, {
            title: "Secuestrada",
          })
        ).status,
        404
      );
      assert.equal(
        (
          await authPut(`/api/tasks/${taskA.id}`, userB, {
            title: "Secuestrada",
            scope: "Personal",
            courseId: null,
            type: "Tarea",
            endDate: "2026-12-01",
          })
        ).status,
        404
      );
      assert.equal(
        (await authDelete(`/api/tasks/${taskA.id}`, userB)).status,
        404
      );

      // Verificar integridad en BD
      const dbCourse = await Course.findById(courseA.id);
      const dbSession = await Session.findById(sessionA.id);
      const dbTask = await Task.findById(taskA.id);
      assert.ok(dbCourse);
      assert.equal(dbCourse.name, courseA.name);
      assert.ok(dbSession);
      assert.equal(dbSession.duration, sessionA.duration);
      assert.ok(dbTask);
      assert.equal(dbTask.title, taskA.title);
    });

    it("rechaza con 404 crear o reasignar Session/Task referenciando un courseId ajeno", async () => {
      const userA = await registerTestUser();
      const userB = await registerTestUser();

      const courseA = await createTestCourse(userA);
      const courseB = await createTestCourse(userB, {
        name: "Ramo B",
        code: "CC2002",
        shortName: "RB",
      });
      const sessionB = await createTestSession(userB, courseB.id);
      const taskB = await createTestTask(userB, {
        scope: "Ramo",
        courseId: courseB.id,
      });

      // POST referenciando courseA por userB -> 404
      const postSession = await authPost("/api/sessions", userB, {
        courseId: courseA.id,
        dayOfWeek: 2,
        startHour: 10,
        duration: 1.5,
        type: "Cátedra",
      });
      assert.equal(postSession.status, 404);

      const postTask = await authPost("/api/tasks", userB, {
        title: "Tarea hacia ramo ajeno",
        scope: "Ramo",
        courseId: courseA.id,
        type: "Tarea",
        endDate: "2026-11-22",
      });
      assert.equal(postTask.status, 404);

      // PATCH reasignando hacia courseA por userB -> 404
      const patchSession = await authPatch(
        `/api/sessions/${sessionB.id}`,
        userB,
        { courseId: courseA.id }
      );
      assert.equal(patchSession.status, 404);

      const patchTask = await authPatch(`/api/tasks/${taskB.id}`, userB, {
        courseId: courseA.id,
      });
      assert.equal(patchTask.status, 404);
    });
  });

  // =========================================================================
  // Bloque 5: Cascadas de eliminación
  // =========================================================================
  describe("Cascadas de eliminación", () => {
    it("al eliminar course1 borra sus sessions y pasa sus tasks a Personal sin afectar otros ramos ni usuarios", async () => {
      const userA = await registerTestUser();
      const userB = await registerTestUser();

      // Datos de userA
      const course1 = await createTestCourse(userA, {
        name: "Ramo 1",
        code: "CC1001",
        shortName: "R1",
      });
      const course2 = await createTestCourse(userA, {
        name: "Ramo 2",
        code: "CC1002",
        shortName: "R2",
      });

      const s1a = await createTestSession(userA, course1.id, { dayOfWeek: 1 });
      const s1b = await createTestSession(userA, course1.id, { dayOfWeek: 3 });
      const s2 = await createTestSession(userA, course2.id, { dayOfWeek: 2 });

      const t1a = await createTestTask(userA, {
        title: "Tarea 1A",
        scope: "Ramo",
        courseId: course1.id,
      });
      const t1b = await createTestTask(userA, {
        title: "Tarea 1B",
        scope: "Ramo",
        courseId: course1.id,
      });
      const t2 = await createTestTask(userA, {
        title: "Tarea 2",
        scope: "Ramo",
        courseId: course2.id,
      });
      const tPersonal = await createTestTask(userA, {
        title: "Tarea Personal",
        scope: "Personal",
        courseId: null,
      });

      // Datos de userB
      const courseB = await createTestCourse(userB, {
        name: "Ramo B",
        code: "CC9001",
        shortName: "RB",
      });
      const sessionB = await createTestSession(userB, courseB.id);
      const taskB = await createTestTask(userB, {
        title: "Tarea B",
        scope: "Ramo",
        courseId: courseB.id,
      });

      // Eliminar course1
      const deleteRes = await authDelete(`/api/courses/${course1.id}`, userA);
      assert.equal(deleteRes.status, 204);

      // course1 y sus sesiones eliminados
      assert.equal(await Course.findById(course1.id), null);
      assert.equal(await Session.findById(s1a.id), null);
      assert.equal(await Session.findById(s1b.id), null);
      assert.equal((await Session.find({ courseId: course1.id })).length, 0);

      // Tareas de course1 pasan a { scope: "Personal", courseId: null } sin borrarse
      for (const taskId of [t1a.id, t1b.id]) {
        const dbTask = await Task.findById(taskId);
        assert.ok(dbTask, "La tarea del ramo eliminado debe conservarse.");
        assert.equal(dbTask.scope, "Personal");
        assert.equal(dbTask.courseId, null);

        const apiTask = await authGet(`/api/tasks/${taskId}`, userA);
        assert.equal(apiTask.status, 200);
        assert.equal((apiTask.body as TaskResponse).scope, "Personal");
        assert.equal((apiTask.body as TaskResponse).courseId, null);
      }

      // course2, sus sesiones/tareas y tarea personal de userA intactos
      assert.ok(await Course.findById(course2.id));
      assert.ok(await Session.findById(s2.id));
      const dbT2 = await Task.findById(t2.id);
      assert.ok(dbT2);
      assert.equal(dbT2.scope, "Ramo");
      assert.equal(dbT2.courseId?.toString(), course2.id);
      assert.ok(await Task.findById(tPersonal.id));

      // Datos de userB intactos
      assert.ok(await Course.findById(courseB.id));
      assert.ok(await Session.findById(sessionB.id));
      const dbTaskB = await Task.findById(taskB.id);
      assert.ok(dbTaskB);
      assert.equal(dbTaskB.scope, "Ramo");
      assert.equal(dbTaskB.courseId?.toString(), courseB.id);
    });

    it("al eliminar una Session o una Task individual mantiene intacto el Course padre", async () => {
      const user = await registerTestUser();
      const course = await createTestCourse(user);
      const session = await createTestSession(user, course.id);
      const task = await createTestTask(user, {
        scope: "Ramo",
        courseId: course.id,
      });

      const delSession = await authDelete(`/api/sessions/${session.id}`, user);
      assert.equal(delSession.status, 204);
      assert.equal(await Session.findById(session.id), null);
      assert.ok(await Course.findById(course.id));

      const delTask = await authDelete(`/api/tasks/${task.id}`, user);
      assert.equal(delTask.status, 204);
      assert.equal(await Task.findById(task.id), null);
      assert.ok(await Course.findById(course.id));
    });
  });
});
