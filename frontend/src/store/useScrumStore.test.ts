import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity, Project, Sprint, User } from "../types";

vi.mock("../api/client", () => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  restoreSession: vi.fn().mockResolvedValue(null),
  onSessionExpired: vi.fn(() => () => {}),
  describeError: (error: unknown) =>
    error instanceof Error ? error.message : "Ocurrió un error inesperado.",
}));

import * as api from "../api/client";
import { useAuthStore } from "./useAuthStore";
import { useOrganizerStore } from "./useOrganizerStore";
import { useScrumStore } from "./useScrumStore";

const usuarioReset: User = {
  id: "__reset__",
  username: "reset",
  name: "Reset",
  lastName: "Reset",
  initials: "RR",
  avatarColor: "#000000",
};

const usuarioAdmin: User = {
  id: "u1",
  username: "ana",
  name: "Ana",
  lastName: "Admin",
  mail: "ana@uc.cl",
  initials: "AA",
  avatarColor: "#4f7cff",
};

const usuarioMiembro: User = {
  id: "u2",
  username: "beto",
  name: "Beto",
  lastName: "Miembro",
  mail: "beto@uc.cl",
  initials: "BM",
  avatarColor: "#2dd67b",
};

const usuarioInvitado: User = {
  id: "u3",
  username: "carla",
  name: "Carla",
  lastName: "Invitada",
  mail: "carla@uc.cl",
  initials: "CI",
  avatarColor: "#ff7a45",
};

const proyectosBase: Project[] = [
  {
    id: "p1",
    name: "Proyecto Alpha",
    description: "Tablero principal",
    color: "#4f7cff",
    course: "IIC2143",
    categories: ["General", "Backend"],
    members: [
      { userId: "u1", role: "Admin" },
      { userId: "u2", role: "Miembro" },
    ],
    links: [
      {
        id: "link-1",
        title: "Repositorio",
        url: "https://github.com/org/alpha",
        category: "repositorio",
      },
    ],
  },
  {
    id: "p2",
    name: "Proyecto Beta",
    description: "Segundo tablero",
    color: "#2dd67b",
    course: "IIC2513",
    categories: ["General"],
    members: [{ userId: "u1", role: "Admin" }],
  },
];

const sprintsBase: Sprint[] = [
  { id: "s1", projectId: "p1", name: "Sprint 1" },
  { id: "s2", projectId: "p1", name: "Sprint 2" },
  { id: "s3", projectId: "p2", name: "Sprint 1 Beta" },
];

const actividadesBase: Activity[] = [
  {
    id: "a1",
    projectId: "p1",
    sprintId: "s1",
    title: "Diseñar esquema",
    description: "",
    category: "Backend",
    members: ["u1", "u2"],
    priority: "Alta",
    status: "Pendiente",
    hours: 3,
    dueDate: "2026-12-01",
    order: 0,
  },
  {
    id: "a2",
    projectId: "p1",
    sprintId: "s1",
    title: "Configurar rutas",
    description: "",
    category: "Backend",
    members: ["u2"],
    priority: "Media",
    status: "En curso",
    hours: 4,
    dueDate: "2026-12-03",
    order: 1,
  },
  {
    id: "a3",
    projectId: "p1",
    sprintId: "s2",
    title: "Pruebas de integración",
    description: "",
    category: "General",
    members: ["u1"],
    priority: "Baja",
    status: "Pendiente",
    hours: 2,
    dueDate: "2026-12-05",
    order: 2,
  },
  {
    id: "a4",
    projectId: "p2",
    sprintId: "s3",
    title: "Maquetar vista",
    description: "",
    category: "General",
    members: ["u2"],
    priority: "Media",
    status: "Pendiente",
    hours: 5,
    dueDate: "2026-12-06",
    order: 10,
  },
];

