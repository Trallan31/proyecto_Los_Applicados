import { useState, useMemo, useEffect } from "react";
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
 * Los datos y acciones viven en Zustand; aquí solo se calculan los derivados
 * y se mantiene la selección de proyecto como estado local de UI (no es un
 * dato: se inicializa con el query param ?project=).
 * Misma API pública de antes: ScrumView y sus hijos no cambian.
 */
export function useScrumBoard() {
  const user = useAuthStore((state) => state.user);
  const [searchParams] = useSearchParams();
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

  // Qué proyecto se está mirando es estado de la interfaz, no un dato.
  const [selectedProjectId, setSelectedProjectId] = useState<string>(urlProjectId);

  // Carga una sola vez por sesión; al volver desde /organizador no se re-pide.
  useEffect(() => {
    if (user) {
      void useScrumStore.getState().ensureLoaded();
    }
  }, [user]);

  const currentProjectId = selectedProjectId || urlProjectId;
  const project = projects.find((p) => p.id === currentProjectId) ?? projects[0];
  const activeProjectId = project?.id ?? "";

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
  function reorderTasks(orderedIds: string[]) {
    if (project) void storeReorderActivities(project.id, orderedIds);
  }

  function addCategory(name: string) {
    if (project) storeAddCategory(project.id, name);
  }

  async function deleteCategory(categoryName: string) {
    if (project) await storeDeleteCategory(project.id, categoryName);
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
    setSelectedProjectId(created.id);
    return true;
  }

  async function deleteProject(projectId: string) {
    const deleted = await storeDeleteProject(projectId);
    if (deleted && selectedProjectId === projectId) {
      setSelectedProjectId("");
    }
  }

  function inviteMember(u: User) {
    if (project) storeInviteMember(project.id, u);
  }

  async function removeMember(memberId: string) {
    if (project) await storeRemoveMember(project.id, memberId);
  }

  function updateMemberRole(memberId: string, role: ProjectRole) {
    if (project) storeUpdateMemberRole(project.id, memberId, role);
  }

  function addProjectLink(link: Omit<ProjectLink, "id">) {
    if (project) storeAddProjectLink(project.id, link);
  }

  function deleteProjectLink(linkId: string) {
    if (project) storeDeleteProjectLink(project.id, linkId);
  }

  function updateProjectLink(linkId: string, changes: Partial<Omit<ProjectLink, "id">>) {
    if (project) storeUpdateProjectLink(project.id, linkId, changes);
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
    setActiveProjectId: setSelectedProjectId,
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
