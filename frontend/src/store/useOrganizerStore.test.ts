import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  Activity,
  Course,
  CourseSession,
  OrganizerTask,
  Project,
  User,
} from "../types";

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

const usuarioPrueba: User = {
  id: "u1",
  username: "mgonzalez",
  name: "Matías",
  lastName: "González",
  mail: "matias@uc.cl",
  initials: "MG",
  avatarColor: "#4f7cff",
};

const otroUsuario: User = {
  id: "u2",
  username: "lrojas",
  name: "Lucía",
  lastName: "Rojas",
  mail: "lucia@uc.cl",
  initials: "LR",
  avatarColor: "#2dd67b",
};

const ramosBase: Course[] = [
  {
    id: "c1",
    userId: "u1",
    name: "Ingeniería de Software",
    code: "IIC2143",
    shortName: "ISW",
    color: "#4f7cff",
    links: [
      {
        id: "clink-1",
        title: "Canvas",
        url: "https://canvas.uc.cl",
        category: "lms",
      },
    ],
  },
  {
    id: "c2",
    userId: "u1",
    name: "Cálculo III",
    code: "MAT1630",
    shortName: "CAL",
    color: "#2dd67b",
  },
];

const sesionesBase: CourseSession[] = [
  {
    id: "ses-1",
    courseId: "c1",
    dayOfWeek: 0,
    startHour: 10,
    duration: 2,
    type: "Cátedra",
  },
  {
    id: "ses-2",
    courseId: "c2",
    dayOfWeek: 2,
    startHour: 14,
    duration: 2,
    type: "Auxiliar",
  },
];

const tareasBase: OrganizerTask[] = [
  {
    id: "t1",
    userId: "u1",
    title: "Leer capítulo 3",
    scope: "Ramo",
    courseId: "c1",
    type: "Lectura",
    endDate: "2026-12-01",
    dueTime: "18:00",
    status: "Pendiente",
    priority: "Media",
    notes: "Resumen breve",
  },
  {
    id: "t2",
    userId: "u1",
    title: "Estudiar integrales",
    scope: "Ramo",
    courseId: "c2",
    type: "Evaluación",
    endDate: "2026-12-05",
    status: "Completada",
    priority: "Alta",
  },
];

const proyectosBase: Project[] = [
  {
    id: "p1",
    name: "Proyecto Applicate",
    description: "Tablero académico",
    color: "#4f7cff",
    course: "IIC2143",
    categories: ["General"],
    members: [{ userId: "u1", role: "Admin" }],
  },
];

