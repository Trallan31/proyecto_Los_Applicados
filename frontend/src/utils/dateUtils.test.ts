import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDisplayDate,
  formatLocalDate,
  getCountdown,
  getMonthBounds,
  getToday,
  getWeekBounds,
  isOverdue,
  parseLocalDate,
} from "./dateUtils";

describe("parseLocalDate", () => {
  it("parsea correctamente una fecha YYYY-MM-DD válida a medianoche local", () => {
    const fecha = parseLocalDate("2026-05-15");

    expect(Number.isNaN(fecha.getTime())).toBe(false);
    expect(fecha.getFullYear()).toBe(2026);
    expect(fecha.getMonth()).toBe(4);
    expect(fecha.getDate()).toBe(15);
    expect(fecha.getHours()).toBe(0);
    expect(fecha.getMinutes()).toBe(0);
    expect(fecha.getSeconds()).toBe(0);
  });

  it("acepta el 29 de febrero en año bisiesto (2024-02-29)", () => {
    const bisiesto = parseLocalDate("2024-02-29");

    expect(Number.isNaN(bisiesto.getTime())).toBe(false);
    expect(bisiesto.getFullYear()).toBe(2024);
    expect(bisiesto.getMonth()).toBe(1);
    expect(bisiesto.getDate()).toBe(29);
  });

  it("rechaza fechas inexistentes como 2026-02-31 o 2025-02-29", () => {
    expect(Number.isNaN(parseLocalDate("2026-02-31").getTime())).toBe(true);
    expect(Number.isNaN(parseLocalDate("2025-02-29").getTime())).toBe(true);
    expect(Number.isNaN(parseLocalDate("2026-13-01").getTime())).toBe(true);
  });

  it("rechaza timestamps ISO con 'T' y entradas inválidas", () => {
    expect(Number.isNaN(parseLocalDate("2026-05-15T12:00:00Z").getTime())).toBe(true);
    expect(Number.isNaN(parseLocalDate("2026-05-15T00:00:00").getTime())).toBe(true);
    expect(Number.isNaN(parseLocalDate("").getTime())).toBe(true);
    expect(Number.isNaN(parseLocalDate(null as unknown as string).getTime())).toBe(true);
  });
});

describe("formatLocalDate y formatDisplayDate", () => {
  it("formatea fechas locales con ceros a la izquierda y devuelve '' para Date inválida", () => {
    expect(formatLocalDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatLocalDate(new Date(2024, 1, 29))).toBe("2024-02-29");
    expect(formatLocalDate(new Date(NaN))).toBe("");
  });

  it("formatea una fecha válida para pantalla y usa fallback ante fecha inválida", () => {
    const esperado = new Date(2026, 3, 5).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
    });

    expect(formatDisplayDate("2026-04-05")).toBe(esperado);
    expect(formatDisplayDate("2026-02-31")).toBe("Sin fecha");
    expect(formatDisplayDate("", "Pendiente")).toBe("Pendiente");
  });
});

