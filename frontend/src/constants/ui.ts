import type { TaskType, Priority, Status } from "../types";

/**
 * Constantes de presentación. No son datos: los datos viven en la API.
 * Acá solo hay colores, variantes accesibles y etiquetas que decide el frontend.
 */

/** Paleta única para elegir color de proyecto y de ramo. */
export const PALETTE = [
  "#4f7cff", "#9b6dff", "#2dd67b", "#f5c842", "#ff8c42",
  "#ff5c6a", "#00c9b1", "#e879f9", "#f97316", "#06b6d4",
];

/**
 * Mapeo de tonos vibrantes (usados en modo oscuro y almacenados en BD) a
 * equivalentes oscurecidos que garantizan contraste >= 4.5:1 sobre fondos claros
 * (#ffffff, #f1f5f9 y badges con tinte al 12%-15%).
 */
const LIGHT_ACCESSIBLE_COLOR_MAP: Record<string, string> = {
  "#4f7cff": "#1d4ed8",
  "#3b82f6": "#1d4ed8",
  "#9b6dff": "#6d28d9",
  "#8b5cf6": "#6d28d9",
  "#2dd67b": "#065f46",
  "#10b981": "#065f46",
  "#f5c842": "#854d0e",
  "#f59e0b": "#854d0e",
  "#ff8c42": "#9a3412",
  "#f97316": "#9a3412",
  "#ff5c6a": "#b91c1c",
  "#ef4444": "#b91c1c",
  "#00c9b1": "#115e59",
  "#e879f9": "#86198f",
  "#06b6d4": "#155e75",
  "#94a3b8": "#475569",
};

// Luminancia relativa de #f1f5f9 (fondo de panel en modo claro).
const LIGHT_PANEL_LUMINANCE = 0.9033;

function channelToLinear(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

function normalizeHexColor(hex: string): string | null {
  const cleaned = hex.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^#[0-9a-f]{3}$/.test(cleaned)) {
    return `#${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}${cleaned[3]}${cleaned[3]}`;
  }
  return null;
}

/**
 * Devuelve un color hexadecimal con contraste WCAG 2.1 AA en el tema activo.
 * En modo oscuro mantiene intactos los colores vibrantes; en modo claro oscurece
 * los tonos pastel para garantizar >= 4.5:1 sobre fondos claros y badges con tinte.
 */
