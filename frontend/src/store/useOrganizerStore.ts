import { create } from "zustand";
import * as api from "../api/client";
import type {
  Activity,
  Course,
  CourseLink,
  CourseSession,
  OrganizerTask,
  Project,
  Status,
  TaskType,
} from "../types";
import type { TimeFilter, ViewTab } from "../utils/dateUtils";
import { activityIdOf, assignedActivitiesAsTasks } from "../utils/scrumSync";
import { useAuthStore } from "./useAuthStore";
import { useScrumStore } from "./useScrumStore";

interface OrganizerState {
  // Datos: colecciones REST compartidas entre vistas.
  courses: Course[];
  sessions: CourseSession[];
  tasks: OrganizerTask[];
  activities: Activity[];
  projects: Project[];

  // Estado de carga.
  loaded: boolean;
  loading: boolean;
  loadError: string | null;
  mutationError: string | null;

  // Filtros globales (sobreviven a la navegación entre vistas).
  activeCourse: string | "all";
  timeFilter: TimeFilter;
  typeFilter: TaskType | "all";
  statusFilter: OrganizerTask["status"] | "all";
  tab: ViewTab;

  // Carga.
  ensureLoaded: () => Promise<void>;
  refetch: () => Promise<void>;
  clearMutationError: () => void;

  // Filtros.
  setActiveCourse: (value: string | "all") => void;
  setTimeFilter: (value: TimeFilter) => void;
  setTypeFilter: (value: TaskType | "all") => void;
  setStatusFilter: (value: OrganizerTask["status"] | "all") => void;
  setTab: (value: ViewTab) => void;

