export type UrlNormalizationResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const SCHEME_PREFIX_REGEX = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

type HttpUrlInspection = { url: URL } | { error: string };

function inspectHttpUrl(candidate: string): HttpUrlInspection {
  if (/^https?:\/\/\//i.test(candidate)) {
    return { error: "La URL debe incluir un dominio válido." };
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      error: "Ingresa una URL válida (por ejemplo, https://ejemplo.cl).",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      error: "Solo se permiten enlaces con protocolo http:// o https://.",
    };
  }

  if (!parsed.hostname) {
    return { error: "La URL debe incluir un dominio válido." };
  }

  if (parsed.username || parsed.password) {
    return {
      error: "La URL no puede contener usuario ni credenciales.",
    };
  }

  return { url: parsed };
}

function parseValidHttpUrl(candidate: string): URL | null {
  const result = inspectHttpUrl(candidate);
  return "url" in result ? result.url : null;
}

/**
 * Valida que una URL externa use estrictamente protocolo http: o https:,
 * posea un hostname válido y no contenga credenciales embebidas ni triple barra.
 * Devuelve null ante esquemas peligrosos (javascript:, data:) o URLs inválidas.
 */
export function sanitizeHttpUrl(rawUrl: string): string | null {
  if (typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const parsed = parseValidHttpUrl(trimmed);
  return parsed ? parsed.href : null;
}

/**
 * Normaliza la entrada de URL de un formulario: antepone https:// solo si
 * el usuario omitió el esquema, y valida protocolo http:/https:, hostname
 * no vacío y ausencia de credenciales embebidas o triple barra.
 */
export function normalizeHttpUrlInput(rawUrl: string): UrlNormalizationResult {
  if (typeof rawUrl !== "string") {
    return { ok: false, error: "Ingresa una URL válida." };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { ok: false, error: "Ingresa una URL válida." };
  }

  if (trimmed.startsWith("//")) {
    return {
      ok: false,
      error: "Ingresa una URL válida con protocolo http:// o https://.",
    };
  }

  const candidate = !SCHEME_PREFIX_REGEX.test(trimmed)
    ? `https://${trimmed}`
    : trimmed;

  const result = inspectHttpUrl(candidate);
  if ("error" in result) {
    return { ok: false, error: result.error };
  }

  return { ok: true, url: result.url.href };
}
