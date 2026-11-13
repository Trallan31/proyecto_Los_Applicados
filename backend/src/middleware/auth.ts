import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../errors";
import User from "../models/user";
import { getJwtSecret } from "../utils/config";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionCsrf?: string;
    }
  }
}

interface AuthTokenPayload {
  id: string;
  csrf: string;
  tokenVersion: number;
}

function verifyJwtToken(token: string): Partial<AuthTokenPayload> {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof decoded !== "object" || decoded === null) {
      throw new HttpError(401, "La sesión no es válida.");
    }
    return decoded as Partial<AuthTokenPayload>;
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(401, "La sesión no es válida.");
  }
}

function isValidAuthPayload(
  payload: Partial<AuthTokenPayload>
): payload is AuthTokenPayload {
  return (
    typeof payload.id === "string" &&
    payload.id.length > 0 &&
    typeof payload.csrf === "string" &&
    payload.csrf.length > 0 &&
    typeof payload.tokenVersion === "number" &&
    Number.isInteger(payload.tokenVersion)
  );
}

/**
 * Construye el middleware de autenticación por cookie JWT y verificación opcional
 * de doble envío mediante el encabezado `X-CSRF-Token`.
 */
function verifySessionMiddleware(requireCsrf: boolean): RequestHandler {
  return async (
    request: Request,
    _response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = request.cookies?.token;
      if (typeof token !== "string" || !token) {
        throw new HttpError(401, "Falta una sesión válida.");
      }

      const payload = verifyJwtToken(token);
      if (!isValidAuthPayload(payload)) {
        throw new HttpError(401, "La sesión no es válida.");
      }

      const user = await User.findById(payload.id).select("+tokenVersion");
      if (!user || (user.tokenVersion ?? 0) !== payload.tokenVersion) {
        throw new HttpError(401, "La sesión no es válida.");
      }

      if (requireCsrf) {
        const csrfHeader = request.get("X-CSRF-Token");
        if (!csrfHeader || csrfHeader !== payload.csrf) {
          throw new HttpError(401, "La sesión no es válida.");
        }
      }

      request.userId = user._id;
      request.sessionCsrf = payload.csrf;
      next();
    } catch (error: unknown) {
      next(error);
    }
  };
}

/** Middleware que exige cookie JWT vigente y validación CSRF. */
export const withUser = verifySessionMiddleware(true);

/** Middleware que exige solo la cookie JWT vigente (restauración de sesión). */
export const withCookieSession = verifySessionMiddleware(false);
