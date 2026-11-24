import { create } from "zustand";
import * as api from "../api/client";
import type {
  Activity,
  Project,
  ProjectLink,
  ProjectMember,
  ProjectRole,
  Sprint,
  User,
} from "../types";
import { useAuthStore } from "./useAuthStore";
import { useOrganizerStore } from "./useOrganizerStore";

interface ScrumState {
  // Datos: colecciones REST del tablero de equipo.
  projects: Project[];
  sprints: Sprint[];
  activities: Activity[];
  users: User[];

  // Estado de carga.
  loaded: boolean;
  loading: boolean;
  loadError: string | null;
  mutationError: string | null;

  ensureLoaded: () => Promise<void>;
  refetch: () => Promise<void>;
  clearMutationError: () => void;

  // Actividades (tareas del tablero).
  updateActivity: <K extends keyof Activity>(taskId: string, field: K, value: Activity[K]) => Promise<boolean>;
  addActivity: (projectId: string, task: Omit<Activity, "id" | "projectId">) => Promise<Activity | null>;
  deleteActivity: (taskId: string) => Promise<boolean>;
  reorderActivities: (projectId: string, orderedIds: string[]) => Promise<void>;

  // Categorías.
  addCategory: (projectId: string, name: string) => Promise<boolean>;
  deleteCategory: (projectId: string, categoryName: string) => Promise<boolean>;

  // Sprints.
  addSprint: (projectId: string, name: string) => Promise<Sprint | null>;
  deleteSprint: (sprintId: string) => Promise<boolean>;

  // Proyectos.
  createProject: (data: Omit<Project, "id" | "categories" | "members">) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;

  // Miembros.
  inviteMember: (projectId: string, user: User) => Promise<boolean>;
  removeMember: (projectId: string, memberId: string) => Promise<boolean>;
  updateMemberRole: (projectId: string, memberId: string, role: ProjectRole) => Promise<boolean>;

  // Enlaces del proyecto.
  addProjectLink: (projectId: string, link: Omit<ProjectLink, "id">) => Promise<boolean>;
  deleteProjectLink: (projectId: string, linkId: string) => Promise<boolean>;
  updateProjectLink: (projectId: string, linkId: string, changes: Partial<Omit<ProjectLink, "id">>) => Promise<boolean>;
}

const initialData = {
  projects: [] as Project[],
  sprints: [] as Sprint[],
  activities: [] as Activity[],
  users: [] as User[],
  loaded: false,
  loading: true,
  loadError: null as string | null,
  mutationError: null as string | null,
};

let inflightLoad: Promise<void> | null = null;
// Se incrementa al cambiar de usuario para descartar cargas obsoletas en vuelo.
let sessionEpoch = 0;
// Identificador secuencial para que un refetch() posterior invalide cargas previas.
let latestLoadId = 0;

