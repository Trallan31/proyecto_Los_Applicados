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
  addTask: (task: Omit<OrganizerTask, "id" | "userId">) => void;
  updateTask: (id: string, changes: Partial<Omit<OrganizerTask, "id" | "userId">>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => Promise<OrganizerTask["status"] | null>;
  setTaskStatus: (
    id: string,
    status: OrganizerTask["status"],
    scrumRestoreStatus?: Status
  ) => Promise<boolean>;

  // Ramos, sesiones y enlaces.
  addCourse: (course: Omit<Course, "id" | "userId">) => void;
  deleteCourse: (courseId: string) => Promise<void>;
  addSession: (session: Omit<CourseSession, "id">) => void;
  deleteSession: (id: string) => void;
  addCourseLink: (courseId: string, link: Omit<CourseLink, "id">) => void;
  deleteCourseLink: (courseId: string, linkId: string) => void;
  updateCourseLink: (
    courseId: string,
    linkId: string,
    changes: Partial<Omit<CourseLink, "id">>
  ) => void;
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

export const useOrganizerStore = create<OrganizerState>((set, get) => {
  async function loadAll(): Promise<void> {
    set({ loading: true, loadError: null });
    try {
      const [courses, sessions, tasks, activities, projects] = await Promise.all([
        api.list<Course>("courses"),
        api.list<CourseSession>("sessions"),
        api.list<OrganizerTask>("tasks"),
        api.list<Activity>("activities"),
        api.list<Project>("projects"),
      ]);
      set({ courses, sessions, tasks, activities, projects, loaded: true, loading: false });
    } catch (error: unknown) {
      set({ loadError: api.describeError(error), loading: false });
    }
  }

  function load(force: boolean): Promise<void> {
    if (!force && get().loaded) return Promise.resolve();
    if (!inflightLoad) {
      inflightLoad = loadAll().finally(() => {
        inflightLoad = null;
      });
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

    addTask: (task) => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      void addItem<OrganizerTask>("tasks", { ...task, userId: user.id }, (created) =>
        set((state) => ({ tasks: [...state.tasks, created], mutationError: null }))
      );
    },

    /** Las derivadas no se editan desde acá: se editan en el tablero. */
    updateTask: (id, changes) => {
      if (activityIdOf(id) !== null) return;
      void editItem<OrganizerTask>("tasks", id, changes, (updated) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === updated.id ? updated : t)),
          mutationError: null,
        }))
      );
    },

    /** Las derivadas no se borran desde acá: se borran en el tablero. */
    deleteTask: (id) => {
      if (activityIdOf(id) !== null) return;
      void removeItem("tasks", id, () =>
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

    addCourse: (course) => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      void addItem<Course>("courses", { ...course, userId: user.id }, (created) =>
        set((state) => ({ courses: [...state.courses, created], mutationError: null }))
      );
    },

    /** Borra el ramo y, en cascada, sus sesiones. Las tareas quedan personales. */
    deleteCourse: async (courseId) => {
      const deleted = await removeItem("courses", courseId, () =>
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== courseId),
          mutationError: null,
        }))
      );
      if (!deleted) return;
      if (get().activeCourse === courseId) {
        set({ activeCourse: "all" });
      }
      await get().refetch();
    },

    addSession: (session) => {
      void addItem<CourseSession>("sessions", session, (created) =>
        set((state) => ({ sessions: [...state.sessions, created], mutationError: null }))
      );
    },

    deleteSession: (id) => {
      void removeItem("sessions", id, () =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          mutationError: null,
        }))
      );
    },

    addCourseLink: (courseId, link) => {
      const course = get().courses.find((c) => c.id === courseId);
      if (!course) return;
      const newLink: CourseLink = { ...link, id: `clink-${Date.now()}` };
      void editItem<Course>(
        "courses",
        course.id,
        { links: [...(course.links || []), newLink] },
        (updated) =>
          set((state) => ({
            courses: state.courses.map((c) => (c.id === updated.id ? updated : c)),
            mutationError: null,
          }))
      );
    },

    deleteCourseLink: (courseId, linkId) => {
      const course = get().courses.find((c) => c.id === courseId);
      if (!course) return;
      void editItem<Course>(
        "courses",
        course.id,
        { links: (course.links || []).filter((l) => l.id !== linkId) },
        (updated) =>
          set((state) => ({
            courses: state.courses.map((c) => (c.id === updated.id ? updated : c)),
            mutationError: null,
          }))
      );
    },

    updateCourseLink: (courseId, linkId, changes) => {
      const course = get().courses.find((c) => c.id === courseId);
      if (!course) return;
      void editItem<Course>(
        "courses",
        course.id,
        {
          links: (course.links || []).map((l) =>
            l.id === linkId ? { ...l, ...changes } : l
          ),
        },
        (updated) =>
          set((state) => ({
            courses: state.courses.map((c) => (c.id === updated.id ? updated : c)),
            mutationError: null,
          }))
      );
    },
  };
});

// Si cambia el usuario (logout/login), se descartan los datos del anterior.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) {
    useOrganizerStore.setState({ ...initialData });
  }
});