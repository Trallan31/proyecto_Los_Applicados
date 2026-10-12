import type { CourseSession, OrganizerTask, Course } from "../types";

export type TimeFilter = "todas" | "semana" | "mes";
export type ViewTab = "lista" | "semana" | "mes";

export function parseLocalDate(dateStr: string): Date {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("-")) {
    return new Date(NaN);
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date(NaN);
  return new Date(y, m - 1, d);
}

export function formatLocalDate(date: Date): string {
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Fecha de hoy a medianoche local. Se evalua en cada llamada, no al cargar el modulo. */
export function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * true si la fecha (YYYY-MM-DD) ya quedo atras. Una tarea vence al pasar
 * la medianoche local del dia de entrega: el propio dia aun cuenta como
 * vigente. Usa hora local, no UTC.
 */
export function isOverdue(dateStr: string | undefined, isDone: boolean): boolean {
  if (!dateStr || isDone) return false;
  const due = parseLocalDate(dateStr);
  if (isNaN(due.getTime())) return false;
  return due < getToday();
}

export interface CountdownData {
  days: number;
  label: string;
  shortLabel: string;
  urgency: "overdue" | "today" | "near" | "normal" | "done";
  isOverdue: boolean;
  isToday: boolean;
  isDone: boolean;
}

/**
 * Calcula los días restantes para una fecha límite y entrega información
 * formateada de cuenta regresiva.
 */
export function getCountdown(dateStr: string | undefined, isDone: boolean = false): CountdownData | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const due = parseLocalDate(dateStr);
  if (isNaN(due.getTime())) return null;

  const today = getToday();
  const diffTime = due.getTime() - today.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (isDone) {
    return {
      days,
      label: "Completada",
      shortLabel: "Lista",
      urgency: "done",
      isOverdue: false,
      isToday: false,
      isDone: true,
    };
  }

  if (days < 0) {
    const overdueDays = Math.abs(days);
    return {
      days,
      label: overdueDays === 1 ? "Vencida hace 1 día" : `Vencida hace ${overdueDays} días`,
      shortLabel: `-${overdueDays}d`,
      urgency: "overdue",
      isOverdue: true,
      isToday: false,
      isDone: false,
    };
  }

  if (days === 0) {
    return {
      days: 0,
      label: "¡Vence hoy!",
      shortLabel: "Hoy",
      urgency: "today",
      isOverdue: false,
      isToday: true,
      isDone: false,
    };
  }

  if (days === 1) {
    return {
      days: 1,
      label: "1 día restante",
      shortLabel: "1d rest.",
      urgency: "near",
      isOverdue: false,
      isToday: false,
      isDone: false,
    };
  }

  return {
    days,
    label: `${days} días restantes`,
    shortLabel: `${days}d rest.`,
    urgency: days <= 3 ? "near" : "normal",
    isOverdue: false,
    isToday: false,
    isDone: false,
  };
}

export const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const FULL_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);

export function getWeekBounds(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);
  const sun = new Date(d.getFullYear(), d.getMonth(), diff + 6, 23, 59, 59, 999);
  return { start: mon, end: sun };
}

export function getMonthBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export interface DayScheduleItem {
  id: string;
  kind: "session" | "task";
  session?: CourseSession;
  task?: OrganizerTask;
  course?: Course;
  color: string;
  startHour: number;
  duration: number;
  endHour: number;
  hasTime: boolean;
  col: number;
  totalCols: number;
}

