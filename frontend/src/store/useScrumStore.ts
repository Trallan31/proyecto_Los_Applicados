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
  updateActivity: <K extends keyof Activity>(taskId: string, field: K, value: Activity[K]) => void;
  addActivity: (projectId: string, task: Omit<Activity, "id" | "projectId">) => Promise<Activity | null>;
  deleteActivity: (taskId: string) => void;

  // Categorías.
  addCategory: (projectId: string, name: string) => void;
  deleteCategory: (projectId: string, categoryName: string) => Promise<void>;

  // Sprints.
  addSprint: (projectId: string, name: string) => Promise<Sprint | null>;
  deleteSprint: (sprintId: string) => Promise<void>;

  // Proyectos.
  createProject: (data: Omit<Project, "id" | "categories" | "members">) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;

  // Miembros.
  inviteMember: (projectId: string, user: User) => void;
  removeMember: (projectId: string, memberId: string) => Promise<void>;
  updateMemberRole: (projectId: string, memberId: string, role: ProjectRole) => void;

  // Enlaces del proyecto.
  addProjectLink: (projectId: string, link: Omit<ProjectLink, "id">) => void;
  deleteProjectLink: (projectId: string, linkId: string) => void;
  updateProjectLink: (projectId: string, linkId: string, changes: Partial<Omit<ProjectLink, "id">>) => void;
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

export const useScrumStore = create<ScrumState>((set, get) => {
  async function loadAll(): Promise<void> {
    set({ loading: true, loadError: null });
    try {
      const [projects, sprints, activities, users] = await Promise.all([
        api.list<Project>("projects"),
        api.list<Sprint>("sprints"),
        api.list<Activity>("activities"),
        api.list<User>("users"),
      ]);
      set({ projects, sprints, activities, users, loaded: true, loading: false });
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

    updateActivity: <K extends keyof Activity>(taskId: string, field: K, value: Activity[K]) => {
      void editItem<Activity>(
        "activities",
        taskId,
        { [field]: value } as Partial<Omit<Activity, "id">>,
        applyActivity
      );
    },

    addActivity: (projectId, task) =>
      addItem<Activity>("activities", { ...task, projectId }, (created) =>
        set((state) => ({ activities: [...state.activities, created], mutationError: null }))
      ),

    deleteActivity: (taskId) => {
      void removeItem("activities", taskId, () =>
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== taskId),
          mutationError: null,
        }))
      );
    },

    addCategory: (projectId, name) => {
      const trimmed = name.trim();
      const project = get().projects.find((p) => p.id === projectId);
      if (!project || !trimmed || project.categories.includes(trimmed)) return;
      void editItem<Project>(
        "projects",
        project.id,
        { categories: [...project.categories, trimmed] },
        applyProject
      );
    },

    /** Borra la categoría del proyecto y la quita de las tareas que la usaban. */
    deleteCategory: async (projectId, categoryName) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project) return;
      const updated = await editItem<Project>(
        "projects",
        project.id,
        { categories: project.categories.filter((c) => c !== categoryName) },
        applyProject
      );
      if (!updated) return;
      const affected = get().activities.filter(
        (a) => a.projectId === projectId && a.category === categoryName
      );
      await Promise.all(
        affected.map((task) =>
          editItem<Activity>("activities", task.id, { category: "" }, applyActivity)
        )
      );
    },

    addSprint: (projectId, name) =>
      addItem<Sprint>("sprints", { projectId, name: name.trim() }, (created) =>
        set((state) => ({ sprints: [...state.sprints, created], mutationError: null }))
      ),

    /** Borra el sprint y deja sin sprint a las tareas que lo tenían. */
    deleteSprint: async (sprintId) => {
      const deleted = await removeItem("sprints", sprintId, () =>
        set((state) => ({
          sprints: state.sprints.filter((s) => s.id !== sprintId),
          mutationError: null,
        }))
      );
      if (!deleted) return;
      await get().refetch();
    },

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

    /** Borra el proyecto con sus sprints y tareas, para no dejar huérfanos. */
    deleteProject: async (projectId) => {
      const deleted = await removeItem("projects", projectId, () =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          mutationError: null,
        }))
      );
      if (!deleted) return false;
      await get().refetch();
      return true;
    },

    inviteMember: (projectId, user) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project || project.members.some((m) => m.userId === user.id)) return;
      const members: ProjectMember[] = [...project.members, { userId: user.id, role: "Miembro" }];
      void editItem<Project>("projects", project.id, { members }, applyProject);
    },

    /** No se puede dejar el proyecto sin miembros ni sin ningún Admin. */
    removeMember: async (projectId, memberId) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project) return;
      const target = project.members.find((m) => m.userId === memberId);
      if (!target || project.members.length <= 1) return;
      const adminCount = project.members.filter((m) => m.role === "Admin").length;
      if (target.role === "Admin" && adminCount <= 1) return;
      const updated = await editItem<Project>(
        "projects",
        project.id,
        { members: project.members.filter((m) => m.userId !== memberId) },
        applyProject
      );
      if (!updated) return;
      const affected = get().activities.filter(
        (a) => a.projectId === projectId && a.members.includes(memberId)
      );
      await Promise.all(
        affected.map((task) =>
          editItem<Activity>(
            "activities",
            task.id,
            { members: task.members.filter((id) => id !== memberId) },
            applyActivity
          )
        )
      );
    },

    updateMemberRole: (projectId, memberId, role) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project) return;
      if (role === "Miembro") {
        const target = project.members.find((m) => m.userId === memberId);
        const adminCount = project.members.filter((m) => m.role === "Admin").length;
        if (target?.role === "Admin" && adminCount <= 1) return;
      }
      void editItem<Project>(
        "projects",
        project.id,
        { members: project.members.map((m) => (m.userId === memberId ? { ...m, role } : m)) },
        applyProject
      );
    },

    addProjectLink: (projectId, link) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project) return;
      const newLink: ProjectLink = { ...link, id: `link-${Date.now()}` };
      void editItem<Project>(
        "projects",
        project.id,
        { links: [...(project.links || []), newLink] },
        applyProject
      );
    },

    deleteProjectLink: (projectId, linkId) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project) return;
      void editItem<Project>(
        "projects",
        project.id,
        { links: (project.links || []).filter((l) => l.id !== linkId) },
        applyProject
      );
    },

    updateProjectLink: (projectId, linkId, changes) => {
      const project = get().projects.find((p) => p.id === projectId);
      if (!project) return;
      void editItem<Project>(
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
useScrumStore.subscribe((state, prev) => {
  if (state.projects !== prev.projects) {
    useOrganizerStore.setState({ projects: state.projects });
  }
  if (state.activities !== prev.activities) {
    useOrganizerStore.setState({ activities: state.activities });
  }
});

// El Organizador solo muta activities (estado de tareas derivadas).
useOrganizerStore.subscribe((state, prev) => {
  if (state.activities !== prev.activities) {
    useScrumStore.setState({ activities: state.activities });
  }
});

// Si cambia el usuario (logout/login), se descartan los datos del anterior.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) {
    useScrumStore.setState({ ...initialData });
  }
});
