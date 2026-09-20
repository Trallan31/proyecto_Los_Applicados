import { useState, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { OrganizerTask, TaskType, Course, CourseSession } from "../types";
import { INITIAL_COURSES, INITIAL_TASKS, COURSE_SESSIONS } from "../data/mockOrganizer";
import { parseLocalDate, formatLocalDate, getToday, getWeekBounds, getMonthBounds, type TimeFilter, type ViewTab } from "../utils/dateUtils";

export function useOrganizerBoard() {
  const [courses, setCourses] = useLocalStorage<Course[]>('organizer-courses', INITIAL_COURSES);
  const [sessions, setSessions] = useLocalStorage<CourseSession[]>('organizer-sessions', COURSE_SESSIONS);
  const [tasks, setTasks] = useLocalStorage<OrganizerTask[]>('organizer-tasks', INITIAL_TASKS);
  
  const [activeCourse, setActiveCourse] = useState<string | "all">("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("todas");
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OrganizerTask["status"] | "all">("all");
  const [tab, setTab] = useState<ViewTab>("lista");

  // Clave del dia actual: mantiene estables weekBounds/monthBounds dentro
  // del mismo dia (filteredTasks depende de su identidad) y los recalcula
  // cuando el dia cambia.
  const todayKey = formatLocalDate(getToday());
  const weekBounds = useMemo(() => getWeekBounds(parseLocalDate(todayKey)), [todayKey]);
  const monthBounds = useMemo(() => getMonthBounds(parseLocalDate(todayKey)), [todayKey]);

  const filteredTasks = useMemo(() => tasks.filter((t) => {
    if (activeCourse !== "all" && t.courseId !== activeCourse) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (timeFilter !== "todas") {
      const due = parseLocalDate(t.endDate);
      const bounds = timeFilter === "semana" ? weekBounds : monthBounds;
      if (due < bounds.start || due > bounds.end) return false;
    }
    return true;
  }), [tasks, activeCourse, typeFilter, statusFilter, timeFilter, weekBounds, monthBounds]);

  const sortedTasks = useMemo(() => [...filteredTasks].sort((a, b) => {
    if (a.status === "Completada" && b.status !== "Completada") return 1;
    if (b.status === "Completada" && a.status !== "Completada") return -1;
    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
  }), [filteredTasks]);

  function toggleTaskStatus(id: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next: OrganizerTask["status"] =
          t.status === "Pendiente" ? "En curso" : t.status === "En curso" ? "Completada" : "Pendiente";
        return { ...t, status: next };
      })
    );
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleSaveCourses(newCourses: Course[], newSessions: CourseSession[]) {
    setCourses(newCourses);
    setSessions(newSessions);
    const validIds = new Set(newCourses.map((c) => c.id));
    setTasks((prev) =>
      prev.map((t) =>
        t.courseId !== undefined && !validIds.has(t.courseId)
          ? { ...t, courseId: undefined, scope: "Personal" }
          : t
      )
    );
    if (activeCourse !== "all" && !validIds.has(activeCourse)) {
      setActiveCourse("all");
    }
  }

  function handleAddTask(t: Omit<OrganizerTask, "id" | "userId">) {
    setTasks((prev) => [...prev, { ...t, id: crypto.randomUUID(), userId: "user-1" } as OrganizerTask]);
  }

  const allCourseStats = useMemo(() => courses.map((c) => ({
    ...c,
    total: tasks.filter((t) => t.courseId === c.id).length,
    done: tasks.filter((t) => t.courseId === c.id && t.status === "Completada").length,
    pending: tasks.filter((t) => t.courseId === c.id && t.status !== "Completada").length,
  })), [courses, tasks]);

  const scopedTasks = activeCourse === "all" ? tasks : tasks.filter((t) => t.courseId === activeCourse);
  const doneCount = scopedTasks.filter((t) => t.status === "Completada").length;
  const totalCount = scopedTasks.length;

  const activeCourseObj = courses.find((c) => c.id === activeCourse);

  return {
    courses,
    sessions,
    tasks,
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
    deleteTask,
    handleSaveCourses,
    handleAddTask,
    allCourseStats,
    scopedTasks,
    doneCount,
    totalCount,
    activeCourseObj,
  };
}