const actividadesBase: Activity[] = [
  {
    id: "a1",
    projectId: "p1",
    sprintId: "s1",
    title: "Implementar API",
    description: "Endpoints REST",
    category: "General",
    members: ["u1"],
    priority: "Alta",
    status: "En revisión",
    hours: 4,
    dueDate: "2026-12-02",
    order: 0,
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

function configurarListasCompletas() {
  vi.mocked(api.list).mockImplementation(async (recurso: string) => {
    switch (recurso) {
      case "courses":
        return ramosBase;
      case "sessions":
        return sesionesBase;
      case "tasks":
        return tareasBase;
      case "activities":
        return actividadesBase;
      case "projects":
        return proyectosBase;
      default:
        return [];
    }
  });
}

describe("useOrganizerStore", () => {
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
    useAuthStore.setState({ user: usuarioPrueba, loading: false });
  });

  describe("carga inicial, deduplicación y refetch", () => {
    it("ensureLoaded carga courses, sessions, tasks, activities y projects", async () => {
      configurarListasCompletas();

      await useOrganizerStore.getState().ensureLoaded();

      expect(api.list).toHaveBeenCalledTimes(5);
      expect(api.list).toHaveBeenCalledWith("courses");
      expect(api.list).toHaveBeenCalledWith("sessions");
      expect(api.list).toHaveBeenCalledWith("tasks");
      expect(api.list).toHaveBeenCalledWith("activities");
      expect(api.list).toHaveBeenCalledWith("projects");

      const estado = useOrganizerStore.getState();
      expect(estado.loaded).toBe(true);
      expect(estado.loading).toBe(false);
      expect(estado.loadError).toBeNull();
      expect(estado.courses).toEqual(ramosBase);
      expect(estado.sessions).toEqual(sesionesBase);
      expect(estado.tasks).toEqual(tareasBase);
      expect(estado.activities).toEqual(actividadesBase);
      expect(estado.projects).toEqual(proyectosBase);

      // Llamadas posteriores con loaded: true no vuelven a consultar la API.
      await useOrganizerStore.getState().ensureLoaded();
      expect(api.list).toHaveBeenCalledTimes(5);
    });

    it("deduplica llamadas concurrentes a ensureLoaded compartiendo inflightLoad", async () => {
      const diferidoCourses = crearPromesaDiferida<Course[]>();
      const diferidoSessions = crearPromesaDiferida<CourseSession[]>();
      const diferidoTasks = crearPromesaDiferida<OrganizerTask[]>();
      const diferidoActivities = crearPromesaDiferida<Activity[]>();
      const diferidoProjects = crearPromesaDiferida<Project[]>();

      vi.mocked(api.list).mockImplementation((recurso: string) => {
        switch (recurso) {
          case "courses":
            return diferidoCourses.promesa;
          case "sessions":
            return diferidoSessions.promesa;
          case "tasks":
            return diferidoTasks.promesa;
          case "activities":
            return diferidoActivities.promesa;
          case "projects":
            return diferidoProjects.promesa;
          default:
            return Promise.resolve([]);
        }
      });

      const promesa1 = useOrganizerStore.getState().ensureLoaded();
      const promesa2 = useOrganizerStore.getState().ensureLoaded();

      expect(promesa1).toBe(promesa2);
      expect(api.list).toHaveBeenCalledTimes(5);

      diferidoCourses.resolver(ramosBase);
      diferidoSessions.resolver(sesionesBase);
      diferidoTasks.resolver(tareasBase);
      diferidoActivities.resolver(actividadesBase);
      diferidoProjects.resolver(proyectosBase);

      await Promise.all([promesa1, promesa2]);
      expect(useOrganizerStore.getState().loaded).toBe(true);
    });

    it("reutiliza projects y activities si useScrumStore ya está cargado sin volver a pedirlos", async () => {
      useScrumStore.setState({
        projects: proyectosBase,
        activities: actividadesBase,
        loaded: true,
        loading: false,
      });

      vi.mocked(api.list).mockImplementation(async (recurso: string) => {
        if (recurso === "courses") return ramosBase;
        if (recurso === "sessions") return sesionesBase;
        if (recurso === "tasks") return tareasBase;
        throw new Error(`No debería solicitar ${recurso}`);
      });

      await useOrganizerStore.getState().ensureLoaded();

      expect(api.list).toHaveBeenCalledTimes(3);
      expect(api.list).toHaveBeenCalledWith("courses");
      expect(api.list).toHaveBeenCalledWith("sessions");
      expect(api.list).toHaveBeenCalledWith("tasks");
      expect(api.list).not.toHaveBeenCalledWith("activities");
      expect(api.list).not.toHaveBeenCalledWith("projects");

      const estado = useOrganizerStore.getState();
      expect(estado.projects).toEqual(proyectosBase);
      expect(estado.activities).toEqual(actividadesBase);
      expect(estado.loaded).toBe(true);
    });

    it("refetch fuerza la recarga completa y limpia errores previos de carga", async () => {
      useScrumStore.setState({ loaded: true, loading: false });
      useOrganizerStore.setState({
        loaded: true,
        loading: false,
        loadError: "Error previo de red",
      });
      configurarListasCompletas();

      await useOrganizerStore.getState().refetch();

      expect(api.list).toHaveBeenCalledTimes(5);
      expect(useOrganizerStore.getState().loadError).toBeNull();
      expect(useOrganizerStore.getState().loading).toBe(false);
      expect(useOrganizerStore.getState().courses).toEqual(ramosBase);
    });

    it("registra loadError si falla la carga inicial", async () => {
      vi.mocked(api.list).mockRejectedValueOnce(new Error("Backend caído"));

      await useOrganizerStore.getState().ensureLoaded();

      const estado = useOrganizerStore.getState();
      expect(estado.loaded).toBe(false);
      expect(estado.loading).toBe(false);
      expect(estado.loadError).toBe("Backend caído");
    });
  });

  describe("addTask, updateTask y deleteTask", () => {
    const nuevaTareaInput: Omit<OrganizerTask, "id" | "userId"> = {
      title: "Preparar entrega",
      scope: "Personal",
      courseId: null,
      type: "Tarea",
      endDate: "2026-12-10",
      status: "Pendiente",
      priority: "Alta",
    };

    it("rechaza addTask con false si no hay usuario autenticado", async () => {
      useAuthStore.setState({ user: null, loading: false });

      const resultado = await useOrganizerStore.getState().addTask(nuevaTareaInput);

      expect(resultado).toBe(false);
      expect(api.create).not.toHaveBeenCalled();
    });

    it("addTask crea la tarea asignando userId del usuario actual", async () => {
      const tareaCreada: OrganizerTask = {
        ...nuevaTareaInput,
        id: "t-nueva",
        userId: "u1",
      };
      vi.mocked(api.create).mockResolvedValueOnce(tareaCreada);

      const resultado = await useOrganizerStore.getState().addTask(nuevaTareaInput);

      expect(resultado).toBe(true);
      expect(api.create).toHaveBeenCalledWith("tasks", {
        ...nuevaTareaInput,
        userId: "u1",
      });
      expect(useOrganizerStore.getState().tasks).toContainEqual(tareaCreada);
    });

    it("updateTask y deleteTask rechazan con false si el id es derivado scrum:<id>", async () => {
      const actualizado = await useOrganizerStore
        .getState()
        .updateTask("scrum:a1", { title: "Cambio inválido" });
      const eliminado = await useOrganizerStore.getState().deleteTask("scrum:a1");

      expect(actualizado).toBe(false);
      expect(eliminado).toBe(false);
      expect(api.update).not.toHaveBeenCalled();
      expect(api.remove).not.toHaveBeenCalled();
    });

    it("updateTask y deleteTask actualizan y eliminan tareas propias", async () => {
      useOrganizerStore.setState({ tasks: tareasBase, loaded: true, loading: false });
      const tareaEditada: OrganizerTask = { ...tareasBase[0], title: "Leer capítulo 4" };
      vi.mocked(api.update).mockResolvedValueOnce(tareaEditada);
      vi.mocked(api.remove).mockResolvedValueOnce(undefined);

      const okUpdate = await useOrganizerStore
        .getState()
        .updateTask("t1", { title: "Leer capítulo 4" });
      expect(okUpdate).toBe(true);
      expect(api.update).toHaveBeenCalledWith("tasks", "t1", { title: "Leer capítulo 4" });
      expect(useOrganizerStore.getState().tasks[0].title).toBe("Leer capítulo 4");

      const okDelete = await useOrganizerStore.getState().deleteTask("t1");
      expect(okDelete).toBe(true);
      expect(api.remove).toHaveBeenCalledWith("tasks", "t1");
      expect(useOrganizerStore.getState().tasks.map((t) => t.id)).toEqual(["t2"]);
    });
  });

  describe("toggleTaskStatus y setTaskStatus", () => {
    it("actualiza tasks en tareas propias", async () => {
      useOrganizerStore.setState({ tasks: tareasBase, loaded: true, loading: false });
      const t1Completada: OrganizerTask = { ...tareasBase[0], status: "Completada" };
      const t1EnCurso: OrganizerTask = { ...tareasBase[0], status: "En curso" };
      vi.mocked(api.update)
        .mockResolvedValueOnce(t1Completada)
        .mockResolvedValueOnce(t1EnCurso);

      const nuevoEstado = await useOrganizerStore.getState().toggleTaskStatus("t1");
      expect(nuevoEstado).toBe("Completada");
      expect(api.update).toHaveBeenCalledWith("tasks", "t1", { status: "Completada" });
      expect(useOrganizerStore.getState().tasks[0].status).toBe("Completada");

      const okSet = await useOrganizerStore.getState().setTaskStatus("t1", "En curso");
      expect(okSet).toBe(true);
      expect(api.update).toHaveBeenCalledWith("tasks", "t1", { status: "En curso" });
      expect(useOrganizerStore.getState().tasks[0].status).toBe("En curso");
    });

    it("toggleTaskStatus retorna null si la tarea no existe", async () => {
      const resultado = await useOrganizerStore.getState().toggleTaskStatus("inexistente");

      expect(resultado).toBeNull();
      expect(api.update).not.toHaveBeenCalled();
    });

    it("actualiza activities vía api.update en tareas derivadas scrum:* respetando scrumRestoreStatus", async () => {
      useOrganizerStore.setState({
        activities: actividadesBase,
        loaded: true,
        loading: false,
      });

      const actividadCompletada: Activity = { ...actividadesBase[0], status: "Completada" };
      const actividadRestaurada: Activity = { ...actividadesBase[0], status: "En revisión" };
      vi.mocked(api.update)
        .mockResolvedValueOnce(actividadCompletada)
        .mockResolvedValueOnce(actividadRestaurada);

      // a1 está en "En revisión" (equivale a "En curso" en Organizador) -> pasa a "Completada".
      const estadoToggled = await useOrganizerStore.getState().toggleTaskStatus("scrum:a1");
      expect(estadoToggled).toBe("Completada");
      expect(api.update).toHaveBeenNthCalledWith(1, "activities", "a1", {
        status: "Completada",
      });
      expect(useOrganizerStore.getState().activities[0].status).toBe("Completada");
      // Verifica propagación hacia useScrumStore.
      expect(useScrumStore.getState().activities[0].status).toBe("Completada");

      // Al deshacer con scrumRestoreStatus, envía "En revisión" en lugar de "En curso".
      const okRestore = await useOrganizerStore
        .getState()
        .setTaskStatus("scrum:a1", "En curso", "En revisión");
      expect(okRestore).toBe(true);
      expect(api.update).toHaveBeenNthCalledWith(2, "activities", "a1", {
        status: "En revisión",
      });
      expect(useOrganizerStore.getState().activities[0].status).toBe("En revisión");
      expect(useScrumStore.getState().activities[0].status).toBe("En revisión");
    });
  });

  describe("deleteCourse", () => {
    it("elimina sesiones del ramo, desvincula sus tareas a Personal y resetea activeCourse si estaba seleccionado", async () => {
      useOrganizerStore.setState({
        courses: ramosBase,
        sessions: sesionesBase,
        tasks: tareasBase,
        activeCourse: "c1",
        loaded: true,
        loading: false,
      });
      vi.mocked(api.remove).mockResolvedValueOnce(undefined);

      const ok = await useOrganizerStore.getState().deleteCourse("c1");

      expect(ok).toBe(true);
      expect(api.remove).toHaveBeenCalledWith("courses", "c1");

      const estado = useOrganizerStore.getState();
      expect(estado.courses.map((c) => c.id)).toEqual(["c2"]);
      expect(estado.sessions.map((s) => s.id)).toEqual(["ses-2"]);
      expect(estado.tasks[0]).toMatchObject({
        id: "t1",
        courseId: null,
        scope: "Personal",
      });
      expect(estado.tasks[1]).toMatchObject({
        id: "t2",
        courseId: "c2",
        scope: "Ramo",
      });
      expect(estado.activeCourse).toBe("all");
    });

    it("conserva activeCourse si estaba seleccionado otro ramo distinto al eliminado", async () => {
      useOrganizerStore.setState({
        courses: ramosBase,
        sessions: sesionesBase,
        tasks: tareasBase,
        activeCourse: "c2",
        loaded: true,
        loading: false,
      });
      vi.mocked(api.remove).mockResolvedValueOnce(undefined);

      const ok = await useOrganizerStore.getState().deleteCourse("c1");

      expect(ok).toBe(true);
      expect(useOrganizerStore.getState().activeCourse).toBe("c2");
    });
  });

  describe("enlaces del ramo (addCourseLink, updateCourseLink, deleteCourseLink)", () => {
    it("retornan false sin llamar a la API si el ramo no existe", async () => {
      useOrganizerStore.setState({ courses: ramosBase, loaded: true, loading: false });

      const addOk = await useOrganizerStore
        .getState()
        .addCourseLink("c-inexistente", { title: "Drive", url: "https://drive.google.com" });
      const updOk = await useOrganizerStore
        .getState()
        .updateCourseLink("c-inexistente", "clink-1", { title: "Nuevo" });
      const delOk = await useOrganizerStore
        .getState()
        .deleteCourseLink("c-inexistente", "clink-1");

      expect(addOk).toBe(false);
      expect(updOk).toBe(false);
      expect(delOk).toBe(false);
      expect(api.update).not.toHaveBeenCalled();
    });

    it("agregan, actualizan y eliminan enlaces de un ramo existente", async () => {
      useOrganizerStore.setState({ courses: ramosBase, loaded: true, loading: false });

      const ramoConNuevoLink: Course = {
        ...ramosBase[0],
        links: [
          ...(ramosBase[0].links ?? []),
          { id: "clink-2", title: "Drive", url: "https://drive.google.com", category: "drive" },
        ],
      };
      vi.mocked(api.update).mockResolvedValueOnce(ramoConNuevoLink);

      const okAdd = await useOrganizerStore.getState().addCourseLink("c1", {
        title: "Drive",
        url: "https://drive.google.com",
        category: "drive",
      });
      expect(okAdd).toBe(true);
      expect(api.update).toHaveBeenNthCalledWith(1, "courses", "c1", {
        links: [
          ramosBase[0].links![0],
          expect.objectContaining({
            id: expect.stringMatching(/^clink-/),
            title: "Drive",
            url: "https://drive.google.com",
            category: "drive",
          }),
        ],
      });
      expect(useOrganizerStore.getState().courses[0].links).toHaveLength(2);

      const ramoLinkEditado: Course = {
        ...ramoConNuevoLink,
        links: [
          { id: "clink-1", title: "Canvas UC", url: "https://canvas.uc.cl", category: "lms" },
          ramoConNuevoLink.links![1],
        ],
      };
      vi.mocked(api.update).mockResolvedValueOnce(ramoLinkEditado);

      const okUpdate = await useOrganizerStore
        .getState()
        .updateCourseLink("c1", "clink-1", { title: "Canvas UC" });
      expect(okUpdate).toBe(true);
      expect(api.update).toHaveBeenNthCalledWith(2, "courses", "c1", {
        links: [
          { id: "clink-1", title: "Canvas UC", url: "https://canvas.uc.cl", category: "lms" },
          ramoConNuevoLink.links![1],
        ],
      });

      const ramoLinkBorrado: Course = {
        ...ramoLinkEditado,
        links: [ramoConNuevoLink.links![1]],
      };
      vi.mocked(api.update).mockResolvedValueOnce(ramoLinkBorrado);

      const okDelete = await useOrganizerStore.getState().deleteCourseLink("c1", "clink-1");
      expect(okDelete).toBe(true);
      expect(api.update).toHaveBeenNthCalledWith(3, "courses", "c1", {
        links: [ramoConNuevoLink.links![1]],
      });
      expect(useOrganizerStore.getState().courses[0].links?.map((l) => l.id)).toEqual(["clink-2"]);
    });
  });

  describe("cambio de usuario y errores en mutaciones", () => {
    it("resetea datos y filtros cuando cambia user?.id en useAuthStore", () => {
      useOrganizerStore.setState({
        courses: ramosBase,
        sessions: sesionesBase,
        tasks: tareasBase,
        activities: actividadesBase,
        projects: proyectosBase,
        loaded: true,
        loading: false,
        loadError: "Error antiguo",
        mutationError: "Error de mutación",
        activeCourse: "c1",
        timeFilter: "semana",
        typeFilter: "Evaluación",
        statusFilter: "Pendiente",
        tab: "semana",
      });

      useAuthStore.setState({ user: otroUsuario, loading: false });

      const estado = useOrganizerStore.getState();
      expect(estado.courses).toEqual([]);
      expect(estado.sessions).toEqual([]);
      expect(estado.tasks).toEqual([]);
      expect(estado.activities).toEqual([]);
      expect(estado.projects).toEqual([]);
      expect(estado.loaded).toBe(false);
      expect(estado.loading).toBe(true);
      expect(estado.loadError).toBeNull();
      expect(estado.mutationError).toBeNull();
      expect(estado.activeCourse).toBe("all");
      expect(estado.timeFilter).toBe("todas");
      expect(estado.typeFilter).toBe("all");
      expect(estado.statusFilter).toBe("all");
      expect(estado.tab).toBe("lista");
    });

    it("setea mutationError y retorna false cuando falla una mutación", async () => {
      useOrganizerStore.setState({ tasks: tareasBase, loaded: true, loading: false });
      vi.mocked(api.update).mockRejectedValueOnce(new Error("No se pudo guardar la tarea"));

      const ok = await useOrganizerStore.getState().updateTask("t1", { title: "Fallida" });

      expect(ok).toBe(false);
      expect(useOrganizerStore.getState().mutationError).toBe("No se pudo guardar la tarea");

      useOrganizerStore.getState().clearMutationError();
      expect(useOrganizerStore.getState().mutationError).toBeNull();
    });
  });
});
