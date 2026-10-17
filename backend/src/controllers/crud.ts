import type { RequestHandler } from "express";
import { HttpError } from "../errors";

export interface CrudDocument {
  set(body: Record<string, unknown>): unknown;
  save(): Promise<unknown>;
}

export interface CrudModel<D extends CrudDocument> {
  new (body: Record<string, unknown>): D;

  find(
    filter: Record<string, unknown>
  ): PromiseLike<D[]>;

  findById(
    id: unknown
  ): PromiseLike<D | null>;

  findByIdAndDelete(
    id: unknown
  ): PromiseLike<D | null>;
}

function readBody(
  body: unknown,
  allowedFields: readonly string[]
): Record<string, unknown> {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    throw new HttpError(400, "El cuerpo debe ser un objeto JSON.");
  }

  const data = body as Record<string, unknown>;
  const fields = Object.keys(data);

  if (fields.length === 0) {
    throw new HttpError(400, "Debes enviar al menos un campo.");
  }
  for (const field of fields) {
    if (!allowedFields.includes(field)) {
      throw new HttpError(400, `Campo no permitido: ${field}.`);
    }
  }
  return data;
}

export function createCrudController<D extends CrudDocument>(
  model: CrudModel<D>,
  allowedFields: readonly string[]
) {
  const list: RequestHandler = async (_request, response, next) => {
    try {
      const documents = await model.find({});
      response.json(documents);
    } catch (error: unknown) {
      next(error);
    }
  };

  const getById: RequestHandler = async (request, response, next) => {
    try {
      const document = await model.findById(request.params.id);
      if (!document) {
        throw new HttpError(404, "Recurso no encontrado.");
      }
      response.json(document);
    } catch (error: unknown) {
      next(error);
    }
  };

  const create: RequestHandler = async (request, response, next) => {
    try {
      const body = readBody(request.body, allowedFields);
      const document = new model(body);
      await document.save();
      response.status(201).json(document);
    } catch (error: unknown) {
      next(error);
    }
  };

  const update: RequestHandler = async (request, response, next) => {
    try {
      const body = readBody(request.body, allowedFields);
      const document = await model.findById(request.params.id);
      if (!document) {
        throw new HttpError(404, "Recurso no encontrado.");
      }
      document.set(body);
      await document.save();
      response.json(document);
    } catch (error: unknown) {
      next(error);
    }
  };

  const remove: RequestHandler = async (request, response, next) => {
    try {
      const document = await model.findByIdAndDelete(
        request.params.id
      );
      if (!document) {
        throw new HttpError(404, "Recurso no encontrado.");
      }
      response.status(204).end();
    } catch (error: unknown) {
      next(error);
    }
  };
  return { list, getById, create, update, remove };
}
