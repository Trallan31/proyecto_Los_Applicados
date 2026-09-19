import { useLocalStorage } from "./useLocalStorage";
import type { Project } from "../types/projects";
import type { Activity } from "../types/activities";
import type { User, Member } from "../types/users";
import type { Sprint } from "../types/sprints";
import { ALL_SPRINTS as GLOBAL_SPRINTS, ALL_USERS, INITIAL_PROJECTS } from "../data/mockScrum";

export function useScrumBoard() {
  const [projects, setProjects] = useLocalStorage<Project[]>('scrum-projects', INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useLocalStorage<string | number>('scrum-active-project-id', INITIAL_PROJECTS[0]?.id);
  const [allSprints, setAllSprints] = useLocalStorage<Sprint[]>('scrum-all-sprints', GLOBAL_SPRINTS);

  const project = projects.find((p) => p.id === activeProjectId) || projects[0];

  function handleUpdateTask<K extends keyof Activity>(taskId: string | number, field: K, value: Activity[K]) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== activeProjectId
          ? p
          : {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)),
            }
      )
    );
  }

  function handleAddTask(task: Omit<Activity, "id" | "project">) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== activeProjectId
          ? p
          : { ...p, tasks: [...p.tasks, { ...task, id: crypto.randomUUID(), project: p.id }] as Activity[] }
      )
    );
  }

  function handleDeleteTask(taskId: string | number) {
    if (!window.confirm('¿Seguro que deseas eliminar esta tarea?')) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== activeProjectId
          ? p
          : { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
      )
    );
  }

  function handleAddCategory(name: string) {
    if (!name.trim()) return;
    const trimmed = name.trim();
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== activeProjectId
          ? p
          : {
              ...p,
              categories: p.categories.includes(trimmed) ? p.categories : [...p.categories, trimmed],
            }
      )
    );
  }

  function handleDeleteCategory(categoryName: string) {
    if (!window.confirm('¿Seguro que deseas eliminar esta categoría?')) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== activeProjectId
          ? p
          : {
              ...p,
              categories: p.categories.filter((c) => c !== categoryName),
              tasks: p.tasks.map((t) => (t.category === categoryName ? { ...t, category: "" } : t)),
            }
      )
    );
  }

  function handleAddSprint(name: string): Sprint {
    const trimmed = name.trim();
    const newSprint: Sprint = {
      id: Date.now(),
      projectId: activeProjectId as number,
      name: trimmed,
    };
    setAllSprints((prev) => [...prev, newSprint]);
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== activeProjectId
          ? p
          : {
              ...p,
              sprints: [...p.sprints, newSprint],
            }
      )
    );
    return newSprint;
  }

  function handleDeleteSprint(sprintId: number) {
    if (!window.confirm('¿Seguro que deseas eliminar este sprint y todas sus referencias?')) return;
    setAllSprints((prev) => prev.filter((s) => !(s.id === sprintId && s.projectId === activeProjectId)));
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== activeProjectId
          ? p
          : {
              ...p,
              sprints: p.sprints.filter((s) => s.id !== sprintId),
              tasks: p.tasks.map((t) => (t.sprintId === sprintId ? { ...t, sprintId: 0 } : t)),
            }
      )
    );
  }

  function handleDeleteProject(projectId: string | number) {
    const remaining = projects.filter((p) => p.id !== projectId);
    setProjects(remaining);
    if (remaining.length > 0) {
      setActiveProjectId(remaining[0].id);
    }
  }

  function createProject(proj: Omit<Project, "id" | "tasks" | "sprints" | "categories" | "members">) {
    const projectId = Date.now();
    const sprintId = Date.now() + 1;
    const newSprint: Sprint = { id: sprintId, projectId, name: "Sprint 1" };
    const newProj: Project = {
      ...proj,
      id: projectId,
      categories: ["General"],
      members: [{ ...ALL_USERS[0], role: "Admin" }],
      tasks: [],
      sprints: [newSprint],
    };
    setAllSprints((prev) => [...prev, newSprint]);
    setProjects((prev) => [...prev, newProj]);
    setActiveProjectId(newProj.id);
  }

  function inviteMember(member: User) {
    if (project?.members.some((m) => m.id === member.id)) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== activeProjectId ? p : { ...p, members: [...p.members, { ...member, role: "Miembro" } as Member] }
      )
    );
  }

  function removeMember(memberId: string | number) {
    if (project && project.members.length <= 1) {
      alert("No puedes eliminar al único integrante del proyecto.");
      return;
    }
    const target = project?.members.find((m) => m.id === memberId);
    const adminCount = project?.members.filter((m) => m.role === "Admin").length || 0;
    if (target?.role === "Admin" && adminCount <= 1) {
      alert("El proyecto debe conservar al menos un Administrador.");
      return;
    }
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== activeProjectId
          ? p
          : {
              ...p,
              members: p.members.filter((m) => m.id !== memberId),
              tasks: p.tasks.map((t) => ({
                ...t,
                members: t.members ? t.members.filter((id) => id !== memberId) : [],
              })),
            }
      )
    );
  }

  function updateMemberRole(memberId: string | number, role: "Admin" | "Miembro") {
    if (role === "Miembro") {
      const target = project?.members.find((m) => m.id === memberId);
      const adminCount = project?.members.filter((m) => m.role === "Admin").length || 0;
      if (target?.role === "Admin" && adminCount <= 1) {
        alert("El proyecto debe conservar al menos un Administrador.");
        return;
      }
    }
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== activeProjectId
          ? p
          : { ...p, members: p.members.map((m) => (m.id === memberId ? { ...m, role } : m)) }
      )
    );
  }

  return {
    projects,
    activeProjectId,
    allSprints,
    project,
    setActiveProjectId,
    handleUpdateTask,
    handleAddTask,
    handleDeleteTask,
    handleAddCategory,
    handleDeleteCategory,
    handleAddSprint,
    handleDeleteSprint,
    handleDeleteProject,
    createProject,
    inviteMember,
    removeMember,
    updateMemberRole,
  };
}
