import { useLocalStorage } from "./useLocalStorage";
import type { Project, Activity, User, Member, Sprint } from "../types";
import { ALL_SPRINTS as GLOBAL_SPRINTS, ALL_USERS, INITIAL_PROJECTS } from "../data/mockScrum";

export function useScrumBoard() {
  const [projects, setProjects] = useLocalStorage<Project[]>('scrum-projects', INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useLocalStorage<string>('scrum-active-project-id', INITIAL_PROJECTS[0]?.id ?? "");
  const [allSprints, setAllSprints] = useLocalStorage<Sprint[]>('scrum-all-sprints', GLOBAL_SPRINTS);

  const project = projects.find((p) => p.id === activeProjectId) || projects[0];

  function handleUpdateTask<K extends keyof Activity>(taskId: string, field: K, value: Activity[K]) {
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

  function handleDeleteTask(taskId: string) {
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
      id: crypto.randomUUID(),
      projectId: activeProjectId,
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

  function handleDeleteSprint(sprintId: string) {
    setAllSprints((prev) => prev.filter((s) => !(s.id === sprintId && s.projectId === activeProjectId)));
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== activeProjectId
          ? p
          : {
              ...p,
              sprints: p.sprints.filter((s) => s.id !== sprintId),
              tasks: p.tasks.map((t) => (t.sprintId === sprintId ? { ...t, sprintId: "" } : t)),
            }
      )
    );
  }

  function handleDeleteProject(projectId: string) {
    const remaining = projects.filter((p) => p.id !== projectId);
    setProjects(remaining);
    if (remaining.length > 0) {
      setActiveProjectId(remaining[0].id);
    }
  }

  function createProject(proj: Omit<Project, "id" | "tasks" | "sprints" | "categories" | "members">) {
    const projectId = crypto.randomUUID();
    const sprintId = crypto.randomUUID();
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

  function removeMember(memberId: string) {
    if (project && project.members.length <= 1) {
      return;
    }
    const target = project?.members.find((m) => m.id === memberId);
    const adminCount = project?.members.filter((m) => m.role === "Admin").length || 0;
    if (target?.role === "Admin" && adminCount <= 1) {
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

  function updateMemberRole(memberId: string, role: "Admin" | "Miembro") {
    if (role === "Miembro") {
      const target = project?.members.find((m) => m.id === memberId);
      const adminCount = project?.members.filter((m) => m.role === "Admin").length || 0;
      if (target?.role === "Admin" && adminCount <= 1) {
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
