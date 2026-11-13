import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import supertest from "supertest";
import app from "../src/app";
import Activity from "../src/models/activity";
import Project from "../src/models/project";
import Sprint from "../src/models/sprint";
import {
  connectTestDb,
  disconnectTestDb,
  registerTestUser,
  resetTestDb,
  type RegisteredTestUser,
} from "./helpers/testDb";

interface ProjectMember {
  userId: string;
  role: "Admin" | "Miembro";
}

interface ProjectLink {
  id: string;
  title: string;
  url: string;
  category?: string;
}

interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  color: string;
  course: string;
  categories: string[];
  members: ProjectMember[];
  links: ProjectLink[];
}

interface SprintResponse {
  id: string;
  projectId: string;
  name: string;
}

interface ActivityResponse {
  id: string;
  projectId: string;
  sprintId: string;
  title: string;
  description: string;
  category: string;
  members: string[];
  priority: string;
  status: string;
  hours: number;
  dueDate: string;
}

/** Petición GET autenticada con cookie de sesión y token CSRF. */
function authGet(
  url: string,
  session: Pick<RegisteredTestUser, "cookie" | "csrfToken">
) {
  return supertest(app)
    .get(url)
    .set("Cookie", session.cookie)
    .set("X-CSRF-Token", session.csrfToken);
}

/** Petición POST autenticada con cookie de sesión y token CSRF. */
function authPost(
  url: string,
  session: Pick<RegisteredTestUser, "cookie" | "csrfToken">,
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
  session: Pick<RegisteredTestUser, "cookie" | "csrfToken">,
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
  session: Pick<RegisteredTestUser, "cookie" | "csrfToken">,
  body?: Record<string, unknown>
) {
  const request = supertest(app)
    .put(url)
    .set("Cookie", session.cookie)
    .set("X-CSRF-Token", session.csrfToken);
  return body !== undefined ? request.send(body) : request;
}

/** Petición DELETE autenticada con cookie de sesión y token CSRF. */
function authDelete(
  url: string,
  session: Pick<RegisteredTestUser, "cookie" | "csrfToken">
) {
  return supertest(app)
    .delete(url)
    .set("Cookie", session.cookie)
    .set("X-CSRF-Token", session.csrfToken);
}

/** Helper para crear rápidamente un proyecto de prueba vía API. */
async function createTestProject(
  session: RegisteredTestUser,
  overrides: Record<string, unknown> = {}
): Promise<ProjectResponse> {
  const payload = {
    name: "Proyecto Scrum de Prueba",
    description: "Descripción inicial del proyecto",
    color: "#2563EB",
    categories: ["Frontend", "Backend", "Diseño UX"],
    ...overrides,
  };
  const response = await authPost("/api/projects", session, payload);
  assert.equal(
    response.status,
    201,
    `Error al crear proyecto base: ${JSON.stringify(response.body)}`
  );
  return response.body as ProjectResponse;
}

/** Helper para crear rápidamente un sprint de prueba vía API. */
async function createTestSprint(
  session: RegisteredTestUser,
  projectId: string,
  overrides: Record<string, unknown> = {}
): Promise<SprintResponse> {
  const payload = {
    projectId,
    name: "Sprint 1",
    ...overrides,
  };
  const response = await authPost("/api/sprints", session, payload);
  assert.equal(
    response.status,
    201,
    `Error al crear sprint base: ${JSON.stringify(response.body)}`
  );
  return response.body as SprintResponse;
}

/** Helper para crear rápidamente una actividad de prueba vía API. */
async function createTestActivity(
  session: RegisteredTestUser,
  projectId: string,
  overrides: Record<string, unknown> = {}
): Promise<ActivityResponse> {
  const payload = {
    projectId,
    title: "Actividad de prueba",
    dueDate: "2026-12-31",
    ...overrides,
  };
  const response = await authPost("/api/activities", session, payload);
  assert.equal(
    response.status,
    201,
    `Error al crear actividad base: ${JSON.stringify(response.body)}`
  );
  return response.body as ActivityResponse;
}

