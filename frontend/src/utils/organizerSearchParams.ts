import { TASK_TYPES } from "../constants/ui";
import type { OrganizerTask, TaskType } from "../types";
import type { TimeFilter, ViewTab } from "./dateUtils";

export interface OrganizerFilters {
  tab: ViewTab;
  course: string | "all";
  time: TimeFilter;
  type: TaskType | "all";
  status: OrganizerTask["status"] | "all";
}

export const DEFAULT_ORGANIZER_FILTERS: OrganizerFilters = {
  tab: "lista",
  course: "all",
  time: "todas",
  type: "all",
  status: "all",
};

export const ORGANIZER_PARAM_KEYS: ReadonlyArray<keyof OrganizerFilters> = [
  "tab",
  "course",
  "time",
  "type",
  "status",
];

const VALID_TABS = new Set<ViewTab>(["lista", "semana", "mes"]);
const VALID_TIME_FILTERS = new Set<TimeFilter>(["todas", "semana", "mes"]);
const VALID_TYPES = new Set<TaskType | "all">(["all", ...TASK_TYPES]);
const VALID_STATUSES = new Set<OrganizerTask["status"] | "all">([
  "all",
  "Pendiente",
  "En curso",
  "Completada",
]);

function readEnumParam<T extends string>(
  raw: string | null,
  validValues: ReadonlySet<T>,
  fallback: T
): T {
  if (raw !== null && validValues.has(raw as T)) {
    return raw as T;
  }
  return fallback;
}

/** Indica si la URL contiene al menos uno de los query params del organizador. */
export function hasOrganizerSearchParams(searchParams: URLSearchParams): boolean {
  return ORGANIZER_PARAM_KEYS.some((key) => searchParams.has(key));
}

/** Indica si algún filtro difiere de su valor por defecto. */
export function hasNonDefaultOrganizerFilters(filters: OrganizerFilters): boolean {
  return ORGANIZER_PARAM_KEYS.some(
    (key) => filters[key] !== DEFAULT_ORGANIZER_FILTERS[key]
  );
}

/** Lee y valida los filtros del organizador desde URLSearchParams. */
export function parseOrganizerSearchParams(
  searchParams: URLSearchParams
): OrganizerFilters {
  const rawCourse = searchParams.get("course")?.trim() ?? "";
  return {
    tab: readEnumParam(searchParams.get("tab"), VALID_TABS, DEFAULT_ORGANIZER_FILTERS.tab),
    course: rawCourse || DEFAULT_ORGANIZER_FILTERS.course,
    time: readEnumParam(
      searchParams.get("time"),
      VALID_TIME_FILTERS,
      DEFAULT_ORGANIZER_FILTERS.time
    ),
    type: readEnumParam(searchParams.get("type"), VALID_TYPES, DEFAULT_ORGANIZER_FILTERS.type),
    status: readEnumParam(
      searchParams.get("status"),
      VALID_STATUSES,
      DEFAULT_ORGANIZER_FILTERS.status
    ),
  };
}

/**
 * Serializa los filtros del organizador en URLSearchParams, omitiendo los valores
 * por defecto para mantener limpia la ruta `/organizador`.
 */
export function buildOrganizerSearchParams(
  filters: OrganizerFilters,
  baseParams?: URLSearchParams
): URLSearchParams {
  const next = baseParams ? new URLSearchParams(baseParams) : new URLSearchParams();
  for (const key of ORGANIZER_PARAM_KEYS) {
    const rawValue = key === "course" ? filters.course.trim() || "all" : filters[key];
    if (rawValue !== DEFAULT_ORGANIZER_FILTERS[key]) {
      next.set(key, rawValue);
    } else {
      next.delete(key);
    }
  }
  return next;
}
