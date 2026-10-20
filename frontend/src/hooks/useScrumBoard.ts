import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useCollection } from "./useCollection";
import type { Project, ProjectMember, ProjectRole, Activity, User, Member, Sprint, ProjectLink } from "../types";
import { useAuth } from "../context/AuthContext";

export function useScrumBoard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get("project") ?? "";

  const projects = useCollection<Project>("projects");
  const sprints = useCollection<Sprint>("sprints");
  const activities = useCollection<Activity>("activities");
  const users = useCollection<User>("users");

  // Que proyecto se esta mirando es estado de la interfaz, no un dato: no
  // viaja a la API. Se inicializa con el query param ?project= si viene en la URL.
  const [selectedProjectId, setSelectedProjectId] = useState<string>(urlProjectId);

  const loading = projects.loading || sprints.loading || activities.loading || users.loading;
  const error = projects.error ?? sprints.error ?? activities.error ?? users.error;
  const mutationError =
    projects.mutationError ??
    sprints.mutationError ??
    activities.mutationError ??
    users.mutationError;

  const refetch = async () => {
    await Promise.all([
      projects.refetch(),
      sprints.refetch(),
      activities.refetch(),
      users.refetch(),
    ]);
  };

  const clearMutationError = () => {
    projects.clearMutationError();
    sprints.clearMutationError();
    activities.clearMutationError();
    users.clearMutationError();
  };

  const currentProjectId = selectedProjectId || urlProjectId;
  const project =
    projects.items.find((p) => p.id === currentProjectId) ?? projects.items[0];
  const activeProjectId = project?.id ?? "";

  const projectSprints = useMemo(
    () => sprints.items.filter((s) => s.projectId === activeProjectId),
    [sprints.items, activeProjectId]
  );

  const projectTasks = useMemo(
    () => activities.items.filter((a) => a.projectId === activeProjectId),
    [activities.items, activeProjectId]
  );

  // El proyecto guarda solo { userId, role }. Para la interfaz se cruza con
  // /users y se arma el Member completo.
  const projectMembers = useMemo<Member[]>(() => {
    if (!project) return [];
    return project.members.flatMap((m) => {
      const user = users.items.find((u) => u.id === m.userId);
      return user ? [{ ...user, role: m.role }] : [];
    });
  }, [project, users.items]);

  function updateTask<K extends keyof Activity>(taskId: string, field: K, value: Activity[K]) {
    void activities.edit(taskId, { [field]: value } as Partial<Omit<Activity, "id">>);
  }

  function addTask(task: Omit<Activity, "id" | "projectId">) {
    if (!project) return;
    void activities.add({ ...task, projectId: project.id });
  }

  function deleteTask(taskId: string) {
    void activities.destroy(taskId);
  }

  function addCategory(name: string) {
    const trimmed = name.trim();
    if (!project || !trimmed || project.categories.includes(trimmed)) return;
    void projects.edit(project.id, { categories: [...project.categories, trimmed] });
  }

  /** Borra la categoria del proyecto y la quita de las tareas que la usaban. */
  async function deleteCategory(categoryName: string) {
    if (!project) return;
    const updated = await projects.edit(project.id, {
      categories: project.categories.filter(
        (category) => category !== categoryName
      ),
    });
    if (!updated) return;
    await Promise.all(
      projectTasks
        .filter((task) => task.category === categoryName)
        .map((task) =>
          activities.edit(task.id, { category: "" })
        )
    );
  }

  async function addSprint(name: string): Promise<Sprint | null> {
    if (!project) return null;
    return sprints.add({ projectId: project.id, name: name.trim() });
  }

  /** Borra el sprint y deja sin sprint a las tareas que lo tenian. */
  async function deleteSprint(sprintId: string) {
    const deleted = await sprints.destroy(sprintId);
    if (!deleted) return;
    await Promise.all([
      sprints.refetch(),
      activities.refetch(),
    ]);
  }

  /** Borra el proyecto con sus sprints y tareas, para no dejar huerfanos. */
  async function deleteProject(projectId: string) {
    const deleted = await projects.destroy(projectId);
    if (!deleted) return;
    if (selectedProjectId === projectId) {
      setSelectedProjectId("");
    }
    await refetch();
  }

  async function createProject(projectData: Omit<Project, "id" | "categories" | "members">): Promise<boolean> {
    if (!user) return false;
    const created = await projects.add({
      ...projectData,
      categories: ["General"],
      members: [
        {
          userId: user.id,
          role: "Admin",
        },
      ],
    });
    if (!created) return false;
    setSelectedProjectId(created.id);
    // Si falla crear el sprint, el proyecto sigue disponible
    // y el error queda visible en mutationError.
    await sprints.add({
      projectId: created.id,
      name: "Sprint 1",
    });
    return true;
  }

  function inviteMember(user: User) {
    if (!project || project.members.some((m) => m.userId === user.id)) return;
    const members: ProjectMember[] = [...project.members, { userId: user.id, role: "Miembro" }];
    void projects.edit(project.id, { members });
  }

  /** No se puede dejar el proyecto sin miembros ni sin ningun Admin. */
  async function removeMember(memberId: string) {
    if (!project) return;
    const target = project.members.find((member) => member.userId === memberId);
    if (!target || project.members.length <= 1) return;
    const adminCount = project.members.filter((member) => member.role === "Admin").length;
    if (target.role === "Admin" && adminCount <= 1) return;
    const updated = await projects.edit(project.id, {
      members: project.members.filter(
        (member) => member.userId !== memberId
      ),
    });
    if (!updated) return;
    await Promise.all(
      projectTasks
        .filter((task) => task.members.includes(memberId))
        .map((task) =>
          activities.edit(task.id, {
            members: task.members.filter(
              (id) => id !== memberId
            ),
          })
        )
    );
  }

  function updateMemberRole(memberId: string, role: ProjectRole) {
    if (!project) return;
    if (role === "Miembro") {
      const target = project.members.find((m) => m.userId === memberId);
      const adminCount = project.members.filter((m) => m.role === "Admin").length;
      if (target?.role === "Admin" && adminCount <= 1) return;
    }
    void projects.edit(project.id, {
      members: project.members.map((m) => (m.userId === memberId ? { ...m, role } : m)),
    });
  }

  function addProjectLink(link: Omit<ProjectLink, "id">) {
    if (!project) return;
    const newLink: ProjectLink = {
      ...link,
      id: `link-${Date.now()}`,
    };
    void projects.edit(project.id, {
      links: [...(project.links || []), newLink],
    });
  }

  function deleteProjectLink(linkId: string) {
    if (!project) return;
    void projects.edit(project.id, {
      links: (project.links || []).filter((l) => l.id !== linkId),
    });
  }

  function updateProjectLink(linkId: string, changes: Partial<Omit<ProjectLink, "id">>) {
    if (!project) return;
    void projects.edit(project.id, {
      links: (project.links || []).map((l) => (l.id === linkId ? { ...l, ...changes } : l)),
    });
  }

  return {
    projects: projects.items,
    users: users.items,
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
