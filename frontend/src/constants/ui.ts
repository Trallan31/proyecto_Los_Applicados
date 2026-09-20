import type { TaskType, Priority, Status } from "../types";

/**
 * Constantes de presentacion. No son datos: los datos viven en la API.
 * Aca solo hay colores y etiquetas que decide el frontend.
 */

/** Paleta unica para elegir color de proyecto y de ramo. */
export const PALETTE = [
  "#4f7cff", "#9b6dff", "#2dd67b", "#f5c842", "#ff8c42",
  "#ff5c6a", "#00c9b1", "#e879f9", "#f97316", "#06b6d4",
];

export const CATEGORY_COLORS: Record<TaskType, string> = {
  Tarea: "#4f7cff",
  "Evaluación": "#ff5c6a",
  Proyecto: "#9b6dff",
  Lectura: "#2dd67b",
};

export const PRIORITY_META: Record<Priority, { color: string; bg: string }> = {
  "Critica": { color: "#ff5c6a", bg: "rgba(255,92,106,0.12)" },
  "Alta":    { color: "#ff8c42", bg: "rgba(255,140,66,0.12)" },
  "Media":   { color: "#f5c842", bg: "rgba(245,200,66,0.12)" },
  "Baja":    { color: "#2dd67b", bg: "rgba(45,214,123,0.12)" },
};

export const STATUS_META: Record<Status, { color: string; bg: string; dot: string }> = {
  "Pendiente":    { color: "#7c82a0", bg: "rgba(124,130,160,0.12)", dot: "#7c82a0" },
  "En curso":     { color: "#f5c842", bg: "rgba(245,200,66,0.12)", dot: "#f5c842" },
  "En revisión":  { color: "#9b6dff", bg: "rgba(155,109,255,0.12)", dot: "#9b6dff" },
  "Completada":   { color: "#2dd67b", bg: "rgba(45,214,123,0.12)", dot: "#2dd67b" },
  "Cancelada":    { color: "#ff5c6a", bg: "rgba(255,92,106,0.12)", dot: "#ff5c6a" },
};

/** Unica fuente de cada enum para desplegables y filtros. */
export const TASK_TYPES = Object.keys(CATEGORY_COLORS) as TaskType[];
export const PRIORITIES = Object.keys(PRIORITY_META) as Priority[];
export const STATUSES = Object.keys(STATUS_META) as Status[];

/**
 * Usuario de la sesion. La app todavia no tiene login: cuando exista,
 * este valor sale del usuario autenticado y esta constante desaparece.
 */
export const CURRENT_USER_ID = "user-1";
