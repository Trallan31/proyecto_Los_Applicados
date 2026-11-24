import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { OrganizerTask, TaskType } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import { useOrganizerStore } from "../store/useOrganizerStore";
import { assignedActivitiesAsTasks } from "../utils/scrumSync";
import {
  parseLocalDate,
  formatLocalDate,
  getToday,
  getWeekBounds,
  getMonthBounds,
  type TimeFilter,
  type ViewTab,
} from "../utils/dateUtils";
import {
  buildOrganizerSearchParams,
  DEFAULT_ORGANIZER_FILTERS,
  hasNonDefaultOrganizerFilters,
  hasOrganizerSearchParams,
  parseOrganizerSearchParams,
  type OrganizerFilters,
} from "../utils/organizerSearchParams";

function readFiltersFromStore(): OrganizerFilters {
  const state = useOrganizerStore.getState();
  return {
    tab: state.tab,
    course: state.activeCourse,
    time: state.timeFilter,
    type: state.typeFilter,
    status: state.statusFilter,
  };
}

/**
 * Capa delgada sobre el store global (useOrganizerStore).
 * Los datos, filtros y acciones viven en Zustand; aquí se sincronizan los
 * filtros con los query params de `/organizador` y se calculan los derivados.
 */
export function useOrganizerBoard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const lastSyncedSearchRef = useRef<string | null>(null);

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
  const storeSetActiveCourse = useOrganizerStore((s) => s.setActiveCourse);
  const timeFilter = useOrganizerStore((s) => s.timeFilter);
  const storeSetTimeFilter = useOrganizerStore((s) => s.setTimeFilter);
  const typeFilter = useOrganizerStore((s) => s.typeFilter);
  const storeSetTypeFilter = useOrganizerStore((s) => s.setTypeFilter);
  const statusFilter = useOrganizerStore((s) => s.statusFilter);
  const storeSetStatusFilter = useOrganizerStore((s) => s.setStatusFilter);
  const tab = useOrganizerStore((s) => s.tab);
  const storeSetTab = useOrganizerStore((s) => s.setTab);

  const toggleTaskStatus = useOrganizerStore((s) => s.toggleTaskStatus);
  const setTaskStatus = useOrganizerStore((s) => s.setTaskStatus);
  const deleteTask = useOrganizerStore((s) => s.deleteTask);
  const addTask = useOrganizerStore((s) => s.addTask);
  const updateTask = useOrganizerStore((s) => s.updateTask);
  const addCourse = useOrganizerStore((s) => s.addCourse);
  const storeDeleteCourse = useOrganizerStore((s) => s.deleteCourse);
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

  // Sincronización bidireccional entre query params de la URL y useOrganizerStore.
  useEffect(() => {
    const searchKey = searchParams.toString();
    const isInitialMount = lastSyncedSearchRef.current === null;

    if (!isInitialMount && lastSyncedSearchRef.current === searchKey) {
      return;
    }

    lastSyncedSearchRef.current = searchKey;

    const syncFiltersToStore = (filters: OrganizerFilters) => {
      const state = useOrganizerStore.getState();
      if (state.tab !== filters.tab) state.setTab(filters.tab);
      if (state.activeCourse !== filters.course) state.setActiveCourse(filters.course);
      if (state.timeFilter !== filters.time) state.setTimeFilter(filters.time);
      if (state.typeFilter !== filters.type) state.setTypeFilter(filters.type);
      if (state.statusFilter !== filters.status) state.setStatusFilter(filters.status);
    };

    if (hasOrganizerSearchParams(searchParams)) {
      syncFiltersToStore(parseOrganizerSearchParams(searchParams));
      return;
    }

    if (isInitialMount) {
      const storeFilters = readFiltersFromStore();
      if (hasNonDefaultOrganizerFilters(storeFilters)) {
        setSearchParams(buildOrganizerSearchParams(storeFilters, searchParams), {
          replace: true,
        });
      }
      return;
    }

    syncFiltersToStore(DEFAULT_ORGANIZER_FILTERS);
  }, [searchParams, setSearchParams]);

  const syncStoreFiltersToUrl = useCallback(
    (replace = false) => {
      const storeFilters = readFiltersFromStore();
      setSearchParams(
        (prev) => buildOrganizerSearchParams(storeFilters, prev),
        { replace }
      );
    },
    [setSearchParams]
  );

  const setActiveCourse = useCallback(
    (value: string | "all") => {
      storeSetActiveCourse(value);
      syncStoreFiltersToUrl();
    },
    [storeSetActiveCourse, syncStoreFiltersToUrl]
  );

  const setTimeFilter = useCallback(
    (value: TimeFilter) => {
      storeSetTimeFilter(value);
      syncStoreFiltersToUrl();
    },
    [storeSetTimeFilter, syncStoreFiltersToUrl]
  );

  const setTypeFilter = useCallback(
    (value: TaskType | "all") => {
      storeSetTypeFilter(value);
      syncStoreFiltersToUrl();
    },
    [storeSetTypeFilter, syncStoreFiltersToUrl]
  );

  const setStatusFilter = useCallback(
    (value: OrganizerTask["status"] | "all") => {
      storeSetStatusFilter(value);
      syncStoreFiltersToUrl();
    },
    [storeSetStatusFilter, syncStoreFiltersToUrl]
  );

  const setTab = useCallback(
    (value: ViewTab) => {
      storeSetTab(value);
      syncStoreFiltersToUrl();
    },
    [storeSetTab, syncStoreFiltersToUrl]
  );

  const deleteCourse = useCallback(
    async (courseId: string): Promise<boolean> => {
      const wasActive = activeCourse === courseId;
      const hadUrlCourse = searchParams.get("course") === courseId;
      const deleted = await storeDeleteCourse(courseId);
      if (deleted && (wasActive || hadUrlCourse)) {
        if (useOrganizerStore.getState().activeCourse === courseId) {
          storeSetActiveCourse("all");
        }
        syncStoreFiltersToUrl(true);
      }
      return deleted;
    },
    [activeCourse, searchParams, storeDeleteCourse, storeSetActiveCourse, syncStoreFiltersToUrl]
  );

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