  // Tareas.
  addTask: (task: Omit<OrganizerTask, "id" | "userId">) => Promise<boolean>;
  updateTask: (id: string, changes: Partial<Omit<OrganizerTask, "id" | "userId">>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  toggleTaskStatus: (id: string) => Promise<OrganizerTask["status"] | null>;
  setTaskStatus: (
    id: string,
    status: OrganizerTask["status"],
    scrumRestoreStatus?: Status
  ) => Promise<boolean>;

  // Ramos, sesiones y enlaces.
  addCourse: (course: Omit<Course, "id" | "userId">) => Promise<boolean>;
  deleteCourse: (courseId: string) => Promise<boolean>;
  addSession: (session: Omit<CourseSession, "id">) => Promise<boolean>;
  deleteSession: (id: string) => Promise<boolean>;
  addCourseLink: (courseId: string, link: Omit<CourseLink, "id">) => Promise<boolean>;
  deleteCourseLink: (courseId: string, linkId: string) => Promise<boolean>;
  updateCourseLink: (
    courseId: string,
    linkId: string,
    changes: Partial<Omit<CourseLink, "id">>
  ) => Promise<boolean>;
}

const initialData = {
  courses: [] as Course[],
  sessions: [] as CourseSession[],
  tasks: [] as OrganizerTask[],
  activities: [] as Activity[],
  projects: [] as Project[],
  loaded: false,
  loading: true,
  loadError: null as string | null,
  mutationError: null as string | null,
  activeCourse: "all",
  timeFilter: "todas" as TimeFilter,
  typeFilter: "all" as TaskType | "all",
  statusFilter: "all" as OrganizerTask["status"] | "all",
  tab: "lista" as ViewTab,
};

// Evita cargas duplicadas (p. ej. StrictMode monta dos veces en dev).
let inflightLoad: Promise<void> | null = null;
// Se incrementa al cambiar de usuario para descartar cargas obsoletas en vuelo.
let sessionEpoch = 0;
// Identificador secuencial para que un refetch() posterior invalide cargas previas.
let latestLoadId = 0;

export const useOrganizerStore = create<OrganizerState>((set, get) => {
  async function loadAll(force: boolean): Promise<void> {
    const epoch = sessionEpoch;
    const loadId = ++latestLoadId;
    set({ loading: true, loadError: null });
    try {
      // Si Scrum ya cargó y no es refetch forzado, reutilizamos projects y activities.
      if (!force && useScrumStore.getState().loaded) {
        const [courses, sessions, tasks] = await Promise.all([
          api.list<Course>("courses"),
          api.list<CourseSession>("sessions"),
          api.list<OrganizerTask>("tasks"),
        ]);
        if (epoch !== sessionEpoch || loadId !== latestLoadId) return;
        const { projects, activities } = useScrumStore.getState();
        set({ courses, sessions, tasks, activities, projects, loaded: true, loading: false });
        return;
      }

      const [courses, sessions, tasks, activities, projects] = await Promise.all([
        api.list<Course>("courses"),
        api.list<CourseSession>("sessions"),
        api.list<OrganizerTask>("tasks"),
        api.list<Activity>("activities"),
        api.list<Project>("projects"),
      ]);
      if (epoch !== sessionEpoch || loadId !== latestLoadId) return;
      set({ courses, sessions, tasks, activities, projects, loaded: true, loading: false });
    } catch (error: unknown) {
      if (epoch !== sessionEpoch || loadId !== latestLoadId) return;
      set({ loadError: api.describeError(error), loading: false });
    }
  }

  function load(force: boolean): Promise<void> {
    if (!force && get().loaded) return Promise.resolve();
    if (force || !inflightLoad) {
      const currentLoad = loadAll(force).finally(() => {
        if (inflightLoad === currentLoad) {
          inflightLoad = null;
        }
      });
      inflightLoad = currentLoad;
    }
    return inflightLoad;
  }

  // Equivalentes a add/edit/destroy de useCollection, pero sobre el store:
  // tras confirmar el servidor, actualizan la memoria sin re-pedir la lista.
  async function addItem<T extends { id: string }>(
    resource: string,
    body: unknown,
    apply: (created: T) => void
  ): Promise<T | null> {
    try {
      const created = await api.create<T>(resource, body);
      apply(created);
      return created;
    } catch (error: unknown) {
      set({ mutationError: api.describeError(error) });
      return null;
    }
  }

  async function editItem<T extends { id: string }>(
    resource: string,
    id: string,
    changes: unknown,
    apply: (updated: T) => void
  ): Promise<boolean> {
    try {
      const updated = await api.update<T>(resource, id, changes);
      apply(updated);
      return true;
    } catch (error: unknown) {
      set({ mutationError: api.describeError(error) });
      return false;
    }
  }

  async function removeItem(
    resource: string,
    id: string,
    apply: () => void
  ): Promise<boolean> {
    try {
      await api.remove(resource, id);
      apply();
      return true;
    } catch (error: unknown) {
      set({ mutationError: api.describeError(error) });
      return false;
    }
  }

  const applyCourse = (updated: Course) =>
    set((state) => ({
      courses: state.courses.map((c) => (c.id === updated.id ? updated : c)),
      mutationError: null,
    }));

  return {
    ...initialData,

    ensureLoaded: () => load(false),
    refetch: () => load(true),
    clearMutationError: () => set({ mutationError: null }),

    setActiveCourse: (value) => set({ activeCourse: value }),
    setTimeFilter: (value) => set({ timeFilter: value }),
    setTypeFilter: (value) => set({ typeFilter: value }),
    setStatusFilter: (value) => set({ statusFilter: value }),
    setTab: (value) => set({ tab: value }),

    addTask: async (task) => {
      const user = useAuthStore.getState().user;
      if (!user) return false;
      const created = await addItem<OrganizerTask>("tasks", { ...task, userId: user.id }, (item) =>
        set((state) => ({ tasks: [...state.tasks, item], mutationError: null }))
      );
      return created !== null;
    },

    /** Las derivadas no se editan desde acá: se editan en el tablero. */
    updateTask: async (id, changes) => {
      if (activityIdOf(id) !== null) return false;
      return editItem<OrganizerTask>("tasks", id, changes, (updated) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === updated.id ? updated : t)),
          mutationError: null,
        }))
      );
    },

    /** Las derivadas no se borran desde acá: se borran en el tablero. */
    deleteTask: async (id) => {
      if (activityIdOf(id) !== null) return false;
      return removeItem("tasks", id, () =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          mutationError: null,
        }))
      );
    },

    toggleTaskStatus: async (id) => {
      const user = useAuthStore.getState().user;
      const state = get();
      const allTasks = [
        ...state.tasks,
        ...assignedActivitiesAsTasks(state.activities, user?.id ?? ""),
      ];
      const task = allTasks.find((t) => t.id === id);
      if (!task) return null;
      const next: OrganizerTask["status"] =
        task.status === "Completada" ? "Pendiente" : "Completada";
      const saved = await get().setTaskStatus(id, next);
      return saved ? next : null;
    },

    /**
     * En una tarea derivada el estado se escribe en la actividad, que es lo
     * que ve todo el equipo. `scrumRestoreStatus` restaura el estado original
     * de Scrum (p. ej. "En revisión") al deshacer.
     */
    setTaskStatus: async (id, status, scrumRestoreStatus) => {
      const activityId = activityIdOf(id);
      if (activityId !== null) {
        return editItem<Activity>(
          "activities",
          activityId,
          { status: scrumRestoreStatus ?? status },
          (updated) =>
            set((state) => ({
              activities: state.activities.map((a) => (a.id === updated.id ? updated : a)),
              mutationError: null,
            }))
        );
      }
      return editItem<OrganizerTask>("tasks", id, { status }, (updated) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === updated.id ? updated : t)),
          mutationError: null,
        }))
      );
    },

    addCourse: async (course) => {
      const user = useAuthStore.getState().user;
      if (!user) return false;
      const created = await addItem<Course>("courses", { ...course, userId: user.id }, (item) =>
        set((state) => ({ courses: [...state.courses, item], mutationError: null }))
      );
      return created !== null;
    },

    /** Borra el ramo y, en memoria, sus sesiones. Las tareas quedan personales. */
    deleteCourse: (courseId) =>
      removeItem("courses", courseId, () =>
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== courseId),
          sessions: state.sessions.filter((s) => s.courseId !== courseId),
          tasks: state.tasks.map((t) =>
            t.courseId === courseId ? { ...t, courseId: null, scope: "Personal" } : t
          ),
          activeCourse: state.activeCourse === courseId ? "all" : state.activeCourse,
          mutationError: null,
        }))
      ),

    addSession: async (session) => {
      const created = await addItem<CourseSession>("sessions", session, (item) =>
        set((state) => ({ sessions: [...state.sessions, item], mutationError: null }))
      );
      return created !== null;
    },

    deleteSession: (id) =>
      removeItem("sessions", id, () =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          mutationError: null,
        }))
      ),

    addCourseLink: async (courseId, link) => {
      const course = get().courses.find((c) => c.id === courseId);
      if (!course) return false;
      const newLink: CourseLink = { ...link, id: `clink-${Date.now()}` };
      return editItem<Course>(
        "courses",
        course.id,
        { links: [...(course.links || []), newLink] },
        applyCourse
      );
    },

    deleteCourseLink: async (courseId, linkId) => {
      const course = get().courses.find((c) => c.id === courseId);
      if (!course) return false;
      return editItem<Course>(
        "courses",
        course.id,
        { links: (course.links || []).filter((l) => l.id !== linkId) },
        applyCourse
      );
    },

    updateCourseLink: async (courseId, linkId, changes) => {
      const course = get().courses.find((c) => c.id === courseId);
      if (!course) return false;
      return editItem<Course>(
        "courses",
        course.id,
        {
          links: (course.links || []).map((l) =>
            l.id === linkId ? { ...l, ...changes } : l
          ),
        },
        applyCourse
      );
    },
  };
});

// Sincroniza cambios de proyectos y actividades hacia useScrumStore.
// Esta dirección vive aquí (y la inversa en useScrumStore.ts) para evitar
// evaluar el módulo circular a nivel superior durante la carga inicial.
useOrganizerStore.subscribe((state, prev) => {
  if (state.projects !== prev.projects) {
    useScrumStore.setState({ projects: state.projects });
  }
  if (state.activities !== prev.activities) {
    useScrumStore.setState({ activities: state.activities });
  }
});

// Si cambia el usuario (logout/login), se descartan los datos del anterior.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) {
    sessionEpoch += 1;
    inflightLoad = null;
    useOrganizerStore.setState({ ...initialData });
  }
});