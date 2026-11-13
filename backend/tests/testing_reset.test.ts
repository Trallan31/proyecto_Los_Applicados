import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import supertest from "supertest";
import app from "../src/app";
import Activity from "../src/models/activity";
import Course from "../src/models/course";
import Project from "../src/models/project";
import Session from "../src/models/session";
import Sprint from "../src/models/sprint";
import Task from "../src/models/task";
import User from "../src/models/user";
import { testModels } from "../src/routes/testing";
import {
  connectTestDb,
  disconnectTestDb,
  resetTestDb,
} from "./helpers/testDb";

/** Cuenta los documentos actuales en todas las colecciones de prueba. */
async function countAllCollections(): Promise<number[]> {
  return Promise.all(testModels.map((model) => model.countDocuments()));
}

describe("Endpoint de reinicio de pruebas (POST /api/testing/reset)", () => {
  before(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  after(async () => {
    await disconnectTestDb();
  });

  it("elimina documentos de las siete colecciones y responde 204 sin cuerpo", async () => {
    const user = await User.create({
      _id: "user-reset",
      username: "reset.user",
      name: "Camila",
      lastName: "Rojas",
      mail: "camila.rojas@ejemplo.com",
      initials: "CR",
      avatarColor: "#4f7cff",
      passwordHash: "hash-de-prueba",
    });

    const course = await Course.create({
      userId: user._id,
      name: "Ingeniería de Software",
      code: "CC5003",
      shortName: "ISW",
      color: "#2dd67b",
    });

    await Session.create({
      courseId: course._id,
      dayOfWeek: 1,
      startHour: 10,
      duration: 1.5,
      type: "Cátedra",
    });

    await Task.create({
      userId: user._id,
      title: "Entregar avance",
      scope: "Ramo",
      courseId: course._id,
      type: "Tarea",
      endDate: "2026-11-20",
      dueTime: "18:00",
      status: "Pendiente",
      priority: "Alta",
    });

    const project = await Project.create({
      name: "Applicate",
      description: "Plataforma estudiantil",
      color: "#9b6dff",
      course: "CC5003",
      categories: ["Backend"],
      members: [{ userId: user._id, role: "Admin" }],
    });

    const sprint = await Sprint.create({
      projectId: project._id,
      name: "Sprint 1",
    });

    await Activity.create({
      projectId: project._id,
      sprintId: sprint._id.toString(),
      title: "Configurar suite de pruebas",
      category: "Backend",
      members: [user._id],
      priority: "Alta",
      status: "Pendiente",
      hours: 2,
      dueDate: "2026-11-22",
    });

    const countsBefore = await countAllCollections();
    assert.deepEqual(countsBefore, [1, 1, 1, 1, 1, 1, 1]);

    const response = await supertest(app).post("/api/testing/reset");

    assert.equal(response.status, 204);
    assert.equal(response.text, "");

    const countsAfter = await countAllCollections();
    assert.deepEqual(countsAfter, [0, 0, 0, 0, 0, 0, 0]);
  });

  it("responde 404 para métodos o subrutas inexistentes bajo /api/testing", async () => {
    const wrongMethod = await supertest(app).get("/api/testing/reset");
    assert.equal(wrongMethod.status, 404);
    assert.deepEqual(wrongMethod.body, { error: "Ruta no encontrada." });

    const unknownSubpath = await supertest(app).post("/api/testing/otra");
    assert.equal(unknownSubpath.status, 404);
    assert.deepEqual(unknownSubpath.body, { error: "Ruta no encontrada." });
  });

  it("responde 404 y no borra datos cuando NODE_ENV no es test", async () => {
    await User.create({
      _id: "user-guard",
      username: "guard.user",
      name: "Diego",
      lastName: "Fuentes",
      mail: "diego.fuentes@ejemplo.com",
      initials: "DF",
      avatarColor: "#ff8c42",
      passwordHash: "hash-de-prueba",
    });

    const originalNodeEnv = process.env.NODE_ENV;
    let status = 0;
    let body: unknown;

    try {
      process.env.NODE_ENV = "production";
      const response = await supertest(app).post("/api/testing/reset");
      status = response.status;
      body = response.body;
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }

    assert.equal(status, 404);
    assert.deepEqual(body, { error: "Ruta no encontrada." });
    assert.equal(await User.countDocuments(), 1);
  });
});