function crearPromesaDiferida<T>() {
  let resolver!: (valor: T) => void;
  let rechazar!: (motivo?: unknown) => void;
  const promesa = new Promise<T>((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
}

function configurarListasScrum() {
  vi.mocked(api.list).mockImplementation(async (recurso: string) => {
    switch (recurso) {
      case "projects":
        return proyectosBase;
      case "sprints":
        return sprintsBase;
      case "activities":
        return actividadesBase;
      case "users":
        return [usuarioAdmin, usuarioMiembro];
      default:
        return [];
    }
  });
}

describe("useScrumStore", () => {
  beforeAll(async () => {
    // Espera a que termine el restoreSession() automático de useAuthStore.
    await vi.waitFor(() => {
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Fuerza transición de user.id para limpiar inflightLoad, sessionEpoch y ambos stores.
    useAuthStore.setState({ user: usuarioReset, loading: false });
    useAuthStore.setState({ user: null, loading: false });
    useAuthStore.setState({ user: usuarioAdmin, loading: false });
  });

  describe("ensureLoaded y refetch", () => {
    it("carga projects, sprints, activities y users y evita recargas si ya está cargado", async () => {
      configurarListasScrum();

      await useScrumStore.getState().ensureLoaded();

      expect(api.list).toHaveBeenCalledTimes(4);
      expect(api.list).toHaveBeenCalledWith("projects");
      expect(api.list).toHaveBeenCalledWith("sprints");
      expect(api.list).toHaveBeenCalledWith("activities");
      expect(api.list).toHaveBeenCalledWith("users");

      const estado = useScrumStore.getState();
      expect(estado.loaded).toBe(true);
      expect(estado.loading).toBe(false);
      expect(estado.loadError).toBeNull();
      expect(estado.projects).toEqual(proyectosBase);
      expect(estado.sprints).toEqual(sprintsBase);
      expect(estado.activities).toEqual(actividadesBase);
      expect(estado.users).toEqual([usuarioAdmin, usuarioMiembro]);

      await useScrumStore.getState().ensureLoaded();
      expect(api.list).toHaveBeenCalledTimes(4);
    });

    it("reutiliza projects y activities si useOrganizerStore ya está cargado", async () => {
      useOrganizerStore.setState({
        projects: proyectosBase,
        activities: actividadesBase,
        loaded: true,
        loading: false,
      });

      vi.mocked(api.list).mockImplementation(async (recurso: string) => {
        if (recurso === "sprints") return sprintsBase;
        if (recurso === "users") return [usuarioAdmin, usuarioMiembro];
        throw new Error(`No debería solicitar ${recurso}`);
      });

      await useScrumStore.getState().ensureLoaded();

      expect(api.list).toHaveBeenCalledTimes(2);
      expect(api.list).toHaveBeenCalledWith("sprints");
      expect(api.list).toHaveBeenCalledWith("users");
      expect(api.list).not.toHaveBeenCalledWith("projects");
      expect(api.list).not.toHaveBeenCalledWith("activities");

      const estado = useScrumStore.getState();
      expect(estado.projects).toEqual(proyectosBase);
      expect(estado.activities).toEqual(actividadesBase);
      expect(estado.loaded).toBe(true);
    });

    it("deduplica llamadas concurrentes a ensureLoaded", async () => {
      const diferido = crearPromesaDiferida<unknown[]>();
      vi.mocked(api.list).mockReturnValue(diferido.promesa);

      const p1 = useScrumStore.getState().ensureLoaded();
      const p2 = useScrumStore.getState().ensureLoaded();

      expect(p1).toBe(p2);
      expect(api.list).toHaveBeenCalledTimes(4);

      diferido.resolver([]);
      await Promise.all([p1, p2]);
      expect(useScrumStore.getState().loaded).toBe(true);
    });

    it("refetch fuerza la carga de todas las colecciones y limpia errores previos", async () => {
      useOrganizerStore.setState({ loaded: true, loading: false });
      useScrumStore.setState({ loaded: true, loading: false, loadError: "Error previo" });
      configurarListasScrum();

      await useScrumStore.getState().refetch();

      expect(api.list).toHaveBeenCalledTimes(4);
      expect(useScrumStore.getState().loadError).toBeNull();
      expect(useScrumStore.getState().projects).toEqual(proyectosBase);
    });
  });

  describe("addActivity, updateActivity y deleteActivity", () => {
    it("addActivity calcula el order siguiente dentro del proyecto", async () => {
      useScrumStore.setState({
        projects: proyectosBase,
        activities: actividadesBase,
        loaded: true,
        loading: false,
      });

      const nuevaSinOrder: Omit<Activity, "id" | "projectId"> = {
        sprintId: "s1",
        title: "Documentar endpoints",
        description: "Swagger",
        category: "Backend",
        members: ["u1"],
        priority: "Media",
        status: "Pendiente",
        hours: 2,
        dueDate: "2026-12-08",
      };
      const creada: Activity = {
        ...nuevaSinOrder,
        id: "a5",
        projectId: "p1",
        order: 3,
      };
      vi.mocked(api.create).mockResolvedValueOnce(creada);

      const resultado = await useScrumStore.getState().addActivity("p1", nuevaSinOrder);

      expect(resultado).toEqual(creada);
      // En p1 el máximo order es 2 (a3); ignora el 10 de p2.
      expect(api.create).toHaveBeenCalledWith("activities", {
        ...nuevaSinOrder,
        projectId: "p1",
        order: 3,
      });
      expect(useScrumStore.getState().activities).toContainEqual(creada);
    });

    it("addActivity inicia en order 0 cuando el proyecto aún no tiene actividades", async () => {
      useScrumStore.setState({
        projects: proyectosBase,
        activities: [],
        loaded: true,
        loading: false,
      });

      const entrada: Omit<Activity, "id" | "projectId"> = {
        sprintId: "s1",
        title: "Primera tarea",
        description: "",
        category: "General",
        members: [],
        priority: "Baja",
        status: "Pendiente",
        hours: 1,
        dueDate: "2026-12-01",
      };
      const creada: Activity = { ...entrada, id: "a-primera", projectId: "p1", order: 0 };
      vi.mocked(api.create).mockResolvedValueOnce(creada);

      await useScrumStore.getState().addActivity("p1", entrada);

      expect(api.create).toHaveBeenCalledWith("activities", {
        ...entrada,
        projectId: "p1",
        order: 0,
      });
    });

    it("updateActivity y deleteActivity actualizan y eliminan la actividad en memoria", async () => {
      useScrumStore.setState({
        activities: actividadesBase,
        loaded: true,
        loading: false,
      });

      const a1Editada: Activity = { ...actividadesBase[0], status: "Completada" };
      vi.mocked(api.update).mockResolvedValueOnce(a1Editada);
      vi.mocked(api.remove).mockResolvedValueOnce(undefined);

      const okUpdate = await useScrumStore.getState().updateActivity("a1", "status", "Completada");
      expect(okUpdate).toBe(true);
      expect(api.update).toHaveBeenCalledWith("activities", "a1", { status: "Completada" });
      expect(useScrumStore.getState().activities[0].status).toBe("Completada");

      const okDelete = await useScrumStore.getState().deleteActivity("a1");
      expect(okDelete).toBe(true);
      expect(api.remove).toHaveBeenCalledWith("activities", "a1");
      expect(useScrumStore.getState().activities.map((a) => a.id)).toEqual(["a2", "a3", "a4"]);
    });
  });

  describe("reorderActivities", () => {
    it("actualiza optimista en memoria y solo hace PATCH de las actividades cuyo order cambió", async () => {
      useScrumStore.setState({
        activities: actividadesBase,
        loaded: true,
        loading: false,
      });

      const diferidoA2 = crearPromesaDiferida<Activity>();
      const diferidoA3 = crearPromesaDiferida<Activity>();
      vi.mocked(api.update).mockImplementation((_recurso, id) => {
        if (id === "a3") return diferidoA3.promesa;
        if (id === "a2") return diferidoA2.promesa;
        throw new Error(`PATCH inesperado para ${id}`);
      });

      // a1 se mantiene en índice 0; a3 pasa a 1 y a2 pasa a 2.
      const promesa = useScrumStore.getState().reorderActivities("p1", ["a1", "a3", "a2"]);

      // Antes de que respondan los PATCH, el estado en memoria ya está actualizado.
      const estadoOptimista = useScrumStore.getState().activities;
      expect(estadoOptimista.find((a) => a.id === "a1")?.order).toBe(0);
      expect(estadoOptimista.find((a) => a.id === "a3")?.order).toBe(1);
      expect(estadoOptimista.find((a) => a.id === "a2")?.order).toBe(2);
      expect(estadoOptimista.find((a) => a.id === "a4")?.order).toBe(10);

      expect(api.update).toHaveBeenCalledTimes(2);
      expect(api.update).toHaveBeenCalledWith("activities", "a3", { order: 1 });
      expect(api.update).toHaveBeenCalledWith("activities", "a2", { order: 2 });
      expect(api.update).not.toHaveBeenCalledWith("activities", "a1", expect.anything());

      diferidoA3.resolver({ ...actividadesBase[2], order: 1 });
      diferidoA2.resolver({ ...actividadesBase[1], order: 2 });
      await promesa;

      expect(useScrumStore.getState().mutationError).toBeNull();
    });

    it("no realiza peticiones PATCH si ninguna actividad cambió de orden", async () => {
      useScrumStore.setState({
        activities: actividadesBase,
        loaded: true,
        loading: false,
      });

      await useScrumStore.getState().reorderActivities("p1", ["a1", "a2", "a3"]);

      expect(api.update).not.toHaveBeenCalled();
    });

    it("revierte al estado previo, setea mutationError y llama refetch si algún PATCH falla", async () => {
      useScrumStore.setState({
        projects: proyectosBase,
        sprints: sprintsBase,
        activities: actividadesBase,
        users: [usuarioAdmin, usuarioMiembro],
        loaded: true,
        loading: false,
      });

      const diferidoLista = crearPromesaDiferida<unknown[]>();
      vi.mocked(api.update)
        .mockResolvedValueOnce({ ...actividadesBase[2], order: 1 })
        .mockRejectedValueOnce(new Error("Fallo al guardar orden"));
      vi.mocked(api.list).mockImplementation((recurso: string) => {
        if (recurso === "activities") {
          return diferidoLista.promesa as Promise<Activity[]>;
        }
        return Promise.resolve([]);
      });

      const promesaReorder = useScrumStore.getState().reorderActivities("p1", ["a1", "a3", "a2"]);

      // Espera a que el fallo dispare refetch() y verifica el rollback inmediato a previous.
      await vi.waitFor(() => {
        expect(api.list).toHaveBeenCalledWith("activities");
      });

      expect(useScrumStore.getState().activities).toEqual(actividadesBase);
      expect(useScrumStore.getState().mutationError).toBe("Fallo al guardar orden");

      diferidoLista.resolver(actividadesBase);
      await promesaReorder;

      expect(api.list).toHaveBeenCalledTimes(4);
      expect(api.list).toHaveBeenCalledWith("projects");
      expect(api.list).toHaveBeenCalledWith("sprints");
      expect(api.list).toHaveBeenCalledWith("activities");
      expect(api.list).toHaveBeenCalledWith("users");
      expect(useScrumStore.getState().mutationError).toBe("Fallo al guardar orden");
    });
  });

  describe("categorías (addCategory y deleteCategory)", () => {
    it("addCategory rechaza cadenas vacías, es idempotente si ya existe y agrega si es nueva", async () => {
      useScrumStore.setState({ projects: proyectosBase, loaded: true, loading: false });

      const vacio = await useScrumStore.getState().addCategory("p1", "   ");
      expect(vacio).toBe(false);
      expect(api.update).not.toHaveBeenCalled();

      const proyectoInexistente = await useScrumStore.getState().addCategory("p99", "QA");
      expect(proyectoInexistente).toBe(false);

      const existente = await useScrumStore.getState().addCategory("p1", "Backend");
      expect(existente).toBe(true);
      expect(api.update).not.toHaveBeenCalled();

      const proyectoActualizado: Project = {
        ...proyectosBase[0],
        categories: ["General", "Backend", "Frontend"],
      };
      vi.mocked(api.update).mockResolvedValueOnce(proyectoActualizado);

      const agregada = await useScrumStore.getState().addCategory("p1", "  Frontend  ");
      expect(agregada).toBe(true);
      expect(api.update).toHaveBeenCalledWith("projects", "p1", {
        categories: ["General", "Backend", "Frontend"],
      });
      expect(useScrumStore.getState().projects[0].categories).toEqual([
        "General",
        "Backend",
        "Frontend",
      ]);
    });

    it("deleteCategory elimina la categoría y limpia category a cadena vacía en actividades afectadas", async () => {
      useScrumStore.setState({
        projects: proyectosBase,
        activities: actividadesBase,
        loaded: true,
        loading: false,
      });

      const proyectoSinBackend: Project = {
        ...proyectosBase[0],
        categories: ["General"],
      };
      vi.mocked(api.update).mockResolvedValueOnce(proyectoSinBackend);

      const ok = await useScrumStore.getState().deleteCategory("p1", "Backend");

      expect(ok).toBe(true);
      expect(api.update).toHaveBeenCalledWith("projects", "p1", {
        categories: ["General"],
      });

      const actividades = useScrumStore.getState().activities;
      expect(actividades.find((a) => a.id === "a1")?.category).toBe("");
      expect(actividades.find((a) => a.id === "a2")?.category).toBe("");
      expect(actividades.find((a) => a.id === "a3")?.category).toBe("General");
    });
  });

  describe("sprints (addSprint y deleteSprint)", () => {
    it("addSprint crea el sprint con nombre limpio y lo agrega al estado", async () => {
      const sprintCreado: Sprint = { id: "s-nuevo", projectId: "p1", name: "Sprint 3" };
      vi.mocked(api.create).mockResolvedValueOnce(sprintCreado);

      const resultado = await useScrumStore.getState().addSprint("p1", "  Sprint 3  ");

      expect(resultado).toEqual(sprintCreado);
      expect(api.create).toHaveBeenCalledWith("sprints", {
        projectId: "p1",
        name: "Sprint 3",
      });
      expect(useScrumStore.getState().sprints).toContainEqual(sprintCreado);
    });

    it("deleteSprint elimina el sprint y limpia sprintId a cadena vacía en actividades afectadas", async () => {
      useScrumStore.setState({
        sprints: sprintsBase,
        activities: actividadesBase,
        loaded: true,
        loading: false,
      });
      vi.mocked(api.remove).mockResolvedValueOnce(undefined);

      const ok = await useScrumStore.getState().deleteSprint("s1");

      expect(ok).toBe(true);
      expect(api.remove).toHaveBeenCalledWith("sprints", "s1");
      expect(useScrumStore.getState().sprints.map((s) => s.id)).toEqual(["s2", "s3"]);

      const actividades = useScrumStore.getState().activities;
      expect(actividades.find((a) => a.id === "a1")?.sprintId).toBe("");
      expect(actividades.find((a) => a.id === "a2")?.sprintId).toBe("");
      expect(actividades.find((a) => a.id === "a3")?.sprintId).toBe("s2");
    });
  });

  describe("proyectos (createProject y deleteProject)", () => {
    it("createProject retorna null si no hay usuario autenticado", async () => {
      useAuthStore.setState({ user: null, loading: false });

      const resultado = await useScrumStore.getState().createProject({
        name: "Nuevo",
        description: "Desc",
        color: "#4f7cff",
        course: "IIC2143",
      });

      expect(resultado).toBeNull();
      expect(api.create).not.toHaveBeenCalled();
    });

    it("createProject asigna categories General, creador como Admin y crea Sprint 1", async () => {
      const proyectoCreado: Project = {
        id: "p-nuevo",
        name: "Proyecto Gamma",
        description: "Desc",
        color: "#9b6dff",
        course: "IIC2143",
        categories: ["General"],
        members: [{ userId: "u1", role: "Admin" }],
      };
      const sprintInicial: Sprint = {
        id: "s-inicial",
        projectId: "p-nuevo",
        name: "Sprint 1",
      };

      vi.mocked(api.create)
        .mockResolvedValueOnce(proyectoCreado)
        .mockResolvedValueOnce(sprintInicial);

      const resultado = await useScrumStore.getState().createProject({
        name: "Proyecto Gamma",
        description: "Desc",
        color: "#9b6dff",
        course: "IIC2143",
      });

      expect(resultado).toEqual(proyectoCreado);
      expect(api.create).toHaveBeenNthCalledWith(1, "projects", {
        name: "Proyecto Gamma",
        description: "Desc",
        color: "#9b6dff",
        course: "IIC2143",
        categories: ["General"],
        members: [{ userId: "u1", role: "Admin" }],
      });
      expect(api.create).toHaveBeenNthCalledWith(2, "sprints", {
        projectId: "p-nuevo",
        name: "Sprint 1",
      });
      expect(useScrumStore.getState().projects).toContainEqual(proyectoCreado);
      expect(useScrumStore.getState().sprints).toContainEqual(sprintInicial);
    });

    it("deleteProject elimina el proyecto junto con sus sprints y actividades asociadas", async () => {
      useScrumStore.setState({
        projects: proyectosBase,
        sprints: sprintsBase,
        activities: actividadesBase,
        loaded: true,
        loading: false,
      });
      vi.mocked(api.remove).mockResolvedValueOnce(undefined);

      const ok = await useScrumStore.getState().deleteProject("p1");

      expect(ok).toBe(true);
      expect(api.remove).toHaveBeenCalledWith("projects", "p1");

      const estado = useScrumStore.getState();
      expect(estado.projects.map((p) => p.id)).toEqual(["p2"]);
      expect(estado.sprints.map((s) => s.id)).toEqual(["s3"]);
      expect(estado.activities.map((a) => a.id)).toEqual(["a4"]);
    });
  });

  describe("invariantes RBAC en miembros", () => {
    it("inviteMember evita duplicados e invita nuevos usuarios con rol Miembro", async () => {
      useScrumStore.setState({ projects: proyectosBase, loaded: true, loading: false });

      // u2 ya pertenece a p1.
      const duplicado = await useScrumStore.getState().inviteMember("p1", usuarioMiembro);
      expect(duplicado).toBe(false);
      expect(api.update).not.toHaveBeenCalled();

      const proyectoConInvitado: Project = {
        ...proyectosBase[0],
        members: [
          ...proyectosBase[0].members,
          { userId: "u3", role: "Miembro" },
        ],
      };
      vi.mocked(api.update).mockResolvedValueOnce(proyectoConInvitado);

      const ok = await useScrumStore.getState().inviteMember("p1", usuarioInvitado);
      expect(ok).toBe(true);
      expect(api.update).toHaveBeenCalledWith("projects", "p1", {
        members: [
          { userId: "u1", role: "Admin" },
          { userId: "u2", role: "Miembro" },
          { userId: "u3", role: "Miembro" },
        ],
      });
      expect(useScrumStore.getState().projects[0].members).toHaveLength(3);
    });

    it("removeMember impide dejar <= 1 miembro o quitar al último Admin", async () => {
      useScrumStore.setState({ projects: proyectosBase, loaded: true, loading: false });

      // p2 tiene solo 1 miembro.
      const unicoMiembro = await useScrumStore.getState().removeMember("p2", "u1");
      expect(unicoMiembro).toBe(false);

      // p1 tiene 2 miembros, pero u1 es el único Admin.
      const ultimoAdmin = await useScrumStore.getState().removeMember("p1", "u1");
      expect(ultimoAdmin).toBe(false);

      // Miembro inexistente en el proyecto.
      const noExiste = await useScrumStore.getState().removeMember("p1", "u99");
      expect(noExiste).toBe(false);

      expect(api.update).not.toHaveBeenCalled();
    });

    it("removeMember expulsa al miembro y lo quita de members en las actividades del proyecto", async () => {
      useScrumStore.setState({
        projects: proyectosBase,
        activities: actividadesBase,
        loaded: true,
        loading: false,
      });

      const proyectoSinBeto: Project = {
        ...proyectosBase[0],
        members: [{ userId: "u1", role: "Admin" }],
      };
      vi.mocked(api.update).mockResolvedValueOnce(proyectoSinBeto);

      const ok = await useScrumStore.getState().removeMember("p1", "u2");

      expect(ok).toBe(true);
      expect(api.update).toHaveBeenCalledWith("projects", "p1", {
        members: [{ userId: "u1", role: "Admin" }],
      });

      const actividades = useScrumStore.getState().activities;
      expect(actividades.find((a) => a.id === "a1")?.members).toEqual(["u1"]);
      expect(actividades.find((a) => a.id === "a2")?.members).toEqual([]);
      // La actividad de p2 conserva a u2 intacto.
      expect(actividades.find((a) => a.id === "a4")?.members).toEqual(["u2"]);
    });

    it("updateMemberRole impide degradar al último Admin a Miembro y permite cambios válidos", async () => {
      useScrumStore.setState({ projects: proyectosBase, loaded: true, loading: false });

      // u1 es el único Admin en p1 -> no puede pasar a Miembro.
      const degradarUnicoAdmin = await useScrumStore
        .getState()
        .updateMemberRole("p1", "u1", "Miembro");
      expect(degradarUnicoAdmin).toBe(false);
      expect(api.update).not.toHaveBeenCalled();

      // Promover a u2 a Admin sí está permitido.
      const proyectoDosAdmins: Project = {
        ...proyectosBase[0],
        members: [
          { userId: "u1", role: "Admin" },
          { userId: "u2", role: "Admin" },
        ],
      };
      vi.mocked(api.update).mockResolvedValueOnce(proyectoDosAdmins);

      const promoverOk = await useScrumStore.getState().updateMemberRole("p1", "u2", "Admin");
      expect(promoverOk).toBe(true);
      expect(api.update).toHaveBeenCalledWith("projects", "p1", {
        members: [
          { userId: "u1", role: "Admin" },
          { userId: "u2", role: "Admin" },
        ],
      });

      // Con dos Admins, ahora sí se puede degradar a u1 a Miembro.
      const proyectoDegradado: Project = {
        ...proyectoDosAdmins,
        members: [
          { userId: "u1", role: "Miembro" },
          { userId: "u2", role: "Admin" },
        ],
      };
      vi.mocked(api.update).mockResolvedValueOnce(proyectoDegradado);

      const degradarOk = await useScrumStore.getState().updateMemberRole("p1", "u1", "Miembro");
      expect(degradarOk).toBe(true);
    });
  });

  describe("enlaces del proyecto y propagación bidireccional con useOrganizerStore", () => {
    it("addProjectLink, updateProjectLink y deleteProjectLink retornan false si el proyecto no existe", async () => {
      useScrumStore.setState({ projects: proyectosBase, loaded: true, loading: false });

      const addOk = await useScrumStore
        .getState()
        .addProjectLink("p-inexistente", { title: "Figma", url: "https://figma.com" });
      const updOk = await useScrumStore
        .getState()
        .updateProjectLink("p-inexistente", "link-1", { title: "Docs" });
      const delOk = await useScrumStore
        .getState()
        .deleteProjectLink("p-inexistente", "link-1");

      expect(addOk).toBe(false);
      expect(updOk).toBe(false);
      expect(delOk).toBe(false);
      expect(api.update).not.toHaveBeenCalled();
    });

    it("addProjectLink, updateProjectLink y deleteProjectLink actualizan el proyecto y propagan a useOrganizerStore", async () => {
      useScrumStore.setState({ projects: proyectosBase, loaded: true, loading: false });

      const conNuevoLink: Project = {
        ...proyectosBase[0],
        links: [
          ...(proyectosBase[0].links ?? []),
          { id: "link-2", title: "Figma", url: "https://figma.com", category: "diseño" },
        ],
      };
      vi.mocked(api.update).mockResolvedValueOnce(conNuevoLink);

      const okAdd = await useScrumStore.getState().addProjectLink("p1", {
        title: "Figma",
        url: "https://figma.com",
        category: "diseño",
      });
      expect(okAdd).toBe(true);
      expect(api.update).toHaveBeenNthCalledWith(1, "projects", "p1", {
        links: [
          proyectosBase[0].links![0],
          expect.objectContaining({
            id: expect.stringMatching(/^link-/),
            title: "Figma",
            url: "https://figma.com",
            category: "diseño",
          }),
        ],
      });
      expect(useOrganizerStore.getState().projects[0].links).toHaveLength(2);

      const conLinkEditado: Project = {
        ...conNuevoLink,
        links: [
          {
            id: "link-1",
            title: "GitHub Org",
            url: "https://github.com/org/alpha",
            category: "repositorio",
          },
          conNuevoLink.links![1],
        ],
      };
      vi.mocked(api.update).mockResolvedValueOnce(conLinkEditado);

      const okUpdate = await useScrumStore
        .getState()
        .updateProjectLink("p1", "link-1", { title: "GitHub Org" });
      expect(okUpdate).toBe(true);
      expect(useOrganizerStore.getState().projects[0].links?.[0].title).toBe("GitHub Org");

      const conLinkBorrado: Project = {
        ...conLinkEditado,
        links: [conNuevoLink.links![1]],
      };
      vi.mocked(api.update).mockResolvedValueOnce(conLinkBorrado);

      const okDelete = await useScrumStore.getState().deleteProjectLink("p1", "link-1");
      expect(okDelete).toBe(true);
      expect(useScrumStore.getState().projects[0].links?.map((l) => l.id)).toEqual(["link-2"]);
      expect(useOrganizerStore.getState().projects[0].links?.map((l) => l.id)).toEqual(["link-2"]);
    });

    it("sincroniza bidireccionalmente cambios de projects y activities entre useScrumStore y useOrganizerStore", async () => {
      // Scrum -> Organizador
      useScrumStore.setState({
        projects: proyectosBase,
        activities: actividadesBase,
        loaded: true,
        loading: false,
      });

      expect(useOrganizerStore.getState().projects).toBe(useScrumStore.getState().projects);
      expect(useOrganizerStore.getState().activities).toBe(useScrumStore.getState().activities);

      // Organizador -> Scrum (actualizando una tarea derivada scrum:*)
      const actividadActualizada: Activity = { ...actividadesBase[0], status: "Completada" };
      vi.mocked(api.update).mockResolvedValueOnce(actividadActualizada);

      const ok = await useOrganizerStore.getState().setTaskStatus("scrum:a1", "Completada");
      expect(ok).toBe(true);

      expect(useScrumStore.getState().activities[0].status).toBe("Completada");
      expect(useScrumStore.getState().activities).toBe(useOrganizerStore.getState().activities);
    });
  });
});