describe("Suite de pruebas RBAC Scrum, validaciones y anti-TOCTOU", () => {
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
  // Bloque 1: Aislamiento entre proyectos y usuarios externos
  // =========================================================================
  describe("Aislamiento entre proyectos y usuarios externos", () => {
    it("asigna al creador como único Admin en POST /api/projects", async () => {
      const admin = await registerTestUser();
      const response = await authPost("/api/projects", admin, {
        name: "Proyecto Alpha",
        description: "Proyecto con aislamiento estricto",
        color: "#10B981",
        categories: ["Investigación", "Desarrollo"],
      });

      assert.equal(response.status, 201);
      const project = response.body as ProjectResponse;
      assert.ok(project.id, "El proyecto creado debe retornar un id.");
      assert.equal(project.members.length, 1);
      assert.deepEqual(project.members[0], {
        userId: admin.user.id,
        role: "Admin",
      });

      const dbProject = await Project.findById(project.id);
      assert.ok(dbProject, "El proyecto debe existir en MongoDB.");
      assert.equal(dbProject.members.length, 1);
      assert.equal(dbProject.members[0]?.userId, admin.user.id);
      assert.equal(dbProject.members[0]?.role, "Admin");
    });

    it("impide que un usuario externo liste o consulte por ID un proyecto ajeno (404)", async () => {
      const admin = await registerTestUser();
      const externo = await registerTestUser();
      const project = await createTestProject(admin);

      const listResponse = await authGet("/api/projects", externo);
      assert.equal(listResponse.status, 200);
      const list = listResponse.body as ProjectResponse[];
      const found = list.some((item) => item.id === project.id);
      assert.equal(
        found,
        false,
        "El usuario externo no debe ver el proyecto ajeno en el listado."
      );

      const getResponse = await authGet(`/api/projects/${project.id}`, externo);
      assert.equal(getResponse.status, 404);
    });

    it("impide que un usuario externo liste o consulte sprints y actividades ajenas (404)", async () => {
      const admin = await registerTestUser();
      const externo = await registerTestUser();
      const project = await createTestProject(admin);
      const sprint = await createTestSprint(admin, project.id);
      const activity = await createTestActivity(admin, project.id, {
        sprintId: sprint.id,
      });

      const sprintsList = await authGet("/api/sprints", externo);
      assert.equal(sprintsList.status, 200);
      assert.equal(
        (sprintsList.body as SprintResponse[]).some((s) => s.id === sprint.id),
        false,
        "El externo no debe ver sprints de proyectos ajenos en el listado."
      );

      const sprintGet = await authGet(`/api/sprints/${sprint.id}`, externo);
      assert.equal(sprintGet.status, 404);

      const activitiesList = await authGet("/api/activities", externo);
      assert.equal(activitiesList.status, 200);
      assert.equal(
        (activitiesList.body as ActivityResponse[]).some(
          (a) => a.id === activity.id
        ),
        false,
        "El externo no debe ver actividades ajenas en el listado."
      );

      const activityGet = await authGet(
        `/api/activities/${activity.id}`,
        externo
      );
      assert.equal(activityGet.status, 404);
    });

    it("rechaza la creación de sprints y actividades en un proyecto ajeno por un usuario externo (404)", async () => {
      const admin = await registerTestUser();
      const externo = await registerTestUser();
      const project = await createTestProject(admin);

      const createSprint = await authPost("/api/sprints", externo, {
        projectId: project.id,
        name: "Sprint no autorizado",
      });
      assert.equal(createSprint.status, 404);

      const createActivity = await authPost("/api/activities", externo, {
        projectId: project.id,
        title: "Actividad no autorizada",
        dueDate: "2026-12-31",
      });
      assert.equal(createActivity.status, 404);
    });

    it("rechaza la modificación o eliminación de recursos ajenos por un usuario externo (404)", async () => {
      const admin = await registerTestUser();
      const externo = await registerTestUser();
      const project = await createTestProject(admin);
      const sprint = await createTestSprint(admin, project.id);
      const activity = await createTestActivity(admin, project.id, {
        sprintId: sprint.id,
      });

      const patchProject = await authPatch(
        `/api/projects/${project.id}`,
        externo,
        { name: "Intento de usurpación" }
      );
      assert.equal(patchProject.status, 404);

      const deleteProject = await authDelete(
        `/api/projects/${project.id}`,
        externo
      );
      assert.equal(deleteProject.status, 404);

      const patchSprint = await authPatch(
        `/api/sprints/${sprint.id}`,
        externo,
        { name: "Sprint modificado externamente" }
      );
      assert.equal(patchSprint.status, 404);

      const deleteSprint = await authDelete(
        `/api/sprints/${sprint.id}`,
        externo
      );
      assert.equal(deleteSprint.status, 404);

      const patchActivity = await authPatch(
        `/api/activities/${activity.id}`,
        externo,
        { title: "Actividad alterada" }
      );
      assert.equal(patchActivity.status, 404);

      const deleteActivity = await authDelete(
        `/api/activities/${activity.id}`,
        externo
      );
      assert.equal(deleteActivity.status, 404);
    });
  });

  // =========================================================================
  // Bloque 2: RBAC Admin vs Miembro en projects
  // =========================================================================
  describe("RBAC Admin vs Miembro en proyectos", () => {
    it("permite a un Admin invitar a un usuario como Miembro vía PATCH /api/projects/:id", async () => {
      const admin = await registerTestUser();
      const miembro = await registerTestUser();
      const project = await createTestProject(admin);

      const response = await authPatch(`/api/projects/${project.id}`, admin, {
        members: [
          { userId: admin.user.id, role: "Admin" },
          { userId: miembro.user.id, role: "Miembro" },
        ],
      });

      assert.equal(response.status, 200);
      const updated = response.body as ProjectResponse;
      assert.equal(updated.members.length, 2);
      assert.ok(
        updated.members.some(
          (m) => m.userId === miembro.user.id && m.role === "Miembro"
        )
      );
    });

    it("permite a un Miembro consultar el proyecto vía GET /api/projects y GET /api/projects/:id (200)", async () => {
      const admin = await registerTestUser();
      const miembro = await registerTestUser();
      const project = await createTestProject(admin);

      await authPatch(`/api/projects/${project.id}`, admin, {
        members: [
          { userId: admin.user.id, role: "Admin" },
          { userId: miembro.user.id, role: "Miembro" },
        ],
      });

      const listResponse = await authGet("/api/projects", miembro);
      assert.equal(listResponse.status, 200);
      assert.ok(
        (listResponse.body as ProjectResponse[]).some((p) => p.id === project.id)
      );

      const getResponse = await authGet(`/api/projects/${project.id}`, miembro);
      assert.equal(getResponse.status, 200);
      assert.equal((getResponse.body as ProjectResponse).id, project.id);
    });

    it("rechaza con 403 cuando un Miembro intenta editar el proyecto (name, description, color, categories, links, members)", async () => {
      const admin = await registerTestUser();
      const miembro = await registerTestUser();
      const project = await createTestProject(admin, {
        name: "Proyecto Intacto",
        description: "Descripción original",
        color: "#2563EB",
        categories: ["Frontend", "Backend"],
      });

      await authPatch(`/api/projects/${project.id}`, admin, {
        members: [
          { userId: admin.user.id, role: "Admin" },
          { userId: miembro.user.id, role: "Miembro" },
        ],
      });

      const intents: Array<Record<string, unknown>> = [
        { name: "Nuevo Nombre Ilegal" },
        { description: "Descripción ilegal por miembro" },
        { color: "#DC2626" },
        { categories: ["Hack"] },
        {
          links: [
            {
              id: "link-1",
              title: "Repo",
              url: "https://ejemplo.com/repo",
              category: "repositorio",
            },
          ],
        },
        {
          members: [
            { userId: admin.user.id, role: "Miembro" },
            { userId: miembro.user.id, role: "Admin" },
          ],
        },
      ];

      for (const payload of intents) {
        const patchRes = await authPatch(
          `/api/projects/${project.id}`,
          miembro,
          payload
        );
        assert.equal(
          patchRes.status,
          403,
          `Se esperaba 403 al intentar PATCH ${JSON.stringify(payload)} como Miembro, se recibió ${patchRes.status}.`
        );
      }

      // Verificamos también con PUT
      const putRes = await authPut(`/api/projects/${project.id}`, miembro, {
        name: "Intento con PUT",
        color: "#10B981",
      });
      assert.equal(
        putRes.status,
        403,
        `Se esperaba 403 al intentar PUT como Miembro, se recibió ${putRes.status}.`
      );

      // Verificamos que el documento en BD no haya sido modificado
      const dbProject = await Project.findById(project.id);
      assert.ok(dbProject);
      assert.equal(dbProject.name, "Proyecto Intacto");
      assert.equal(dbProject.description, "Descripción original");
      assert.equal(dbProject.color, "#2563EB");
      assert.deepEqual(dbProject.categories, ["Frontend", "Backend"]);
    });

    it("rechaza con 403 cuando un Miembro intenta DELETE /api/projects/:id y conserva los datos en BD", async () => {
      const admin = await registerTestUser();
      const miembro = await registerTestUser();
      const project = await createTestProject(admin);
      const sprint = await createTestSprint(admin, project.id);
      const activity = await createTestActivity(admin, project.id, {
        sprintId: sprint.id,
      });

      await authPatch(`/api/projects/${project.id}`, admin, {
        members: [
          { userId: admin.user.id, role: "Admin" },
          { userId: miembro.user.id, role: "Miembro" },
        ],
      });

      const deleteRes = await authDelete(
        `/api/projects/${project.id}`,
        miembro
      );
      assert.equal(deleteRes.status, 403);

      const dbProject = await Project.findById(project.id);
      assert.ok(dbProject, "El proyecto debe seguir existiendo en BD.");

      const dbSprint = await Sprint.findById(sprint.id);
      assert.ok(dbSprint, "El sprint debe seguir existiendo en BD.");

      const dbActivity = await Activity.findById(activity.id);
      assert.ok(dbActivity, "La actividad debe seguir existiendo en BD.");
    });

    it("rechaza con 400 dejar el proyecto sin al menos un Admin", async () => {
      const admin = await registerTestUser();
      const miembro = await registerTestUser();
      const project = await createTestProject(admin);

      // Intentar degradar al único admin sin dejar ningún otro admin
      const response = await authPatch(`/api/projects/${project.id}`, admin, {
        members: [
          { userId: admin.user.id, role: "Miembro" },
          { userId: miembro.user.id, role: "Miembro" },
        ],
      });
      assert.equal(response.status, 400);

      // Intentar enviar lista vacía de miembros
      const emptyRes = await authPatch(`/api/projects/${project.id}`, admin, {
        members: [],
      });
      assert.equal(emptyRes.status, 400);
    });
  });

  // =========================================================================
  // Bloque 3: RBAC Admin vs Miembro en sprints + cascada
  // =========================================================================
  describe("RBAC Admin vs Miembro en sprints y cascada", () => {
    it("permite a un Admin crear (201) y renombrar (200) sprints", async () => {
      const admin = await registerTestUser();
      const project = await createTestProject(admin);

      const createRes = await authPost("/api/sprints", admin, {
        projectId: project.id,
        name: "Sprint Alpha",
      });
      assert.equal(createRes.status, 201);
      const sprint = createRes.body as SprintResponse;
      assert.equal(sprint.name, "Sprint Alpha");

      const renameRes = await authPatch(`/api/sprints/${sprint.id}`, admin, {
        name: "Sprint Alpha Renombrado",
      });
      assert.equal(renameRes.status, 200);
      assert.equal(
        (renameRes.body as SprintResponse).name,
        "Sprint Alpha Renombrado"
      );

      const dbSprint = await Sprint.findById(sprint.id);
      assert.ok(dbSprint);
      assert.equal(dbSprint.name, "Sprint Alpha Renombrado");
    });

    it("rechaza con 403 cuando un Miembro intenta POST, PATCH, PUT o DELETE de sprints", async () => {
      const admin = await registerTestUser();
      const miembro = await registerTestUser();
      const project = await createTestProject(admin);
      const sprint = await createTestSprint(admin, project.id, {
        name: "Sprint Intacto",
      });
      const activity = await createTestActivity(admin, project.id, {
        sprintId: sprint.id,
      });

      await authPatch(`/api/projects/${project.id}`, admin, {
        members: [
          { userId: admin.user.id, role: "Admin" },
          { userId: miembro.user.id, role: "Miembro" },
        ],
      });

      // Miembro intenta crear sprint
      const postRes = await authPost("/api/sprints", miembro, {
        projectId: project.id,
        name: "Sprint Prohibido",
      });
      assert.equal(postRes.status, 403);

      // Miembro intenta editar sprint con PATCH
      const patchRes = await authPatch(`/api/sprints/${sprint.id}`, miembro, {
        name: "Sprint Alterado",
      });
      assert.equal(patchRes.status, 403);

      // Miembro intenta editar sprint con PUT
      const putRes = await authPut(`/api/sprints/${sprint.id}`, miembro, {
        projectId: project.id,
        name: "Sprint Alterado PUT",
      });
      assert.equal(putRes.status, 403);

      // Miembro intenta eliminar sprint
      const deleteRes = await authDelete(`/api/sprints/${sprint.id}`, miembro);
      assert.equal(deleteRes.status, 403);

      // Comprobar que en BD el sprint y su actividad sigan intactos
      const dbSprint = await Sprint.findById(sprint.id);
      assert.ok(dbSprint);
      assert.equal(dbSprint.name, "Sprint Intacto");

      const dbActivity = await Activity.findById(activity.id);
      assert.ok(dbActivity);
      assert.equal(dbActivity.sprintId, sprint.id);
    });

    it("al borrar un sprint como Admin (204), desvincula actividades (sprintId='') sin tocar otros sprints ni proyectos", async () => {
      const admin1 = await registerTestUser();
      const admin2 = await registerTestUser();

      // Proyecto 1 con dos sprints
      const project1 = await createTestProject(admin1, { name: "Proyecto 1" });
      const sprint1A = await createTestSprint(admin1, project1.id, {
        name: "Sprint 1A",
      });
      const sprint1B = await createTestSprint(admin1, project1.id, {
        name: "Sprint 1B",
      });

      const act1A = await createTestActivity(admin1, project1.id, {
        title: "Actividad 1A",
        sprintId: sprint1A.id,
      });
      const act1B = await createTestActivity(admin1, project1.id, {
        title: "Actividad 1B",
        sprintId: sprint1B.id,
      });

      // Proyecto 2 con su propio sprint y actividad
      const project2 = await createTestProject(admin2, { name: "Proyecto 2" });
      const sprint2A = await createTestSprint(admin2, project2.id, {
        name: "Sprint 2A",
      });
      const act2A = await createTestActivity(admin2, project2.id, {
        title: "Actividad 2A",
        sprintId: sprint2A.id,
      });

      // Admin 1 elimina el sprint 1A
      const deleteRes = await authDelete(
        `/api/sprints/${sprint1A.id}`,
        admin1
      );
      assert.equal(deleteRes.status, 204);

      // El sprint 1A fue eliminado
      const dbSprint1A = await Sprint.findById(sprint1A.id);
      assert.equal(dbSprint1A, null);

      // La actividad asociada pasó a tener sprintId: ""
      const dbAct1A = await Activity.findById(act1A.id);
      assert.ok(dbAct1A);
      assert.equal(dbAct1A.sprintId, "");

      // El sprint 1B y su actividad permanecen intactos
      const dbSprint1B = await Sprint.findById(sprint1B.id);
      assert.ok(dbSprint1B);
      const dbAct1B = await Activity.findById(act1B.id);
      assert.ok(dbAct1B);
      assert.equal(dbAct1B.sprintId, sprint1B.id);

      // Proyecto 2 permanece intacto
      const dbSprint2A = await Sprint.findById(sprint2A.id);
      assert.ok(dbSprint2A);
      const dbAct2A = await Activity.findById(act2A.id);
      assert.ok(dbAct2A);
      assert.equal(dbAct2A.sprintId, sprint2A.id);
    });
  });

  // =========================================================================
  // Bloque 4: Actividades (activities) y validación de Activity.category
  // =========================================================================
  describe("Actividades (activities) y validación de Activity.category", () => {
    it("permite tanto a Admin como a Miembro crear, leer, editar y eliminar actividades de su proyecto", async () => {
      const admin = await registerTestUser();
      const miembro = await registerTestUser();
      const project = await createTestProject(admin, {
        categories: ["Backend", "Frontend"],
      });

      await authPatch(`/api/projects/${project.id}`, admin, {
        members: [
          { userId: admin.user.id, role: "Admin" },
          { userId: miembro.user.id, role: "Miembro" },
        ],
      });

      // Admin crea una actividad
      const actAdminRes = await authPost("/api/activities", admin, {
        projectId: project.id,
        title: "Actividad Creada por Admin",
        category: "Backend",
        dueDate: "2026-12-31",
      });
      assert.equal(actAdminRes.status, 201);
      const actAdmin = actAdminRes.body as ActivityResponse;

      // Miembro crea una actividad
      const actMiembroRes = await authPost("/api/activities", miembro, {
        projectId: project.id,
        title: "Actividad Creada por Miembro",
        category: "Frontend",
        dueDate: "2026-12-31",
      });
      assert.equal(actMiembroRes.status, 201);
      const actMiembro = actMiembroRes.body as ActivityResponse;

      // Miembro lee listado y consulta individual
      const listRes = await authGet("/api/activities", miembro);
      assert.equal(listRes.status, 200);
      const list = listRes.body as ActivityResponse[];
      assert.ok(list.some((a) => a.id === actAdmin.id));
      assert.ok(list.some((a) => a.id === actMiembro.id));

      const getRes = await authGet(`/api/activities/${actAdmin.id}`, miembro);
      assert.equal(getRes.status, 200);

      // Miembro edita la actividad creada por el Admin
      const patchByMiembro = await authPatch(
        `/api/activities/${actAdmin.id}`,
        miembro,
        {
          title: "Actividad Admin Actualizada por Miembro",
          status: "En curso",
        }
      );
      assert.equal(patchByMiembro.status, 200);
      assert.equal(
        (patchByMiembro.body as ActivityResponse).title,
        "Actividad Admin Actualizada por Miembro"
      );

      // Admin edita la actividad creada por el Miembro
      const patchByAdmin = await authPatch(
        `/api/activities/${actMiembro.id}`,
        admin,
        { priority: "Critica" }
      );
      assert.equal(patchByAdmin.status, 200);
      assert.equal(
        (patchByAdmin.body as ActivityResponse).priority,
        "Critica"
      );

      // Miembro elimina su actividad
      const delMiembro = await authDelete(
        `/api/activities/${actMiembro.id}`,
        miembro
      );
      assert.equal(delMiembro.status, 204);
      assert.equal(await Activity.findById(actMiembro.id), null);

      // Admin elimina la otra actividad
      const delAdmin = await authDelete(
        `/api/activities/${actAdmin.id}`,
        admin
      );
      assert.equal(delAdmin.status, 204);
      assert.equal(await Activity.findById(actAdmin.id), null);
    });

    it("acepta category vacía (''), omitida o presente en project.categories (con trim normalizado)", async () => {
      const admin = await registerTestUser();
      const project = await createTestProject(admin, {
        categories: ["Frontend", "Backend", "Diseño UX"],
      });

      // 1. Omitida
      const resOmitida = await authPost("/api/activities", admin, {
        projectId: project.id,
        title: "Actividad sin categoría",
        dueDate: "2026-12-31",
      });
      assert.equal(resOmitida.status, 201);
      assert.equal((resOmitida.body as ActivityResponse).category, "");

      // 2. Explícitamente vacía ""
      const resVacia = await authPost("/api/activities", admin, {
        projectId: project.id,
        title: "Actividad con cadena vacía",
        category: "",
        dueDate: "2026-12-31",
      });
      assert.equal(resVacia.status, 201);
      assert.equal((resVacia.body as ActivityResponse).category, "");

      // 3. Categoría exacta existente
      const resFrontend = await authPost("/api/activities", admin, {
        projectId: project.id,
        title: "Actividad Frontend",
        category: "Frontend",
        dueDate: "2026-12-31",
      });
      assert.equal(resFrontend.status, 201);
      assert.equal((resFrontend.body as ActivityResponse).category, "Frontend");

      // 4. Categoría existente con espacios alrededor normalizados con trim
      const resTrim = await authPost("/api/activities", admin, {
        projectId: project.id,
        title: "Actividad Backend con espacios",
        category: "  Backend  ",
        dueDate: "2026-12-31",
      });
      assert.equal(resTrim.status, 201);
      assert.equal(
        (resTrim.body as ActivityResponse).category.trim(),
        "Backend"
      );

      // 5. Actualización vía PATCH a otra categoría válida
      const resPatchValido = await authPatch(
        `/api/activities/${(resFrontend.body as ActivityResponse).id}`,
        admin,
        { category: "Diseño UX" }
      );
      assert.equal(resPatchValido.status, 200);
      assert.equal(
        (resPatchValido.body as ActivityResponse).category,
        "Diseño UX"
      );

      // 6. Actualización vía PATCH a cadena vacía
      const resPatchVacio = await authPatch(
        `/api/activities/${(resFrontend.body as ActivityResponse).id}`,
        admin,
        { category: "" }
      );
      assert.equal(resPatchVacio.status, 200);
      assert.equal((resPatchVacio.body as ActivityResponse).category, "");
    });

    it("rechaza con 400 una categoría que no pertenece a project.categories en POST y PATCH", async () => {
      const admin = await registerTestUser();
      const project = await createTestProject(admin, {
        categories: ["Frontend", "Backend"],
      });
      const validActivity = await createTestActivity(admin, project.id, {
        category: "Frontend",
      });

      // POST con categoría inexistente
      const postInexistente = await authPost("/api/activities", admin, {
        projectId: project.id,
        title: "Categoría fuera de lista",
        category: "DevOps",
        dueDate: "2026-12-31",
      });
      assert.equal(
        postInexistente.status,
        400,
        "Debe rechazar con 400 una categoría no declarada en el proyecto."
      );

      // POST con categoría con diferente casing o no coincidente
      const postDiferente = await authPost("/api/activities", admin, {
        projectId: project.id,
        title: "Categoría no exacta",
        category: "frontend",
        dueDate: "2026-12-31",
      });
      assert.equal(postDiferente.status, 400);

      // PATCH con categoría inexistente
      const patchInexistente = await authPatch(
        `/api/activities/${validActivity.id}`,
        admin,
        { category: "Infraestructura" }
      );
      assert.equal(
        patchInexistente.status,
        400,
        "Debe rechazar con 400 en PATCH una categoría ajena al proyecto."
      );
    });

    it("rechaza con 400 valores no string (null o número) en category tanto en POST como en PATCH", async () => {
      const admin = await registerTestUser();
      const project = await createTestProject(admin, {
        categories: ["Frontend"],
      });
      const validActivity = await createTestActivity(admin, project.id, {
        category: "Frontend",
      });

      // POST con null o número
      const postNull = await authPost("/api/activities", admin, {
        projectId: project.id,
        title: "Categoría null",
        category: null,
        dueDate: "2026-12-31",
      });
      assert.equal(postNull.status, 400);

      const postNumero = await authPost("/api/activities", admin, {
        projectId: project.id,
        title: "Categoría numérica",
        category: 123,
        dueDate: "2026-12-31",
      });
      assert.equal(postNumero.status, 400);

      // PATCH con null o número
      const patchNull = await authPatch(
        `/api/activities/${validActivity.id}`,
        admin,
        { category: null }
      );
      assert.equal(patchNull.status, 400);

      const patchNumero = await authPatch(
        `/api/activities/${validActivity.id}`,
        admin,
        { category: 456 }
      );
      assert.equal(patchNumero.status, 400);
    });
  });

  // =========================================================================
  // Bloque 5: Limpieza automática en servidor al actualizar proyecto (PATCH)
  // =========================================================================
  describe("Limpieza automática en servidor al actualizar proyecto (PATCH /api/projects/:id)", () => {
    it("al quitar a un miembro del proyecto, remueve su userId de Activity.members conservando otros responsables", async () => {
      const admin = await registerTestUser();
      const miembro1 = await registerTestUser();
      const miembro2 = await registerTestUser();
      const project = await createTestProject(admin);

      // Invitar a miembro1 y miembro2
      await authPatch(`/api/projects/${project.id}`, admin, {
        members: [
          { userId: admin.user.id, role: "Admin" },
          { userId: miembro1.user.id, role: "Miembro" },
          { userId: miembro2.user.id, role: "Miembro" },
        ],
      });

      // Actividad con los 3 miembros asignados
      const act1 = await createTestActivity(admin, project.id, {
        title: "Actividad compartida",
        members: [admin.user.id, miembro1.user.id, miembro2.user.id],
      });

      // Actividad con solo miembro1
      const act2 = await createTestActivity(admin, project.id, {
        title: "Actividad individual de miembro1",
        members: [miembro1.user.id],
      });

      // Crear otro proyecto independiente donde miembro1 también sea asignado
      const adminExterno = await registerTestUser();
      const projectOtro = await createTestProject(adminExterno);
      await authPatch(`/api/projects/${projectOtro.id}`, adminExterno, {
        members: [
          { userId: adminExterno.user.id, role: "Admin" },
          { userId: miembro1.user.id, role: "Miembro" },
        ],
      });
      const actOtro = await createTestActivity(adminExterno, projectOtro.id, {
        title: "Actividad de otro proyecto",
        members: [miembro1.user.id],
      });

      // Admin remueve a miembro1 del primer proyecto
      const patchRes = await authPatch(`/api/projects/${project.id}`, admin, {
        members: [
          { userId: admin.user.id, role: "Admin" },
          { userId: miembro2.user.id, role: "Miembro" },
        ],
      });
      assert.equal(patchRes.status, 200);

      // En act1, miembro1 fue removido pero se conservan admin y miembro2
      const dbAct1 = await Activity.findById(act1.id);
      assert.ok(dbAct1);
      assert.deepEqual(dbAct1.members.slice().sort(), [
        admin.user.id,
        miembro2.user.id,
      ].sort());

      // En act2, miembros queda vacío
      const dbAct2 = await Activity.findById(act2.id);
      assert.ok(dbAct2);
      assert.deepEqual(dbAct2.members, []);

      // En el otro proyecto, la actividad no sufrió modificaciones
      const dbActOtro = await Activity.findById(actOtro.id);
      assert.ok(dbActOtro);
      assert.deepEqual(dbActOtro.members, [miembro1.user.id]);
    });

    it("al eliminar una categoría del proyecto, limpia category a '' en las actividades del proyecto que la usaban", async () => {
      const admin = await registerTestUser();
      const project = await createTestProject(admin, {
        categories: ["Frontend", "Backend", "QA"],
      });

      const actBackend = await createTestActivity(admin, project.id, {
        title: "Actividad Backend",
        category: "Backend",
      });
      const actFrontend = await createTestActivity(admin, project.id, {
        title: "Actividad Frontend",
        category: "Frontend",
      });

      // Proyecto secundario que también usa la categoría Backend
      const admin2 = await registerTestUser();
      const project2 = await createTestProject(admin2, {
        categories: ["Backend"],
      });
      const act2Backend = await createTestActivity(admin2, project2.id, {
        title: "Actividad Proyecto 2 Backend",
        category: "Backend",
      });

      // Admin del primer proyecto elimina "Backend" de las categorías
      const patchRes = await authPatch(`/api/projects/${project.id}`, admin, {
        categories: ["Frontend", "QA"],
      });
      assert.equal(patchRes.status, 200);

      // La actividad que usaba Backend pasa a category: ""
      const dbActBackend = await Activity.findById(actBackend.id);
      assert.ok(dbActBackend);
      assert.equal(dbActBackend.category, "");

      // La actividad con Frontend no se modifica
      const dbActFrontend = await Activity.findById(actFrontend.id);
      assert.ok(dbActFrontend);
      assert.equal(dbActFrontend.category, "Frontend");

      // La actividad del segundo proyecto conserva su categoría intacta
      const dbAct2Backend = await Activity.findById(act2Backend.id);
      assert.ok(dbAct2Backend);
      assert.equal(dbAct2Backend.category, "Backend");
    });

    it("no altera las actividades en BD si PATCH /api/projects/:id falla validación", async () => {
      const admin = await registerTestUser();
      const miembro = await registerTestUser();
      const project = await createTestProject(admin, {
        categories: ["Frontend", "DevOps"],
      });

      await authPatch(`/api/projects/${project.id}`, admin, {
        members: [
          { userId: admin.user.id, role: "Admin" },
          { userId: miembro.user.id, role: "Miembro" },
        ],
      });

      const activity = await createTestActivity(admin, project.id, {
        title: "Actividad antes del intento fallido",
        category: "DevOps",
        members: [miembro.user.id],
      });

      // Intentar actualizar quitando a miembro y categoría DevOps pero con color inválido
      const patchFallido = await authPatch(`/api/projects/${project.id}`, admin, {
        color: "color-hex-invalido",
        categories: ["Frontend"],
        members: [{ userId: admin.user.id, role: "Admin" }],
      });
      assert.equal(patchFallido.status, 400);

      // Comprobar que en BD la actividad conserve su categoría y responsable
      const dbActivity = await Activity.findById(activity.id);
      assert.ok(dbActivity);
      assert.equal(dbActivity.category, "DevOps");
      assert.deepEqual(dbActivity.members, [miembro.user.id]);
    });
  });

  // =========================================================================
  // Bloque 6: Borrado de proyecto, cascada y protección atómica anti-TOCTOU
  // =========================================================================
  describe("Borrado de proyecto, cascada y protección atómica anti-TOCTOU", () => {
    it("elimina el proyecto, todos sus sprints y actividades en cascada al ser borrado por Admin sin tocar otros", async () => {
      const admin1 = await registerTestUser();
      const admin2 = await registerTestUser();

      const proj1 = await createTestProject(admin1, { name: "Proyecto 1" });
      const sprint1 = await createTestSprint(admin1, proj1.id, {
        name: "Sprint 1",
      });
      const act1 = await createTestActivity(admin1, proj1.id, {
        title: "Actividad 1",
        sprintId: sprint1.id,
      });

      const proj2 = await createTestProject(admin2, { name: "Proyecto 2" });
      const sprint2 = await createTestSprint(admin2, proj2.id, {
        name: "Sprint 2",
      });
      const act2 = await createTestActivity(admin2, proj2.id, {
        title: "Actividad 2",
        sprintId: sprint2.id,
      });

      // Admin 1 elimina el proyecto 1
      const deleteRes = await authDelete(`/api/projects/${proj1.id}`, admin1);
      assert.equal(deleteRes.status, 204);

      // Proyecto 1 y sus dependencias deben haber sido eliminados
      assert.equal(await Project.findById(proj1.id), null);
      assert.equal(await Sprint.findById(sprint1.id), null);
      assert.equal(await Activity.findById(act1.id), null);

      // Proyecto 2 y sus dependencias deben seguir existiendo intactos
      const dbProj2 = await Project.findById(proj2.id);
      assert.ok(dbProj2);
      const dbSprint2 = await Sprint.findById(sprint2.id);
      assert.ok(dbSprint2);
      const dbAct2 = await Activity.findById(act2.id);
      assert.ok(dbAct2);
    });

    it("bloquea la eliminación y preserva los datos ante degradación concurrente a Miembro (protección anti-TOCTOU)", async () => {
      const admin1 = await registerTestUser();
      const admin2 = await registerTestUser();

      const project = await createTestProject(admin1, {
        name: "Proyecto Concurrente TOCTOU",
      });

      // Añadir a admin2 como Admin
      await authPatch(`/api/projects/${project.id}`, admin1, {
        members: [
          { userId: admin1.user.id, role: "Admin" },
          { userId: admin2.user.id, role: "Admin" },
        ],
      });

      const sprint = await createTestSprint(admin1, project.id, {
        name: "Sprint Crítico",
      });
      const activity = await createTestActivity(admin1, project.id, {
        title: "Actividad Crítica",
        sprintId: sprint.id,
      });

      // Guardamos la referencia al método findOneAndDelete original
      const originalFindOneAndDelete = Project.findOneAndDelete;

      try {
        // Envolvemos findOneAndDelete para simular la degradación concurrente
        // justo antes de ejecutar la eliminación atómica en MongoDB.
        (Project as unknown as { findOneAndDelete: unknown }).findOneAndDelete =
          function (
            this: unknown,
            ...args: Parameters<typeof originalFindOneAndDelete>
          ) {
            return (async () => {
              // Simulamos que en este preciso instante admin2 degrada a admin1 a "Miembro"
              await Project.updateOne(
                { _id: project.id, "members.userId": admin1.user.id },
                { $set: { "members.$.role": "Miembro" } }
              );

              // Procedemos con la llamada atómica original de findOneAndDelete
              return (
                originalFindOneAndDelete as (
                  ...a: unknown[]
                ) => Promise<unknown>
              ).apply(this, args);
            })();
          };

        // admin1 solicita DELETE /api/projects/:id
        const deleteResponse = await authDelete(
          `/api/projects/${project.id}`,
          admin1
        );

        // El servidor debe responder 403 (o rechazar la eliminación)
        assert.equal(
          deleteResponse.status,
          403,
          `Se esperaba 403 por degradación concurrente anti-TOCTOU, se recibió ${deleteResponse.status}.`
        );

        // Verificar que el proyecto, sprint y actividad sigan existiendo intactos en MongoDB
        const dbProject = await Project.findById(project.id);
        assert.ok(
          dbProject,
          "El proyecto no debe ser eliminado si el usuario ya no es Admin."
        );

        const dbSprint = await Sprint.findById(sprint.id);
        assert.ok(
          dbSprint,
          "El sprint no debe ser eliminado si la eliminación del proyecto falló."
        );

        const dbActivity = await Activity.findById(activity.id);
        assert.ok(
          dbActivity,
          "La actividad no debe ser eliminada si la eliminación del proyecto falló."
        );
      } finally {
        // Restaurar incondicionalmente el método original de Mongoose
        Project.findOneAndDelete = originalFindOneAndDelete;
      }
    });
  });
});
