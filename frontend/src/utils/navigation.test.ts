import { describe, expect, it } from "vitest";
import { buildAuthRouteWithNext, sanitizeNextRoute } from "./navigation";

describe("sanitizeNextRoute", () => {
  it("acepta /organizador y /scrum conservando query params y hash", () => {
    expect(sanitizeNextRoute("/organizador")).toBe("/organizador");
    expect(sanitizeNextRoute("/scrum")).toBe("/scrum");
    expect(sanitizeNextRoute("/organizador?tab=semana&course=c1#resumen")).toBe(
      "/organizador?tab=semana&course=c1#resumen"
    );
    expect(sanitizeNextRoute("  /scrum?project=p1#tablero  ")).toBe(
      "/scrum?project=p1#tablero"
    );
  });

  it("devuelve '/organizador' ante null, rutas vacías o rutas no permitidas", () => {
    expect(sanitizeNextRoute(null)).toBe("/organizador");
    expect(sanitizeNextRoute("")).toBe("/organizador");
    expect(sanitizeNextRoute("   ")).toBe("/organizador");
    expect(sanitizeNextRoute("/login")).toBe("/organizador");
    expect(sanitizeNextRoute("/otra")).toBe("/organizador");
    expect(sanitizeNextRoute("/organizador/extra")).toBe("/organizador");
  });

  it("rechaza rutas externas, barras dobles e invertidas", () => {
    expect(sanitizeNextRoute("//evil.com")).toBe("/organizador");
    expect(sanitizeNextRoute("/\\evil.com")).toBe("/organizador");
    expect(sanitizeNextRoute("https://evil.com")).toBe("/organizador");
    expect(sanitizeNextRoute("https://evil.com/organizador")).toBe("/organizador");
  });

  it("rechaza rutas con caracteres de control", () => {
    expect(sanitizeNextRoute("/organizador\n")).toBe("/organizador");
    expect(sanitizeNextRoute("/scrum\x00")).toBe("/organizador");
    expect(sanitizeNextRoute("/scrum\r?project=p1")).toBe("/organizador");
    expect(sanitizeNextRoute("/organizador\x7f")).toBe("/organizador");
  });
});

describe("buildAuthRouteWithNext", () => {
  it("devuelve la ruta base sin query cuando rawNext es null o vacío", () => {
    expect(buildAuthRouteWithNext("/login", null)).toBe("/login");
    expect(buildAuthRouteWithNext("/registro", null)).toBe("/registro");
    expect(buildAuthRouteWithNext("/login", "")).toBe("/login");
  });

  it("conserva y codifica rawNext válido en el parámetro ?next=", () => {
    expect(buildAuthRouteWithNext("/login", "/scrum?project=p1#tablero")).toBe(
      "/login?next=%2Fscrum%3Fproject%3Dp1%23tablero"
    );
    expect(buildAuthRouteWithNext("/registro", "/organizador?tab=mes")).toBe(
      "/registro?next=%2Forganizador%3Ftab%3Dmes"
    );
  });

  it("sanitiza rawNext inválido hacia /organizador al construir el enlace", () => {
    expect(buildAuthRouteWithNext("/login", "https://evil.com")).toBe(
      "/login?next=%2Forganizador"
    );
    expect(buildAuthRouteWithNext("/registro", "/otra")).toBe(
      "/registro?next=%2Forganizador"
    );
  });
});
