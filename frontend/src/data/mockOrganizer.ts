import type { OrganizerTask } from "../types/organizer";
import type { Course, CourseSession } from "../types/courses";

export const INITIAL_COURSES: Course[] = [
  { id: "course-1", userId: "user-1", name: "Cálculo III", code: "MAT1630", shortName: "CAL", color: "#9b6dff" },
  { id: "course-2", userId: "user-1", name: "Redes de Computadores", code: "IIC2333", shortName: "RED", color: "#2dd67b" },
  { id: "course-3", userId: "user-1", name: "Bases de Datos", code: "IIC2413", shortName: "BD", color: "#f5c842" },
  { id: "course-4", userId: "user-1", name: "Ingeniería de Software", code: "IIC2143", shortName: "ISW", color: "#ff8c42" },
  { id: "course-5", userId: "user-1", name: "Arquitectura de Computadores", code: "IIC2343", shortName: "ARQ", color: "#ff5c6a" },
];

export const INITIAL_TASKS: OrganizerTask[] = [
  { id: "task-1", userId: "user-1", title: "Estudiar para prueba de Cálculo III", type: "Evaluación", scope: "Ramo", status: "En curso", endDate: "2026-09-10", dueTime: "10:00", courseId: "course-1", priority: "Alta", notes: "Revisar integrales dobles y triples, series de Taylor" },
  { id: "task-2", userId: "user-1", title: "Leer capítulo 4 de Tanenbaum", type: "Lectura", scope: "Ramo", status: "Pendiente", endDate: "2026-09-08", courseId: "course-2", priority: "Media" },
  { id: "task-3", userId: "user-1", title: "Entregar tarea 2 de BD", type: "Tarea", scope: "Ramo", status: "En curso", endDate: "2026-09-09", dueTime: "14:00", courseId: "course-3", priority: "Alta" },
  { id: "task-4", userId: "user-1", title: "Reunión grupo Ing. Software", type: "Proyecto", scope: "Proyecto Universitario", status: "Completada", endDate: "2026-09-07", dueTime: "16:00", courseId: "course-4", priority: "Media" },
  { id: "task-5", userId: "user-1", title: "Revisar apuntes de Arquitectura", type: "Lectura", scope: "Ramo", status: "Pendiente", endDate: "2026-09-12", courseId: "course-5", priority: "Baja" },
  { id: "task-6", userId: "user-1", title: "Guía práctica 3 de Cálculo", type: "Tarea", scope: "Ramo", status: "Pendiente", endDate: "2026-09-15", dueTime: "11:00", courseId: "course-1", priority: "Media" },
  { id: "task-7", userId: "user-1", title: "Presentación avance proyecto BD", type: "Proyecto", scope: "Proyecto Universitario", status: "Pendiente", endDate: "2026-09-14", dueTime: "09:00", courseId: "course-3", priority: "Alta" },
  { id: "task-8", userId: "user-1", title: "Lab 4 de Redes", type: "Tarea", scope: "Ramo", status: "Pendiente", endDate: "2026-09-11", dueTime: "15:00", courseId: "course-2", priority: "Alta" },
  { id: "task-9", userId: "user-1", title: "Prueba de Redes", type: "Evaluación", scope: "Ramo", status: "Pendiente", endDate: "2026-09-18", dueTime: "12:00", courseId: "course-2", priority: "Alta" },
  { id: "task-10", userId: "user-1", title: "Boceto láminas AutoCAD", type: "Tarea", scope: "Ramo", status: "Pendiente", endDate: "2026-09-22", courseId: "course-5", priority: "Media" },
  { id: "task-11", userId: "user-1", title: "Prueba Ing. Software", type: "Evaluación", scope: "Ramo", status: "Pendiente", endDate: "2026-09-25", dueTime: "08:00", courseId: "course-4", priority: "Alta" },
  { id: "task-12", userId: "user-1", title: "Control de lectura BD", type: "Evaluación", scope: "Ramo", status: "Pendiente", endDate: "2026-09-30", courseId: "course-3", priority: "Media" },
];

export const COURSE_SESSIONS: CourseSession[] = [
  { id: "session-1", dayOfWeek: 0, startHour: 8, duration: 2, courseId: "course-1", type: "Cátedra" },
  { id: "session-2", dayOfWeek: 0, startHour: 11, duration: 2, courseId: "course-2", type: "Cátedra" },
  { id: "session-3", dayOfWeek: 1, startHour: 9, duration: 2, courseId: "course-3", type: "Cátedra" },
  { id: "session-4", dayOfWeek: 1, startHour: 14, duration: 2, courseId: "course-4", type: "Cátedra" },
  { id: "session-5", dayOfWeek: 2, startHour: 10, duration: 1, courseId: "course-1", type: "Auxiliar" },
  { id: "session-6", dayOfWeek: 2, startHour: 13, duration: 3, courseId: "course-2", type: "Laboratorio" },
  { id: "session-7", dayOfWeek: 3, startHour: 8, duration: 2, courseId: "course-5", type: "Cátedra" },
  { id: "session-8", dayOfWeek: 3, startHour: 11, duration: 2, courseId: "course-3", type: "Cátedra" },
  { id: "session-9", dayOfWeek: 4, startHour: 9, duration: 2, courseId: "course-1", type: "Cátedra" },
  { id: "session-10", dayOfWeek: 4, startHour: 12, duration: 2, courseId: "course-4", type: "Cátedra" },
];

export const CATEGORY_COLORS: Record<string, string> = {
  Tarea: "#4f7cff",
  "Evaluación": "#ff5c6a",
  Proyecto: "#9b6dff",
  Lectura: "#2dd67b",
};

export const CATEGORY_LABELS: Record<string, string> = {
  Tarea: "Tarea",
  "Evaluación": "Evaluación",
  Proyecto: "Proyecto",
  Lectura: "Lectura",
};

export const STATUS_COLORS: Record<string, string> = {
  Pendiente: "#4a5070",
  "En curso": "#f5c842",
  Completada: "#2dd67b",
};

export const PRIORITY_COLORS: Record<string, string> = { Alta: "#ff5c6a", Media: "#f5c842", Baja: "#2dd67b" };