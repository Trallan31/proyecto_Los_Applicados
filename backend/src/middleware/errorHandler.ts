import type {
  ErrorRequestHandler,
  RequestHandler,
} from "express";
import mongoose from "mongoose";
import {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";
import { HttpError } from "../errors";

export const unknownEndpoint: RequestHandler = (
  _request,
  response
) => {
  response.status(404).json({
    error: "Ruta no encontrada.",
  });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  next
) => {
  if (response.headersSent) {
    next(error);
    return;
  }
  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: error.message,
    });
    return;
  }
  if (
    error instanceof JsonWebTokenError ||
    error instanceof TokenExpiredError
  ) {
    response.status(401).json({
      error: "La sesión no es válida.",
    });
    return;
  }
  if (error instanceof mongoose.Error.ValidationError) {
    response.status(400).json({
      error: error.message,
    });
    return;
  }
  if (error instanceof mongoose.Error.CastError) {
    response.status(400).json({
      error: `Valor inválido para el campo ${error.path}.`,
    });
    return;
  }
  if (error instanceof mongoose.Error.StrictModeError) {
    response.status(400).json({
      error: "El documento contiene campos no permitidos.",
    });
    return;
  }
  if (
    error instanceof SyntaxError &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    response.status(400).json({
      error: "El cuerpo contiene JSON inválido.",
    });
    return;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    response.status(413).json({
      error: "El cuerpo de la solicitud es demasiado grande.",
    });
    return;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    response.status(400).json({
      error: "Ya existe un recurso con esos datos únicos.",
    });
    return;
  }
  console.error(
    "Error inesperado:",
    error instanceof Error ? error.message : "Error desconocido"
  );
  response.status(500).json({
    error: "Error interno del servidor.",
  });
};
