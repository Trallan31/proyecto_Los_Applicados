import { describe, expect, it } from "vitest";
import { normalizeHttpUrlInput, sanitizeHttpUrl } from "./urlUtils";

describe("sanitizeHttpUrl", () => {
  it("acepta URLs válidas con protocolo http: y https:", () => {
    expect(sanitizeHttpUrl("https://ejemplo.cl/curso?id=1#tema")).toBe(
      "https://ejemplo.cl/curso?id=1#tema"
    );
    expect(sanitizeHttpUrl("  http://intranet.local:8080/guia  ")).toBe(
      "http://intranet.local:8080/guia"
    );
  });

  it("rechaza esquemas peligrosos o no permitidos como javascript:, data: y ftp:", () => {
    expect(sanitizeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(sanitizeHttpUrl("ftp://archivos.ejemplo.cl/material.pdf")).toBeNull();
  });

  it("rechaza triple barra y credenciales embebidas", () => {
    expect(sanitizeHttpUrl("https:///ejemplo.cl")).toBeNull();
    expect(sanitizeHttpUrl("http:///ejemplo.cl")).toBeNull();
    expect(sanitizeHttpUrl("https://user:pass@ejemplo.cl")).toBeNull();
    expect(sanitizeHttpUrl("http://usuario@ejemplo.cl")).toBeNull();
  });

  it("devuelve null ante strings vacíos, sin esquema o valores no-string", () => {
    expect(sanitizeHttpUrl("")).toBeNull();
    expect(sanitizeHttpUrl("   ")).toBeNull();
    expect(sanitizeHttpUrl("ejemplo.cl")).toBeNull();
    expect(sanitizeHttpUrl(null as unknown as string)).toBeNull();
    expect(sanitizeHttpUrl(undefined as unknown as string)).toBeNull();
    expect(sanitizeHttpUrl(123 as unknown as string)).toBeNull();
  });
});

describe("normalizeHttpUrlInput", () => {
  it("agrega https:// cuando el usuario omite el esquema", () => {
    expect(normalizeHttpUrlInput("campus.uc.cl/cursos")).toEqual({
      ok: true,
      url: "https://campus.uc.cl/cursos",
    });
    expect(normalizeHttpUrlInput("  ejemplo.cl  ")).toEqual({
      ok: true,
      url: "https://ejemplo.cl/",
    });
  });

  it("mantiene http:// o https:// cuando ya vienen incluidos", () => {
    expect(normalizeHttpUrlInput("http://localhost:5173/organizador")).toEqual({
      ok: true,
      url: "http://localhost:5173/organizador",
    });
    expect(normalizeHttpUrlInput("https://docs.ejemplo.cl")).toEqual({
      ok: true,
      url: "https://docs.ejemplo.cl/",
    });
  });

  it("rechaza rutas protocol-relative con // y URLs con triple barra", () => {
    expect(normalizeHttpUrlInput("//evil.com")).toEqual({
      ok: false,
      error: "Ingresa una URL válida con protocolo http:// o https://.",
    });
    expect(normalizeHttpUrlInput("https:///evil.com")).toEqual({
      ok: false,
      error: "La URL debe incluir un dominio válido.",
    });
    expect(normalizeHttpUrlInput("http:///evil.com")).toEqual({
      ok: false,
      error: "La URL debe incluir un dominio válido.",
    });
  });

  it("rechaza protocolos no permitidos", () => {
    expect(normalizeHttpUrlInput("javascript:alert(1)")).toEqual({
      ok: false,
      error: "Solo se permiten enlaces con protocolo http:// o https://.",
    });
    expect(normalizeHttpUrlInput("ftp://ejemplo.cl/archivo")).toEqual({
      ok: false,
      error: "Solo se permiten enlaces con protocolo http:// o https://.",
    });
    expect(normalizeHttpUrlInput("data:text/plain,hola")).toEqual({
      ok: false,
      error: "Solo se permiten enlaces con protocolo http:// o https://.",
    });
  });

  it("rechaza falta de dominio o entradas vacías", () => {
    expect(normalizeHttpUrlInput("")).toEqual({
      ok: false,
      error: "Ingresa una URL válida.",
    });
    expect(normalizeHttpUrlInput("   ")).toEqual({
      ok: false,
      error: "Ingresa una URL válida.",
    });
    expect(normalizeHttpUrlInput("https://")).toEqual({
      ok: false,
      error: "Ingresa una URL válida (por ejemplo, https://ejemplo.cl).",
    });
    expect(normalizeHttpUrlInput(null as unknown as string)).toEqual({
      ok: false,
      error: "Ingresa una URL válida.",
    });
  });

  it("rechaza credenciales embebidas en la URL", () => {
    expect(normalizeHttpUrlInput("https://user:pass@ejemplo.cl")).toEqual({
      ok: false,
      error: "La URL no puede contener usuario ni credenciales.",
    });
    expect(normalizeHttpUrlInput("http://usuario@ejemplo.cl")).toEqual({
      ok: false,
      error: "La URL no puede contener usuario ni credenciales.",
    });
  });
});
