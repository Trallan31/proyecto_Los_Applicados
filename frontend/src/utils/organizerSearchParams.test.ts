import { describe, expect, it } from "vitest";
import {
  buildOrganizerSearchParams,
  DEFAULT_ORGANIZER_FILTERS,
  hasNonDefaultOrganizerFilters,
  hasOrganizerSearchParams,
  parseOrganizerSearchParams,
} from "./organizerSearchParams";

describe("organizerSearchParams", () => {
  it("devuelve los valores por defecto cuando no hay parámetros", () => {
    const parsed = parseOrganizerSearchParams(new URLSearchParams());
    expect(parsed).toEqual(DEFAULT_ORGANIZER_FILTERS);
  });

  it("lee y conserva filtros válidos de la URL", () => {
    const params = new URLSearchParams(
      "tab=semana&course=project%3Ap1&time=mes&type=Evaluación&status=En+curso"
    );
    expect(parseOrganizerSearchParams(params)).toEqual({
      tab: "semana",
      course: "project:p1",
      time: "mes",
      type: "Evaluación",
      status: "En curso",
    });
  });

  it("descarta valores inválidos o vacíos y usa defaults seguros", () => {
    const params = new URLSearchParams(
      "tab=invalido&course=%20%20&time=hoy&type=otro&status=Cancelada"
    );
    expect(parseOrganizerSearchParams(params)).toEqual(DEFAULT_ORGANIZER_FILTERS);
  });

  it("serializa omitiendo los valores por defecto", () => {
    const clean = buildOrganizerSearchParams(DEFAULT_ORGANIZER_FILTERS);
    expect(clean.toString()).toBe("");

    const partial = buildOrganizerSearchParams({
      ...DEFAULT_ORGANIZER_FILTERS,
      tab: "mes",
      course: "c1",
    });
    expect(partial.toString()).toBe("tab=mes&course=c1");
  });

  it("preserva parámetros externos y elimina los del organizador que vuelven a default", () => {
    const base = new URLSearchParams("utm=campus&tab=semana&course=c1");
    const next = buildOrganizerSearchParams(
      { ...DEFAULT_ORGANIZER_FILTERS, tab: "semana" },
      base
    );
    expect(next.get("utm")).toBe("campus");
    expect(next.get("tab")).toBe("semana");
    expect(next.has("course")).toBe(false);
  });

  it("detecta presencia de parámetros y filtros no por defecto", () => {
    expect(hasOrganizerSearchParams(new URLSearchParams("utm=1"))).toBe(false);
    expect(hasOrganizerSearchParams(new URLSearchParams("status=Pendiente"))).toBe(true);

    expect(hasNonDefaultOrganizerFilters(DEFAULT_ORGANIZER_FILTERS)).toBe(false);
    expect(
      hasNonDefaultOrganizerFilters({ ...DEFAULT_ORGANIZER_FILTERS, time: "semana" })
    ).toBe(true);
  });
});
