import { useState, useMemo } from "react";
import { useCollection } from "./useCollection";
import type {
  Activity,
  OrganizerTask,
  TaskType,
  Course,
  CourseSession,
  CourseLink,
  Project,
} from "../types";
import { useAuth } from "../context/AuthContext";
import { activityIdOf, assignedActivitiesAsTasks } from "../utils/scrumSync";
import {
  parseLocalDate,
  formatLocalDate,
  getToday,
  getWeekBounds,
  getMonthBounds,
  type TimeFilter,
  type ViewTab,
} from "../utils/dateUtils";

export function useOrganizerBoard() {
  const courses = useCollection<Course>("courses");
  const sessions = useCollection<CourseSession>("sessions");
  const tasks = useCollection<OrganizerTask>("tasks");
  const activities = useCollection<Activity>("activities");
  const projects = useCollection<Project>("projects");

  const { user } = useAuth();
  const userId = user?.id ?? "";

  /**
   * Las actividades de Scrum asignadas al usuario se muestran junto a sus
   * tareas propias. Son derivadas: viven solo en memoria y la fuente de
   * verdad sigue siendo /activities.
   */
  const allTasks = useMemo(
    () => [...tasks.items, ...assignedActivitiesAsTasks(activities.items, userId)],
    [tasks.items, activities.items, userId]
  );

  const [activeCourse, setActiveCourse] = useState<string | "all">("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("todas");
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OrganizerTask["status"] | "all">("all");
  const [tab, setTab] = useState<ViewTab>("lista");

  const loading =
    courses.loading || sessions.loading || tasks.loading || activities.loading || projects.loading;
  
  const error =
    courses.error ?? sessions.error ?? tasks.error ?? activities.error ?? projects.error;
  
  const mutationError =
    courses.mutationError ??
    sessions.mutationError ??
    tasks.mutationError ??
    activities.mutationError ?? 
    projects.mutationError;

  const refetch = async () => {
    await Promise.all([
      courses.refetch(),
      sessions.refetch(),
      tasks.refetch(),
      activities.refetch(),
      projects.refetch(),
    ]);
  };

  const clearMutationError = () => {
    courses.clearMutationError();
    sessions.clearMutationError();
    tasks.clearMutationError();
    activities.clearMutationError();
    projects.clearMutationError();
  };

  // Clave del dia actual: mantiene estables weekBounds/monthBounds dentro
  // del mismo dia (filteredTasks depende de su identidad) y los recalcula
  // cuando el dia cambia.
  const todayKey = formatLocalDate(getToday());
  const weekBounds = useMemo(() => getWeekBounds(parseLocalDate(todayKey)), [todayKey]);
  const monthBounds = useMemo(() => getMonthBounds(parseLocalDate(todayKey)), [todayKey]);

  function matchesActiveCourse(t: OrganizerTask, filter: string): boolean {
    if (filter === "all") return true;
    if (filter === "all-courses") {
      return t.courseId !== null || t.scope === "Ramo";
    }
    if (filter === "all-projects") {
      return Boolean(t.projectId) || t.scope === "Proyecto Universitario";
    }
    if (filter.startsWith("project:")) {
      const pId = filter.slice("project:".length);
      return t.projectId === pId;
    }
    return t.courseId === filter;
  }

  const filteredTasks = useMemo(
    () =>
      allTasks.filter((t) => {
        if (!matchesActiveCourse(t, activeCourse)) return false;
        if (typeFilter !== "all" && t.type !== typeFilter) return false;
        if (statusFilter !== "all" && t.status !== statusFilter) return false;
        if (timeFilter !== "todas") {
          const due = parseLocalDate(t.endDate);
          const bounds = timeFilter === "semana" ? weekBounds : monthBounds;
          if (due < bounds.start || due > bounds.end) return false;
        }
        return true;
      }),
    [allTasks, activeCourse, typeFilter, statusFilter, timeFilter, weekBounds, monthBounds]
  );

  const sortedTasks = useMemo(
    () =>
      [...filteredTasks].sort((a, b) => {
        if (a.status === "Completada" && b.status !== "Completada") return 1;
        if (b.status === "Completada" && a.status !== "Completada") return -1;
        return parseLocalDate(a.endDate).getTime() - parseLocalDate(b.endDate).getTime();
      }),
    [filteredTasks]
  );

  function toggleTaskStatus(id: string): OrganizerTask["status"] | undefined {
    const task = allTasks.find((t) => t.id === id);
    if (!task) return undefined;
    const next: OrganizerTask["status"] =
      task.status === "Completada" ? "Pendiente" : "Completada";
    setTaskStatus(id, next);
    return next;
  }

  /**
   * En una tarea derivada el estado se escribe en la actividad, que es lo
   * que ve todo el equipo en el tablero.
   */
  function setTaskStatus(id: string, status: OrganizerTask["status"]) {
    const activityId = activityIdOf(id);
    if (activityId !== null) {
      void activities.edit(activityId, { status });
      return;
    }
    void tasks.edit(id, { status });
  }

  /** Las derivadas no se borran desde aca: se borran en el tablero. */
  function deleteTask(id: string) {
    if (activityIdOf(id) !== null) return;
    void tasks.destroy(id);
  }

  function addTask(task: Omit<OrganizerTask, "id" | "userId">) {
    if (!user) return;
    void tasks.add({
      ...task,
      userId: user.id,
    });
  }

  /** Las derivadas no se editan desde aca: se editan en el tablero. */
  function updateTask(id: string, changes: Partial<Omit<OrganizerTask, "id" | "userId">>) {
    if (activityIdOf(id) !== null) return;
    void tasks.edit(id, changes);
  }

  function addCourse(course: Omit<Course, "id" | "userId">) {
    if (!user) return;
    void courses.add({
      ...course,
      userId: user.id,
    });
  }

  /** Borra el ramo y, en cascada, sus sesiones. Las tareas quedan personales. */
  async function deleteCourse(courseId: string) {
    const deleted = await courses.destroy(courseId);
    if (!deleted) return;
    if (activeCourse === courseId) {
      setActiveCourse("all");
    }
    await Promise.all([
      courses.refetch(),
      sessions.refetch(),
      tasks.refetch(),
    ]);
  }

  function addSession(s: Omit<CourseSession, "id">) {
    void sessions.add(s);
  }

  function deleteSession(id: string) {
    void sessions.destroy(id);
  }

  function addCourseLink(courseId: string, link: Omit<CourseLink, "id">) {
    const course = courses.items.find((c) => c.id === courseId);
    if (!course) return;
    const newLink: CourseLink = {
      ...link,
      id: `clink-${Date.now()}`,
    };
    void courses.edit(course.id, {
      links: [...(course.links || []), newLink],
    });
  }

  function deleteCourseLink(courseId: string, linkId: string) {
    const course = courses.items.find((c) => c.id === courseId);
    if (!course) return;
    void courses.edit(course.id, {
      links: (course.links || []).filter((l) => l.id !== linkId),
    });
  }

  function updateCourseLink(
    courseId: string,
    linkId: string,
    changes: Partial<Omit<CourseLink, "id">>
  ) {
    const course = courses.items.find((c) => c.id === courseId);
    if (!course) return;
    void courses.edit(course.id, {
      links: (course.links || []).map((l) => (l.id === linkId ? { ...l, ...changes } : l)),
    });
  }

  const userProjects = useMemo(() => {
    if (!userId) return projects.items;
    return projects.items.filter(
      (p) => !p.members || p.members.length === 0 || p.members.some((m) => m.userId === userId)
    );
  }, [projects.items, userId]);

  const allCourseStats = useMemo(
    () =>
      courses.items.map((c) => ({
        ...c,
        total: allTasks.filter((t) => t.courseId === c.id).length,
        done: allTasks.filter((t) => t.courseId === c.id && t.status === "Completada").length,
        pending: allTasks.filter((t) => t.courseId === c.id && t.status !== "Completada").length,
      })),
    [courses.items, allTasks]
  );

  const allProjectStats = useMemo(
    () =>
      userProjects.map((p) => ({
        ...p,
        total: allTasks.filter((t) => t.projectId === p.id).length,
        done: allTasks.filter((t) => t.projectId === p.id && t.status === "Completada").length,
        pending: allTasks.filter((t) => t.projectId === p.id && t.status !== "Completada").length,
      })),
    [userProjects, allTasks]
  );

  const coursesPendingCount = useMemo(
    () =>
      allTasks.filter(
        (t) => (t.courseId !== null || t.scope === "Ramo") && t.status !== "Completada"
      ).length,
    [allTasks]
  );

  const projectsPendingCount = useMemo(
    () =>
      allTasks.filter(
        (t) =>
          (Boolean(t.projectId) || t.scope === "Proyecto Universitario") &&
          t.status !== "Completada"
      ).length,
    [allTasks]
  );

  const allPendingCount = useMemo(
    () => allTasks.filter((t) => t.status !== "Completada").length,
    [allTasks]
  );

  const scopedTasks = useMemo(
    () => allTasks.filter((t) => matchesActiveCourse(t, activeCourse)),
    [allTasks, activeCourse]
  );
  const doneCount = scopedTasks.filter((t) => t.status === "Completada").length;
  const totalCount = scopedTasks.length;
  const activeCourseObj = courses.items.find((c) => c.id === activeCourse);
  const activeProjectId = activeCourse.startsWith("project:")
    ? activeCourse.slice("project:".length)
    : null;
  const activeProjectObj = activeProjectId
    ? projects.items.find((p) => p.id === activeProjectId)
    : undefined;

  return {
    courses: courses.items,
    sessions: sessions.items,
    tasks: allTasks,
    projects: projects.items,
    userProjects,
    loading,
    error,
    mutationError,
    clearMutationError,
    refetch,
    activeCourse,
    setActiveCourse,
    timeFilter,
    setTimeFilter,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    tab,
    setTab,
    filteredTasks,
    sortedTasks,
    toggleTaskStatus,
    setTaskStatus,
    deleteTask,
    addTask,
    updateTask,
    addCourse,
    deleteCourse,
    addSession,
    deleteSession,
    addCourseLink,
    deleteCourseLink,
    updateCourseLink,
    allCourseStats,
    allProjectStats,
    coursesPendingCount,
    projectsPendingCount,
    allPendingCount,
    scopedTasks,
    doneCount,
    totalCount,
    activeCourseObj,
    activeProjectObj,
  };
}
