import { useEffect, useMemo } from "react";
import type { OrganizerTask } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import { useOrganizerStore } from "../store/useOrganizerStore";
import { assignedActivitiesAsTasks } from "../utils/scrumSync";
import {
  parseLocalDate,
  formatLocalDate,
  getToday,
  getWeekBounds,
  getMonthBounds,
} from "../utils/dateUtils";

/**
 * Capa delgada sobre el store global (useOrganizerStore).
 * Los datos, filtros y acciones viven en Zustand; aquí solo se calculan
 * los derivados (filtrado, orden y estadísticas) con useMemo.
 * Mantiene la misma API pública de antes: OrganizerView y sus componentes
 * hijos quedan conectados al store global sin cambios.
 */
export function useOrganizerBoard() {
  const courses = useOrganizerStore((s) => s.courses);
  const sessions = useOrganizerStore((s) => s.sessions);
  const ownTasks = useOrganizerStore((s) => s.tasks);
  const activities = useOrganizerStore((s) => s.activities);
  const projects = useOrganizerStore((s) => s.projects);

  const loading = useOrganizerStore((s) => s.loading);
  const error = useOrganizerStore((s) => s.loadError);
  const mutationError = useOrganizerStore((s) => s.mutationError);
  const clearMutationError = useOrganizerStore((s) => s.clearMutationError);
  const refetch = useOrganizerStore((s) => s.refetch);

  const activeCourse = useOrganizerStore((s) => s.activeCourse);
  const setActiveCourse = useOrganizerStore((s) => s.setActiveCourse);
  const timeFilter = useOrganizerStore((s) => s.timeFilter);
  const setTimeFilter = useOrganizerStore((s) => s.setTimeFilter);
  const typeFilter = useOrganizerStore((s) => s.typeFilter);
  const setTypeFilter = useOrganizerStore((s) => s.setTypeFilter);
  const statusFilter = useOrganizerStore((s) => s.statusFilter);
  const setStatusFilter = useOrganizerStore((s) => s.setStatusFilter);
  const tab = useOrganizerStore((s) => s.tab);
  const setTab = useOrganizerStore((s) => s.setTab);

  const toggleTaskStatus = useOrganizerStore((s) => s.toggleTaskStatus);
  const setTaskStatus = useOrganizerStore((s) => s.setTaskStatus);
  const deleteTask = useOrganizerStore((s) => s.deleteTask);
  const addTask = useOrganizerStore((s) => s.addTask);
  const updateTask = useOrganizerStore((s) => s.updateTask);
  const addCourse = useOrganizerStore((s) => s.addCourse);
  const deleteCourse = useOrganizerStore((s) => s.deleteCourse);
  const addSession = useOrganizerStore((s) => s.addSession);
  const deleteSession = useOrganizerStore((s) => s.deleteSession);
  const addCourseLink = useOrganizerStore((s) => s.addCourseLink);
  const deleteCourseLink = useOrganizerStore((s) => s.deleteCourseLink);
  const updateCourseLink = useOrganizerStore((s) => s.updateCourseLink);

  const userId = useAuthStore((s) => s.user?.id ?? "");

  // Carga una sola vez por sesión: al volver desde /scrum los datos ya
  // están en el store y no se vuelven a pedir.
  useEffect(() => {
    if (userId) {
      void useOrganizerStore.getState().ensureLoaded();
    }
  }, [userId]);

  /**
   * Las actividades de Scrum asignadas al usuario se muestran junto a sus
   * tareas propias. Son derivadas: viven solo en memoria y la fuente de
   * verdad sigue siendo /activities.
   */
  const allTasks = useMemo(
    () => [...ownTasks, ...assignedActivitiesAsTasks(activities, userId)],
    [ownTasks, activities, userId]
  );

  // Clave del día actual: mantiene estables weekBounds/monthBounds dentro
  // del mismo día y los recalcula cuando el día cambia.
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
          if (Number.isNaN(due.getTime())) return false;
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
        const timeA = parseLocalDate(a.endDate).getTime();
        const timeB = parseLocalDate(b.endDate).getTime();
        const validA = !Number.isNaN(timeA);
        const validB = !Number.isNaN(timeB);
        if (!validA && !validB) {
          return a.title.localeCompare(b.title, "es");
        }
        if (!validA) return 1;
        if (!validB) return -1;
        if (timeA !== timeB) return timeA - timeB;
        return a.title.localeCompare(b.title, "es");
      }),
    [filteredTasks]
  );

  const userProjects = useMemo(() => {
    if (!userId) return projects;
    return projects.filter(
      (p) => !p.members || p.members.length === 0 || p.members.some((m) => m.userId === userId)
    );
  }, [projects, userId]);

  const allCourseStats = useMemo(
    () =>
      courses.map((c) => ({
        ...c,
        total: allTasks.filter((t) => t.courseId === c.id).length,
        done: allTasks.filter((t) => t.courseId === c.id && t.status === "Completada").length,
        pending: allTasks.filter((t) => t.courseId === c.id && t.status !== "Completada").length,
      })),
    [courses, allTasks]
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
  const activeCourseObj = courses.find((c) => c.id === activeCourse);
  const activeProjectId = activeCourse.startsWith("project:")
    ? activeCourse.slice("project:".length)
    : null;
  const activeProjectObj = activeProjectId
    ? projects.find((p) => p.id === activeProjectId)
    : undefined;

  return {
    courses,
    sessions,
    tasks: allTasks,
    projects,
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