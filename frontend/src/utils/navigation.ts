const ALLOWED_NEXT_ROUTES = new Set(["/organizador", "/scrum"]);
const DEFAULT_AUTHENTICATED_ROUTE = "/organizador";

function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }
  return false;
}

/**
 * Valida que el parámetro ?next= apunte únicamente a rutas internas permitidas
 * (/organizador o /scrum), conservando query params y hash y rechazando rutas
 * externas, esquemas o barras dobles/invertidas.
 */
export function sanitizeNextRoute(next: string | null): string {
  if (!next || typeof next !== "string") {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  const trimmed = next.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    hasControlChars(trimmed)
  ) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  try {
    const parsed = new URL(trimmed, "https://app.invalid");
    if (
      parsed.origin !== "https://app.invalid" ||
      !ALLOWED_NEXT_ROUTES.has(parsed.pathname)
    ) {
      return DEFAULT_AUTHENTICATED_ROUTE;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }
}

/**
 * Construye el enlace entre /login y /registro preservando ?next= sanitizado.
 */
export function buildAuthRouteWithNext(
  basePath: "/login" | "/registro",
  rawNext: string | null
): string {
  if (!rawNext) return basePath;
  const safeNext = sanitizeNextRoute(rawNext);
  return `${basePath}?next=${encodeURIComponent(safeNext)}`;
}
