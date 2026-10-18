import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../errors";
import { getJwtSecret } from "../utils/config";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

interface AuthToken {
  id: string;
  csrf: string;
}

export function withUser(
  request: Request,
  _response: Response,
  next: NextFunction
): void {
  try {
    const token = request.cookies?.token;
    if (!token) {
      throw new HttpError(401, "Falta una sesión válida.");
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const csrfHeader = request.get("X-CSRF-Token");

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.id !== "string" ||
      typeof decoded.csrf !== "string" ||
      decoded.csrf !== csrfHeader
    ) {
      throw new HttpError(401, "La sesión no es válida.");
    }

    request.userId = decoded.id;
    next();
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }
    next(new HttpError(401, "La sesión no es válida."));
  }
}