export const useScrumStore = create<ScrumState>((set, get) => {
  async function loadAll(force: boolean): Promise<void> {
    const epoch = sessionEpoch;
    const loadId = ++latestLoadId;
    set({ loading: true, loadError: null });
    try {
      // Si el Organizador ya cargó y no es refetch forzado, reutilizamos projects y activities.
      if (!force && useOrganizerStore.getState().loaded) {
        const [sprints, users] = await Promise.all([
          api.list<Sprint>("sprints"),
          api.list<User>("users"),
        ]);
        if (epoch !== sessionEpoch || loadId !== latestLoadId) return;
        const { projects, activities } = useOrganizerStore.getState();
        set({ projects, sprints, activities, users, loaded: true, loading: false });
        return;
      }

      const [projects, sprints, activities, users] = await Promise.all([
        api.list<Project>("projects"),
        api.list<Sprint>("sprints"),
        api.list<Activity>("activities"),
        api.list<User>("users"),
      ]);
      if (epoch !== sessionEpoch || loadId !== latestLoadId) return;
      set({ projects, sprints, activities, users, loaded: true, loading: false });
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

  async function removeItem(resource: string, id: string, apply: () => void): Promise<boolean> {
    try {
      await api.remove(resource, id);
      apply();
      return true;
    } catch (error: unknown) {
      set({ mutationError: api.describeError(error) });
      return false;
    }
  }

  const applyProject = (updated: Project) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
      mutationError: null,
    }));

  const applyActivity = (updated: Activity) =>
    set((state) => ({
      activities: state.activities.map((a) => (a.id === updated.id ? updated : a)),
      mutationError: null,
    }));

  return {
    ...initialData,

    ensureLoaded: () => load(false),
    refetch: () => load(true),
    clearMutationError: () => set({ mutationError: null }),

    updateActivity: <K extends keyof Activity>(taskId: string, field: K, value: Activity[K]) =>
      editItem<Activity>(
        "activities",
        taskId,
        { [field]: value } as Partial<Omit<Activity, "id">>,
        applyActivity
      ),

    /** La tarea nueva queda al final del tablero del proyecto. */
    addActivity: (projectId, task) => {
      const lastOrder = get()
        .activities.filter((a) => a.projectId === projectId)
        .reduce((max, a) => Math.max(max, a.order ?? 0), -1);
      return addItem<Activity>(
        "activities",
        { ...task, projectId, order: task.order ?? lastOrder + 1 },
        (created) =>
          set((state) => ({ activities: [...state.activities, created], mutationError: null }))
      );
    },

    deleteActivity: (taskId) =>
      removeItem("activities", taskId, () =>
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== taskId),
          mutationError: null,
        }))
      ),

    /**
     * Reordena las tareas del proyecto segun `orderedIds`: aplica el orden
     * nuevo al instante y luego guarda solo las que cambiaron de posicion.
     * Si alguna falla se restaura el orden anterior y se sincroniza con el
     * servidor para evitar inconsistencias ante fallos parciales.
     */
    reorderActivities: async (projectId, orderedIds) => {
      const epoch = sessionEpoch;
      const previous = get().activities;
      const positionById = new Map(orderedIds.map((id, index) => [id, index]));
      set({
        activities: previous.map((a) =>
          positionById.has(a.id) ? { ...a, order: positionById.get(a.id) } : a
        ),
        mutationError: null,
      });
      const moved = previous.filter(
        (a) =>
          a.projectId === projectId &&
          positionById.has(a.id) &&
          a.order !== positionById.get(a.id)
      );
      if (moved.length === 0) return;
      try {
        await Promise.all(
          moved.map((a) =>
            api.update<Activity>("activities", a.id, { order: positionById.get(a.id) })
          )
        );
      } catch (error: unknown) {
        if (epoch !== sessionEpoch) return;
        set({ activities: previous, mutationError: api.describeError(error) });
        await get().refetch();
      }
    },

    addCategory: async (projectId, name) => {
      const trimmed = name.trim();
      const project = get().projects.find((p) => p.id === projectId);
      if (!project || !trimmed) return false;
      if (project.categories.includes(trimmed)) return true;
      return editItem<Project>(
        "projects",
        project.id,
        { categories: [...project.categories, trimmed] },
        applyProject
      );
    },

    /** Borra la categoría del proyecto; el servidor la quita de las tareas. */
    deleteCategory: async (projectId, categoryName) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project) return false;
      return editItem<Project>(
        "projects",
        project.id,
        { categories: project.categories.filter((c) => c !== categoryName) },
        (updated) =>
          set((state) => ({
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
            activities: state.activities.map((a) =>
              a.projectId === projectId && a.category === categoryName
                ? { ...a, category: "" }
                : a
            ),
            mutationError: null,
          }))
      );
    },

    addSprint: (projectId, name) =>
      addItem<Sprint>("sprints", { projectId, name: name.trim() }, (created) =>
        set((state) => ({ sprints: [...state.sprints, created], mutationError: null }))
      ),

    /** Borra el sprint y deja sin sprint en memoria a las tareas que lo tenían. */
    deleteSprint: (sprintId) =>
      removeItem("sprints", sprintId, () =>
        set((state) => ({
          sprints: state.sprints.filter((s) => s.id !== sprintId),
          activities: state.activities.map((a) =>
            a.sprintId === sprintId ? { ...a, sprintId: "" } : a
          ),
          mutationError: null,
        }))
      ),

    createProject: async (projectData) => {
      const user = useAuthStore.getState().user;
      if (!user) return null;
      const created = await addItem<Project>(
        "projects",
        {
          ...projectData,
          categories: ["General"],
          members: [{ userId: user.id, role: "Admin" }],
        },
        (p) => set((state) => ({ projects: [...state.projects, p], mutationError: null }))
      );
      if (!created) return null;
      // Si falla crear el sprint, el proyecto sigue disponible
      // y el error queda visible en mutationError.
      await addItem<Sprint>("sprints", { projectId: created.id, name: "Sprint 1" }, (s) =>
        set((state) => ({ sprints: [...state.sprints, s], mutationError: null }))
      );
      return created;
    },

    /** Borra el proyecto con sus sprints y tareas en memoria, sin dejar huérfanos. */
    deleteProject: (projectId) =>
      removeItem("projects", projectId, () =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          sprints: state.sprints.filter((s) => s.projectId !== projectId),
          activities: state.activities.filter((a) => a.projectId !== projectId),
          mutationError: null,
        }))
      ),

    inviteMember: async (projectId, user) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project || project.members.some((m) => m.userId === user.id)) return false;
      const members: ProjectMember[] = [...project.members, { userId: user.id, role: "Miembro" }];
      return editItem<Project>("projects", project.id, { members }, applyProject);
    },

    /** No se puede dejar el proyecto sin miembros ni sin ningún Admin. */
    removeMember: async (projectId, memberId) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project) return false;
      const target = project.members.find((m) => m.userId === memberId);
      if (!target || project.members.length <= 1) return false;
      const adminCount = project.members.filter((m) => m.role === "Admin").length;
      if (target.role === "Admin" && adminCount <= 1) return false;
      return editItem<Project>(
        "projects",
        project.id,
        { members: project.members.filter((m) => m.userId !== memberId) },
        (updated) =>
          set((state) => ({
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
            activities: state.activities.map((a) =>
              a.projectId === projectId && a.members.includes(memberId)
                ? { ...a, members: a.members.filter((id) => id !== memberId) }
                : a
            ),
            mutationError: null,
          }))
      );
    },

    updateMemberRole: async (projectId, memberId, role) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project) return false;
      const target = project.members.find((m) => m.userId === memberId);
      if (!target) return false;
      if (role === "Miembro") {
        const adminCount = project.members.filter((m) => m.role === "Admin").length;
        if (target.role === "Admin" && adminCount <= 1) return false;
      }
      return editItem<Project>(
        "projects",
        project.id,
        { members: project.members.map((m) => (m.userId === memberId ? { ...m, role } : m)) },
        applyProject
      );
    },

    addProjectLink: async (projectId, link) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project) return false;
      const newLink: ProjectLink = { ...link, id: `link-${Date.now()}` };
      return editItem<Project>(
        "projects",
        project.id,
        { links: [...(project.links || []), newLink] },
        applyProject
      );
    },

    deleteProjectLink: async (projectId, linkId) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project) return false;
      return editItem<Project>(
        "projects",
        project.id,
        { links: (project.links || []).filter((l) => l.id !== linkId) },
        applyProject
      );
    },

    updateProjectLink: async (projectId, linkId, changes) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project) return false;
      return editItem<Project>(
        "projects",
        project.id,
        { links: (project.links || []).map((l) => (l.id === linkId ? { ...l, ...changes } : l)) },
        applyProject
      );
    },
  };
});

// --- Sincronización con el Organizador (projects y activities compartidos) ---
// Guards por referencia: al propagar se copia el mismo array, el eco se detiene.
// La dirección inversa (Organizador -> Scrum) se suscribe en useOrganizerStore.ts
// para evitar evaluar la dependencia circular en el nivel superior.
useScrumStore.subscribe((state, prev) => {
  if (state.projects !== prev.projects) {
    useOrganizerStore.setState({ projects: state.projects });
  }
  if (state.activities !== prev.activities) {
    useOrganizerStore.setState({ activities: state.activities });
  }
});

// Si cambia el usuario (logout/login), se descartan los datos del anterior.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) {
    sessionEpoch += 1;
    inflightLoad = null;
    useScrumStore.setState({ ...initialData });
  }
});
