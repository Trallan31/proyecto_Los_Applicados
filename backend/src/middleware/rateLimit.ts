import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import { isTestEnv } from "../utils/config";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/** Opciones para configurar un middleware de limitación de tasa HTTP. */
export interface RateLimiterOptions {
  windowMs: number;
  limit: number;
  message: string;
  skipInTest?: boolean;
}

/**
 * Crea un limitador de tasa con cabeceras estándar y respuesta JSON uniforme.
 * Por defecto omite el conteo en entorno de pruebas (`NODE_ENV=test`).
 */
export function createRateLimiter(
  options: RateLimiterOptions
): RateLimitRequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: options.message },
    skip: () => (options.skipInTest ?? true) && isTestEnv(),
  });
}

/** Limitador estricto para registro e inicio de sesión. */
export const authRateLimiter = createRateLimiter({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 20,
  message:
    "Demasiados intentos de autenticación. Inténtalo nuevamente en unos minutos.",
});

/** Limitador general para los recursos protegidos bajo /api. */
export const apiRateLimiter = createRateLimiter({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 300,
  message:
    "Demasiadas solicitudes al servidor. Inténtalo nuevamente en unos minutos.",
});
