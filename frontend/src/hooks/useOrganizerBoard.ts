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
import { CURRENT_USER_ID } from "../constants/ui";
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
  const userId = user?.id ?? CURRENT_USER_ID;

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
    courses.loading || sessions.loading || tasks.loading || activities.loading;
  const error =
    courses.error ?? sessions.error ?? tasks.error ?? activities.error;
  const mutationError =
    courses.mutationError ??
    sessions.mutationError ??
    tasks.mutationError ??
    activities.mutationError;

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
  };

  // Clave del dia actual: mantiene estables weekBounds/monthBounds dentro
  // del mismo dia (filteredTasks depende de su identidad) y los recalcula
  // cuando el dia cambia.
  const todayKey = formatLocalDate(getToday());
  const weekBounds = useMemo(() => getWeekBounds(parseLocalDate(todayKey)), [todayKey]);
  const monthBounds = useMemo(() => getMonthBounds(parseLocalDate(todayKey)), [todayKey]);

  const filteredTasks = useMemo(
    () =>
      allTasks.filter((t) => {
        if (activeCourse !== "all" && t.courseId !== activeCourse) return false;
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

  function addTask(t: Omit<OrganizerTask, "id" | "userId">) {
    void tasks.add({ ...t, userId: CURRENT_USER_ID });
  }

  /** Las derivadas no se editan desde aca: se editan en el tablero. */
  function updateTask(id: string, changes: Partial<Omit<OrganizerTask, "id" | "userId">>) {
    if (activityIdOf(id) !== null) return;
    void tasks.edit(id, changes);
  }

  function addCourse(c: Omit<Course, "id" | "userId">) {
    void courses.add({ ...c, userId: CURRENT_USER_ID });
  }

  /** Borra el ramo y, en cascada, sus sesiones. Las tareas quedan personales. */
  async function deleteCourse(courseId: string) {
    await Promise.all(
      sessions.items.filter((s) => s.courseId === courseId).map((s) => sessions.destroy(s.id))
    );
    await Promise.all(
      tasks.items
        .filter((t) => t.courseId === courseId)
        .map((t) => tasks.edit(t.id, { courseId: null, scope: "Personal" }))
    );
    await courses.destroy(courseId);
    if (activeCourse === courseId) setActiveCourse("all");
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

  const allCourseStats = useMemo(
    () =>
      courses.items.map((c) => ({
        ...c,
        total: tasks.items.filter((t) => t.courseId === c.id).length,
        done: tasks.items.filter((t) => t.courseId === c.id && t.status === "Completada").length,
        pending: tasks.items.filter((t) => t.courseId === c.id && t.status !== "Completada").length,
      })),
    [courses.items, tasks.items]
  );

  const scopedTasks =
    activeCourse === "all" ? allTasks : allTasks.filter((t) => t.courseId === activeCourse);
  const doneCount = scopedTasks.filter((t) => t.status === "Completada").length;
  const totalCount = scopedTasks.length;
  const activeCourseObj = courses.items.find((c) => c.id === activeCourse);

  return {
    courses: courses.items,
    sessions: sessions.items,
    tasks: allTasks,
    projects: projects.items,
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
    scopedTasks,
    doneCount,
    totalCount,
    activeCourseObj,
  };
}
