import { Router } from "express";
import { HttpError } from "../errors";
import User from "../models/user";

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;
export const MAX_QUERY_LENGTH = 100;
export const ALLOWED_QUERY_KEYS = new Set(["q", "limit"]);

/**
 * Valida que los parámetros de consulta recibidos pertenezcan únicamente al conjunto permitido.
 * Previene el procesamiento de claves no soportadas o malformadas (ej. `?q[a]=b` o `?limit[]=2`).
 */
export function validateQueryKeys(query: Record<string, unknown>): void {
  for (const key of Object.keys(query)) {
    if (!ALLOWED_QUERY_KEYS.has(key)) {
      throw new HttpError(
        400,
        "Parámetro de consulta no soportado en /api/users."
      );
    }
  }
}

/**
 * Valida que un parámetro de consulta sea una cadena simple si viene definido.
 * Rechaza arrays u objetos generados por parámetros malformados (ej. `?q[a]=b` o `?limit[]=2`).
 */
export function parseSingleQueryParam(
  raw: unknown,
  paramName: string
): string | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (typeof raw !== "string") {
    throw new HttpError(
      400,
      `El parámetro ${paramName} debe ser una cadena de texto.`
    );
  }
  return raw;
}

/**
 * Parsea y valida el parámetro `limit` asegurando que sea un entero positivo.
 * Si no se provee, retorna `DEFAULT_LIMIT`. Acota el valor resultante a `MAX_LIMIT`.
 */
export function parseLimit(rawLimit: unknown): number {
  const limitStr = parseSingleQueryParam(rawLimit, "limit");
  if (limitStr === undefined) {
    return DEFAULT_LIMIT;
  }

  const trimmed = limitStr.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) {
    throw new HttpError(
      400,
      "El parámetro limit debe ser un entero positivo."
    );
  }

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new HttpError(
      400,
      "El parámetro limit debe ser un entero positivo."
    );
  }

  return Math.min(parsed, MAX_LIMIT);
}

/**
 * Escapa los metacaracteres de expresiones regulares para evitar inyecciones
 * o errores de sintaxis en búsquedas literales.
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Construye el filtro de búsqueda para MongoDB según el parámetro `q`.
 * Trimea la cadena, valida su longitud máxima y aplica una búsqueda case-insensitive
 * únicamente sobre `username`, `name` y `lastName` (omitiendo deliberadamente `mail`).
 */
export function buildSearchFilter(rawQ: unknown): Record<string, unknown> {
  const queryStr = parseSingleQueryParam(rawQ, "q");
  if (queryStr === undefined) {
    return {};
  }

  const trimmed = queryStr.trim();
  if (trimmed.length === 0) {
    return {};
  }

  if (trimmed.length > MAX_QUERY_LENGTH) {
    throw new HttpError(
      400,
      `El parámetro q no puede superar los ${MAX_QUERY_LENGTH} caracteres.`
    );
  }

  const regex = new RegExp(escapeRegExp(trimmed), "i");
  return {
    $or: [
      { username: { $regex: regex } },
      { name: { $regex: regex } },
      { lastName: { $regex: regex } },
    ],
  };
}

const router = Router();

router.get("/", async (request, response, next) => {
  try {
    validateQueryKeys(request.query as Record<string, unknown>);
    const limit = parseLimit(request.query.limit);
    const filter = buildSearchFilter(request.query.q);

    const users = await User.find(filter)
      .select("_id username name lastName initials avatarColor")
      .sort({ username: 1 })
      .limit(limit);

    response.json(users);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;
