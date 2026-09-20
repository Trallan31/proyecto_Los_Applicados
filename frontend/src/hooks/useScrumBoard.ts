import { useState, useMemo } from "react";
import { useCollection } from "./useCollection";
import type { Project, ProjectMember, ProjectRole, Activity, User, Member, Sprint } from "../types";

export function useScrumBoard() {
  const projects = useCollection<Project>("projects");
  const sprints = useCollection<Sprint>("sprints");
  const activities = useCollection<Activity>("activities");
  const users = useCollection<User>("users");

  // Que proyecto se esta mirando es estado de la interfaz, no un dato: no
  // viaja a la API. Si todavia no hay seleccion, se muestra el primero.
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const loading = projects.loading || sprints.loading || activities.loading || users.loading;
  const error = projects.error ?? sprints.error ?? activities.error ?? users.error;

  const project = projects.items.find((p) => p.id === selectedProjectId) ?? projects.items[0];
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
    await projects.edit(project.id, {
      categories: project.categories.filter((c) => c !== categoryName),
    });
    await Promise.all(
      projectTasks
        .filter((t) => t.category === categoryName)
        .map((t) => activities.edit(t.id, { category: "" }))
    );
  }

  async function addSprint(name: string): Promise<Sprint | null> {
    if (!project) return null;
    return sprints.add({ projectId: project.id, name: name.trim() });
  }

  /** Borra el sprint y deja sin sprint a las tareas que lo tenian. */
  async function deleteSprint(sprintId: string) {
    await sprints.destroy(sprintId);
    await Promise.all(
      projectTasks
        .filter((t) => t.sprintId === sprintId)
        .map((t) => activities.edit(t.id, { sprintId: "" }))
    );
  }

  /** Borra el proyecto con sus sprints y tareas, para no dejar huerfanos. */
  async function deleteProject(projectId: string) {
    await Promise.all(
      activities.items.filter((a) => a.projectId === projectId).map((a) => activities.destroy(a.id))
    );
    await Promise.all(
      sprints.items.filter((s) => s.projectId === projectId).map((s) => sprints.destroy(s.id))
    );
    await projects.destroy(projectId);
    if (selectedProjectId === projectId) setSelectedProjectId("");
  }

  async function createProject(proj: Omit<Project, "id" | "categories" | "members">) {
    const creator = users.items[0];
    if (!creator) return;
    const created = await projects.add({
      ...proj,
      categories: ["General"],
      members: [{ userId: creator.id, role: "Admin" }],
    });
    if (!created) return;
    await sprints.add({ projectId: created.id, name: "Sprint 1" });
    setSelectedProjectId(created.id);
  }

  function inviteMember(user: User) {
    if (!project || project.members.some((m) => m.userId === user.id)) return;
    const members: ProjectMember[] = [...project.members, { userId: user.id, role: "Miembro" }];
    void projects.edit(project.id, { members });
  }

  /** No se puede dejar el proyecto sin miembros ni sin ningun Admin. */
  function removeMember(memberId: string) {
    if (!project) return;
    const target = project.members.find((m) => m.userId === memberId);
    if (!target || project.members.length <= 1) return;
    const adminCount = project.members.filter((m) => m.role === "Admin").length;
    if (target.role === "Admin" && adminCount <= 1) return;

    void projects.edit(project.id, {
      members: project.members.filter((m) => m.userId !== memberId),
    });
    void Promise.all(
      projectTasks
        .filter((t) => t.members.includes(memberId))
        .map((t) => activities.edit(t.id, { members: t.members.filter((id) => id !== memberId) }))
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

  return {
    projects: projects.items,
    users: users.items,
    loading,
    error,
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
  };
}