describe("getToday, isOverdue y getCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 15, 14, 30, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("getToday devuelve la fecha actual a medianoche local", () => {
    const hoy = getToday();

    expect(formatLocalDate(hoy)).toBe("2026-05-15");
    expect(hoy.getHours()).toBe(0);
    expect(hoy.getMinutes()).toBe(0);
    expect(hoy.getSeconds()).toBe(0);
    expect(hoy.getMilliseconds()).toBe(0);
  });

  it("isOverdue evalúa ayer, hoy, mañana y respeta isDone=true", () => {
    expect(isOverdue("2026-05-14", false)).toBe(true);
    expect(isOverdue("2026-05-15", false)).toBe(false);
    expect(isOverdue("2026-05-16", false)).toBe(false);
    expect(isOverdue("2026-05-14", true)).toBe(false);
    expect(isOverdue(undefined, false)).toBe(false);
    expect(isOverdue("2026-02-31", false)).toBe(false);
  });

  it("getCountdown distingue vencida 1 día singular y N días plural", () => {
    expect(getCountdown("2026-05-14")).toEqual({
      days: -1,
      label: "Vencida hace 1 día",
      shortLabel: "-1d",
      urgency: "overdue",
      isOverdue: true,
      isToday: false,
      isDone: false,
    });

    expect(getCountdown("2026-05-11")).toEqual({
      days: -4,
      label: "Vencida hace 4 días",
      shortLabel: "-4d",
      urgency: "overdue",
      isOverdue: true,
      isToday: false,
      isDone: false,
    });
  });

  it("getCountdown maneja hoy, 1d, 3d near, 4d normal, isDone=true y fecha inválida", () => {
    expect(getCountdown("2026-05-15")).toEqual({
      days: 0,
      label: "¡Vence hoy!",
      shortLabel: "Hoy",
      urgency: "today",
      isOverdue: false,
      isToday: true,
      isDone: false,
    });

    expect(getCountdown("2026-05-16")).toEqual({
      days: 1,
      label: "1 día restante",
      shortLabel: "1d rest.",
      urgency: "near",
      isOverdue: false,
      isToday: false,
      isDone: false,
    });

    expect(getCountdown("2026-05-18")).toEqual({
      days: 3,
      label: "3 días restantes",
      shortLabel: "3d rest.",
      urgency: "near",
      isOverdue: false,
      isToday: false,
      isDone: false,
    });

    expect(getCountdown("2026-05-19")).toEqual({
      days: 4,
      label: "4 días restantes",
      shortLabel: "4d rest.",
      urgency: "normal",
      isOverdue: false,
      isToday: false,
      isDone: false,
    });

    expect(getCountdown("2026-05-14", true)).toEqual({
      days: -1,
      label: "Completada",
      shortLabel: "Lista",
      urgency: "done",
      isOverdue: false,
      isToday: false,
      isDone: true,
    });

    expect(getCountdown(undefined)).toBeNull();
    expect(getCountdown("")).toBeNull();
    expect(getCountdown("2026-02-31")).toBeNull();
  });
});

describe("getWeekBounds y getMonthBounds", () => {
  it("getWeekBounds calcula lunes 00:00 y domingo 23:59:59.999 tanto desde lunes como desde domingo", () => {
    const desdeLunes = getWeekBounds(new Date(2026, 4, 11));
    const desdeDomingo = getWeekBounds(new Date(2026, 4, 17));

    for (const bounds of [desdeLunes, desdeDomingo]) {
      expect(formatLocalDate(bounds.start)).toBe("2026-05-11");
      expect(bounds.start.getHours()).toBe(0);
      expect(bounds.start.getMinutes()).toBe(0);
      expect(bounds.start.getSeconds()).toBe(0);
      expect(bounds.start.getMilliseconds()).toBe(0);

      expect(formatLocalDate(bounds.end)).toBe("2026-05-17");
      expect(bounds.end.getHours()).toBe(23);
      expect(bounds.end.getMinutes()).toBe(59);
      expect(bounds.end.getSeconds()).toBe(59);
      expect(bounds.end.getMilliseconds()).toBe(999);
    }
  });

  it("getMonthBounds diferencia febrero bisiesto 2024 de febrero no bisiesto 2026", () => {
    const feb2024 = getMonthBounds(new Date(2024, 1, 15));
    expect(formatLocalDate(feb2024.start)).toBe("2024-02-01");
    expect(formatLocalDate(feb2024.end)).toBe("2024-02-29");
    expect(feb2024.end.getHours()).toBe(23);
    expect(feb2024.end.getMilliseconds()).toBe(999);

    const feb2026 = getMonthBounds(new Date(2026, 1, 15));
    expect(formatLocalDate(feb2026.start)).toBe("2026-02-01");
    expect(formatLocalDate(feb2026.end)).toBe("2026-02-28");
  });
});