export function getAccessibleColor(hex: string, isDark: boolean): string {
  if (isDark || !hex) return hex;

  const normalized = normalizeHexColor(hex);
  if (!normalized) return hex;

  const mapped = LIGHT_ACCESSIBLE_COLOR_MAP[normalized];
  if (mapped) return mapped;

  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);

  // Objetivo >= 6.0 contra #f1f5f9 para asegurar >= 4.5:1 incluso sobre tintes al 15%.
  const currentContrast = (LIGHT_PANEL_LUMINANCE + 0.05) / (relativeLuminance(r, g, b) + 0.05);
  if (currentContrast >= 6.0) {
    return normalized;
  }

  let low = 0;
  let high = 1;
  for (let i = 0; i < 16; i++) {
    const mid = (low + high) / 2;
    const lum = relativeLuminance(Math.round(r * mid), Math.round(g * mid), Math.round(b * mid));
    const ratio = (LIGHT_PANEL_LUMINANCE + 0.05) / (lum + 0.05);
    if (ratio >= 6.0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const toHex = (value: number) => Math.round(value * low).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const CATEGORY_COLORS: Record<TaskType, string> = {
  Tarea: "#4f7cff",
  "Evaluación": "#ff5c6a",
  Proyecto: "#9b6dff",
  Lectura: "#2dd67b",
};

/** Devuelve el color accesible de una categoría según el tema activo. */
export function getCategoryColor(type: TaskType, isDark: boolean): string {
  return getAccessibleColor(CATEGORY_COLORS[type] ?? "#4f7cff", isDark);
}

export interface PriorityMetaEntry {
  color: string;
  bg: string;
  lightColor: string;
  darkColor: string;
  lightBg: string;
  darkBg: string;
}

export const PRIORITY_META: Record<Priority, PriorityMetaEntry> = {
  "Critica": {
    color: "#ff5c6a",
    bg: "rgba(255,92,106,0.12)",
    darkColor: "#ff5c6a",
    darkBg: "rgba(255,92,106,0.12)",
    lightColor: "#b91c1c",
    lightBg: "rgba(185,28,28,0.12)",
  },
  "Alta": {
    color: "#ff8c42",
    bg: "rgba(255,140,66,0.12)",
    darkColor: "#ff8c42",
    darkBg: "rgba(255,140,66,0.12)",
    lightColor: "#9a3412",
    lightBg: "rgba(154,52,18,0.12)",
  },
  "Media": {
    color: "#f5c842",
    bg: "rgba(245,200,66,0.12)",
    darkColor: "#f5c842",
    darkBg: "rgba(245,200,66,0.12)",
    lightColor: "#854d0e",
    lightBg: "rgba(133,77,14,0.12)",
  },
  "Baja": {
    color: "#2dd67b",
    bg: "rgba(45,214,123,0.12)",
    darkColor: "#2dd67b",
    darkBg: "rgba(45,214,123,0.12)",
    lightColor: "#065f46",
    lightBg: "rgba(6,95,70,0.12)",
  },
};

/** Devuelve color y fondo accesibles para la prioridad indicada según el tema. */
export function getPriorityMeta(priority: Priority, isDark: boolean): { color: string; bg: string } {
  const entry = PRIORITY_META[priority] || PRIORITY_META["Media"];
  return isDark
    ? { color: entry.darkColor, bg: entry.darkBg }
    : { color: entry.lightColor, bg: entry.lightBg };
}

export interface StatusMetaEntry {
  color: string;
  bg: string;
  dot: string;
  lightColor: string;
  darkColor: string;
  lightBg: string;
  darkBg: string;
  lightDot: string;
  darkDot: string;
}

export const STATUS_META: Record<Status, StatusMetaEntry> = {
  "Pendiente": {
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.18)",
    dot: "#94a3b8",
    darkColor: "#94a3b8",
    darkBg: "rgba(148,163,184,0.18)",
    darkDot: "#94a3b8",
    lightColor: "#475569",
    lightBg: "rgba(71,85,105,0.14)",
    lightDot: "#475569",
  },
  "En curso": {
    color: "#f5c842",
    bg: "rgba(245,200,66,0.12)",
    dot: "#f5c842",
    darkColor: "#f5c842",
    darkBg: "rgba(245,200,66,0.12)",
    darkDot: "#f5c842",
    lightColor: "#854d0e",
    lightBg: "rgba(133,77,14,0.12)",
    lightDot: "#854d0e",
  },
  "En revisión": {
    color: "#9b6dff",
    bg: "rgba(155,109,255,0.12)",
    dot: "#9b6dff",
    darkColor: "#9b6dff",
    darkBg: "rgba(155,109,255,0.12)",
    darkDot: "#9b6dff",
    lightColor: "#6d28d9",
    lightBg: "rgba(109,40,217,0.12)",
    lightDot: "#6d28d9",
  },
  "Completada": {
    color: "#2dd67b",
    bg: "rgba(45,214,123,0.12)",
    dot: "#2dd67b",
    darkColor: "#2dd67b",
    darkBg: "rgba(45,214,123,0.12)",
    darkDot: "#2dd67b",
    lightColor: "#065f46",
    lightBg: "rgba(6,95,70,0.12)",
    lightDot: "#065f46",
  },
  "Cancelada": {
    color: "#ff5c6a",
    bg: "rgba(255,92,106,0.12)",
    dot: "#ff5c6a",
    darkColor: "#ff5c6a",
    darkBg: "rgba(255,92,106,0.12)",
    darkDot: "#ff5c6a",
    lightColor: "#b91c1c",
    lightBg: "rgba(185,28,28,0.12)",
    lightDot: "#b91c1c",
  },
};

/** Devuelve color, fondo y color de punto accesibles para el estado indicado según el tema. */
export function getStatusMeta(status: Status, isDark: boolean): { color: string; bg: string; dot: string } {
  const entry = STATUS_META[status] || STATUS_META["Pendiente"];
  return isDark
    ? { color: entry.darkColor, bg: entry.darkBg, dot: entry.darkDot }
    : { color: entry.lightColor, bg: entry.lightBg, dot: entry.lightDot };
}

/** Única fuente de cada enum para desplegables y filtros. */
export const TASK_TYPES = Object.keys(CATEGORY_COLORS) as TaskType[];
export const PRIORITIES = Object.keys(PRIORITY_META) as Priority[];
export const STATUSES = Object.keys(STATUS_META) as Status[];
