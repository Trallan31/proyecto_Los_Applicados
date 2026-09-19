import type { OrganizerTask } from "../types/organizer";
import type { Course, CourseSession } from "../types/courses";

export const INITIAL_COURSES: Course[] = [
  { id: 1, userId: 1, name: "Cálculo III", code: "MAT1630", shortName: "CAL", color: "#9b6dff" },
  { id: 2, userId: 1, name: "Redes de Computadores", code: "IIC2333", shortName: "RED", color: "#2dd67b" },
  { id: 3, userId: 1, name: "Bases de Datos", code: "IIC2413", shortName: "BD", color: "#f5c842" },
  { id: 4, userId: 1, name: "Ingeniería de Software", code: "IIC2143", shortName: "ISW", color: "#ff8c42" },
  { id: 5, userId: 1, name: "Arquitectura de Computadores", code: "IIC2343", shortName: "ARQ", color: "#ff5c6a" },
];

export const INITIAL_TASKS: OrganizerTask[] = [
  { id: 1, userId: 1, title: "Estudiar para prueba de Cálculo III", type: "Evaluación", scope: "Ramo", status: "En curso", endDate: "2026-09-10", dueTime: "10:00", courseId: 1, priority: "Alta", notes: "Revisar integrales dobles y triples, series de Taylor" },
  { id: 2, userId: 1, title: "Leer capítulo 4 de Tanenbaum", type: "Lectura", scope: "Ramo", status: "Pendiente", endDate: "2026-09-08", courseId: 2, priority: "Media" },
  { id: 3, userId: 1, title: "Entregar tarea 2 de BD", type: "Tarea", scope: "Ramo", status: "En curso", endDate: "2026-09-09", dueTime: "14:00", courseId: 3, priority: "Alta" },
  { id: 4, userId: 1, title: "Reunión grupo Ing. Software", type: "Proyecto", scope: "Proyecto Universitario", status: "Completada", endDate: "2026-09-07", dueTime: "16:00", courseId: 4, priority: "Media" },
  { id: 5, userId: 1, title: "Revisar apuntes de Arquitectura", type: "Lectura", scope: "Ramo", status: "Pendiente", endDate: "2026-09-12", courseId: 5, priority: "Baja" },
  { id: 6, userId: 1, title: "Guía práctica 3 de Cálculo", type: "Tarea", scope: "Ramo", status: "Pendiente", endDate: "2026-09-15", dueTime: "11:00", courseId: 1, priority: "Media" },
  { id: 7, userId: 1, title: "Presentación avance proyecto BD", type: "Proyecto", scope: "Proyecto Universitario", status: "Pendiente", endDate: "2026-09-14", dueTime: "09:00", courseId: 3, priority: "Alta" },
  { id: 8, userId: 1, title: "Lab 4 de Redes", type: "Tarea", scope: "Ramo", status: "Pendiente", endDate: "2026-09-11", dueTime: "15:00", courseId: 2, priority: "Alta" },
  { id: 9, userId: 1, title: "Prueba de Redes", type: "Evaluación", scope: "Ramo", status: "Pendiente", endDate: "2026-09-18", dueTime: "12:00", courseId: 2, priority: "Alta" },
  { id: 10, userId: 1, title: "Boceto láminas AutoCAD", type: "Tarea", scope: "Ramo", status: "Pendiente", endDate: "2026-09-22", courseId: 5, priority: "Media" },
  { id: 11, userId: 1, title: "Prueba Ing. Software", type: "Evaluación", scope: "Ramo", status: "Pendiente", endDate: "2026-09-25", dueTime: "08:00", courseId: 4, priority: "Alta" },
  { id: 12, userId: 1, title: "Control de lectura BD", type: "Evaluación", scope: "Ramo", status: "Pendiente", endDate: "2026-09-30", courseId: 3, priority: "Media" },
];

export const COURSE_SESSIONS: CourseSession[] = [
  { id: 1, dayOfWeek: 0, startHour: 8, duration: 2, courseId: 1, type: "Cátedra" },
  { id: 2, dayOfWeek: 0, startHour: 11, duration: 2, courseId: 2, type: "Cátedra" },
  { id: 3, dayOfWeek: 1, startHour: 9, duration: 2, courseId: 3, type: "Cátedra" },
  { id: 4, dayOfWeek: 1, startHour: 14, duration: 2, courseId: 4, type: "Cátedra" },
  { id: 5, dayOfWeek: 2, startHour: 10, duration: 1, courseId: 1, type: "Auxiliar" },
  { id: 6, dayOfWeek: 2, startHour: 13, duration: 3, courseId: 2, type: "Laboratorio" },
  { id: 7, dayOfWeek: 3, startHour: 8, duration: 2, courseId: 5, type: "Cátedra" },
  { id: 8, dayOfWeek: 3, startHour: 11, duration: 2, courseId: 3, type: "Cátedra" },
  { id: 9, dayOfWeek: 4, startHour: 9, duration: 2, courseId: 1, type: "Cátedra" },
  { id: 10, dayOfWeek: 4, startHour: 12, duration: 2, courseId: 4, type: "Cátedra" },
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