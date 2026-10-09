import { useState, useMemo } from "react";
import { useCollection } from "./useCollection";
import type { OrganizerTask, TaskType, Course, CourseSession } from "../types";
import { CURRENT_USER_ID } from "../constants/ui";
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

  const [activeCourse, setActiveCourse] = useState<string | "all">("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("todas");
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OrganizerTask["status"] | "all">("all");
  const [tab, setTab] = useState<ViewTab>("lista");

  const loading = courses.loading || sessions.loading || tasks.loading;
  const error = courses.error ?? sessions.error ?? tasks.error;

  // Clave del dia actual: mantiene estables weekBounds/monthBounds dentro
  // del mismo dia (filteredTasks depende de su identidad) y los recalcula
  // cuando el dia cambia.
  const todayKey = formatLocalDate(getToday());
  const weekBounds = useMemo(() => getWeekBounds(parseLocalDate(todayKey)), [todayKey]);
  const monthBounds = useMemo(() => getMonthBounds(parseLocalDate(todayKey)), [todayKey]);

  const filteredTasks = useMemo(
    () =>
      tasks.items.filter((t) => {
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
    [tasks.items, activeCourse, typeFilter, statusFilter, timeFilter, weekBounds, monthBounds]
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
    const task = tasks.items.find((t) => t.id === id);
    if (!task) return undefined;
    const next: OrganizerTask["status"] =
      task.status === "Completada" ? "Pendiente" : "Completada";
    void tasks.edit(id, { status: next });
    return next;
  }

  function setTaskStatus(id: string, status: OrganizerTask["status"]) {
    void tasks.edit(id, { status });
  }

  function deleteTask(id: string) {
    void tasks.destroy(id);
  }

  function addTask(t: Omit<OrganizerTask, "id" | "userId">) {
    void tasks.add({ ...t, userId: CURRENT_USER_ID });
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
        .map((t) => tasks.edit(t.id, { courseId: undefined, scope: "Personal" }))
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
    activeCourse === "all" ? tasks.items : tasks.items.filter((t) => t.courseId === activeCourse);
  const doneCount = scopedTasks.filter((t) => t.status === "Completada").length;
  const totalCount = scopedTasks.length;
  const activeCourseObj = courses.items.find((c) => c.id === activeCourse);

  return {
    courses: courses.items,
    sessions: sessions.items,
    tasks: tasks.items,
    loading,
    error,
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
    addCourse,
    deleteCourse,
    addSession,
    deleteSession,
    allCourseStats,
    scopedTasks,
    doneCount,
    totalCount,
    activeCourseObj,
  };
}
