import { useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  Activity,
  Member,
  Project,
  ProjectLink,
  ProjectRole,
  Sprint,
  User,
} from "../types";
import { useAuthStore } from "../store/useAuthStore";
import { useScrumStore } from "../store/useScrumStore";

/**
 * Capa delgada sobre el store global (useScrumStore).
 * Los datos y acciones viven en Zustand; aquí se calculan los derivados,
 * el rol del usuario actual y se mantiene sincronizado ?project= en la URL.
 */
export function useScrumBoard() {
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlProjectId = searchParams.get("project") ?? "";

  const projects = useScrumStore((s) => s.projects);
  const sprints = useScrumStore((s) => s.sprints);
  const activities = useScrumStore((s) => s.activities);
  const users = useScrumStore((s) => s.users);

  const loading = useScrumStore((s) => s.loading);
  const error = useScrumStore((s) => s.loadError);
  const mutationError = useScrumStore((s) => s.mutationError);
  const clearMutationError = useScrumStore((s) => s.clearMutationError);
  const refetch = useScrumStore((s) => s.refetch);

  const updateTask = useScrumStore((s) => s.updateActivity);
  const addActivity = useScrumStore((s) => s.addActivity);
  const deleteTask = useScrumStore((s) => s.deleteActivity);
  const storeReorderActivities = useScrumStore((s) => s.reorderActivities);
  const storeAddCategory = useScrumStore((s) => s.addCategory);
  const storeDeleteCategory = useScrumStore((s) => s.deleteCategory);
  const storeAddSprint = useScrumStore((s) => s.addSprint);
  const deleteSprint = useScrumStore((s) => s.deleteSprint);
  const storeCreateProject = useScrumStore((s) => s.createProject);
  const storeDeleteProject = useScrumStore((s) => s.deleteProject);
  const storeInviteMember = useScrumStore((s) => s.inviteMember);
  const storeRemoveMember = useScrumStore((s) => s.removeMember);
  const storeUpdateMemberRole = useScrumStore((s) => s.updateMemberRole);
  const storeAddProjectLink = useScrumStore((s) => s.addProjectLink);
  const storeDeleteProjectLink = useScrumStore((s) => s.deleteProjectLink);
  const storeUpdateProjectLink = useScrumStore((s) => s.updateProjectLink);

  // Carga una sola vez por sesión; al volver desde /organizador no se re-pide.
  useEffect(() => {
    if (user) {
      void useScrumStore.getState().ensureLoaded();
    }
  }, [user]);

  const project = projects.find((p) => p.id === urlProjectId) ?? projects[0];
  const activeProjectId = project?.id ?? "";
  const currentUserRole =
    project?.members.find((m) => m.userId === user?.id)?.role ?? null;
  const isAdmin = currentUserRole === "Admin";

  const updateProjectParam = useCallback(
    (projectId: string, replace: boolean) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (projectId) {
            next.set("project", projectId);
          } else {
            next.delete("project");
          }
          return next;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  const setActiveProjectId = useCallback(
    (projectId: string) => {
      updateProjectParam(projectId, false);
    },
    [updateProjectParam]
  );

  // Sincroniza ?project= en la URL una vez que los proyectos están cargados.
  useEffect(() => {
    if (loading || error) return;
    if (projects.length === 0) {
      if (urlProjectId) {
        updateProjectParam("", true);
      }
      return;
    }
    if (activeProjectId && urlProjectId !== activeProjectId) {
      updateProjectParam(activeProjectId, true);
    }
  }, [
    loading,
    error,
    projects.length,
    activeProjectId,
    urlProjectId,
    updateProjectParam,
  ]);

  const projectSprints = useMemo(
    () => sprints.filter((s) => s.projectId === activeProjectId),
    [sprints, activeProjectId]
  );

  // El tablero se muestra en el orden que dejo el drag & drop. Las
  // actividades antiguas no tienen `order` y cuentan como 0: al ser estable,
  // sort las deja en el orden en que vinieron de la API.
  const projectTasks = useMemo(
    () =>
      activities
        .filter((a) => a.projectId === activeProjectId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [activities, activeProjectId]
  );

  // El proyecto guarda solo { userId, role }. Se cruza con /users para armar Member.
  const projectMembers = useMemo<Member[]>(() => {
    if (!project) return [];
    return project.members.flatMap((m) => {
      const u = users.find((x) => x.id === m.userId);
      return u ? [{ ...u, role: m.role }] : [];
    });
  }, [project, users]);

  async function addTask(task: Omit<Activity, "id" | "projectId">): Promise<Activity | null> {
    if (!project) return null;
    return addActivity(project.id, task);
  }

  /** Guarda el orden completo de las tareas del proyecto activo. */
  const reorderTasks = useCallback(
    (orderedIds: string[]) => {
      if (activeProjectId) {
        void storeReorderActivities(activeProjectId, orderedIds);
      }
    },
    [activeProjectId, storeReorderActivities]
  );

  async function addCategory(name: string): Promise<boolean> {
    if (!project) return false;
    return storeAddCategory(project.id, name);
  }

  async function deleteCategory(categoryName: string): Promise<boolean> {
    if (!project) return false;
    return storeDeleteCategory(project.id, categoryName);
  }

  async function addSprint(name: string): Promise<Sprint | null> {
    if (!project) return null;
    return storeAddSprint(project.id, name);
  }

  async function createProject(
    projectData: Omit<Project, "id" | "categories" | "members">
  ): Promise<boolean> {
    const created = await storeCreateProject(projectData);
    if (!created) return false;
    setActiveProjectId(created.id);
    return true;
  }

  async function deleteProject(projectId: string): Promise<boolean> {
    const deleted = await storeDeleteProject(projectId);
    if (deleted && activeProjectId === projectId) {
      const nextProject = projects.find((p) => p.id !== projectId);
      updateProjectParam(nextProject?.id ?? "", true);
    }
    return deleted;
  }

  async function inviteMember(u: User): Promise<boolean> {
    if (!project) return false;
    return storeInviteMember(project.id, u);
  }

  async function removeMember(memberId: string): Promise<boolean> {
    if (!project) return false;
    return storeRemoveMember(project.id, memberId);
  }

  async function updateMemberRole(memberId: string, role: ProjectRole): Promise<boolean> {
    if (!project) return false;
    return storeUpdateMemberRole(project.id, memberId, role);
  }

  async function addProjectLink(link: Omit<ProjectLink, "id">): Promise<boolean> {
    if (!project) return false;
    return storeAddProjectLink(project.id, link);
  }

  async function deleteProjectLink(linkId: string): Promise<boolean> {
    if (!project) return false;
    return storeDeleteProjectLink(project.id, linkId);
  }

  async function updateProjectLink(
    linkId: string,
    changes: Partial<Omit<ProjectLink, "id">>
  ): Promise<boolean> {
    if (!project) return false;
    return storeUpdateProjectLink(project.id, linkId, changes);
  }

  return {
    projects,
    users,
    loading,
    error,
    mutationError,
    clearMutationError,
    refetch,
    project,
    activeProjectId,
    isAdmin,
    setActiveProjectId,
    projectSprints,
    projectTasks,
    projectMembers,
    updateTask,
    addTask,
    deleteTask,
    reorderTasks,
    addCategory,
    deleteCategory,
    addSprint,
    deleteSprint,
    deleteProject,
    createProject,
    inviteMember,
    removeMember,
    updateMemberRole,
    addProjectLink,
    deleteProjectLink,
    updateProjectLink,
  };
}
