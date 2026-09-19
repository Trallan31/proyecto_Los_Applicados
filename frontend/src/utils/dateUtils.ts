import type { CourseSession } from "../types/courses";
import type { OrganizerTask } from "../types/organizer";
import type { Course } from "../types/courses";

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

export const PRESET_COLORS = ["#4f7cff", "#9b6dff", "#2dd67b", "#f5c842", "#ff8c42", "#ff5c6a", "#00c9b1", "#e879f9", "#f97316", "#06b6d4"];
