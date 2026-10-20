import type { Request, RequestHandler } from "express";
import { HttpError } from "../errors";
import {
  accessFilter,
  beforeDelete,
  prepareWrite,
  removeRelated,
} from "./access";
import type { Resource } from "./access";

type Data = Record<string, unknown>;

export interface CrudDocument {
  set(body: Data): unknown;
  save(): Promise<unknown>;
  toObject(): Data;
}

export interface CrudModel<D extends CrudDocument> {
  new (body: Data): D;
  find(filter: Data): PromiseLike<D[]>;
  findOne(filter: Data): PromiseLike<D | null>;
  findOneAndDelete(filter: Data): PromiseLike<D | null>;
}

function authenticatedUser(request: Request): string {
  if (!request.userId) {
    throw new HttpError(
      401,
      "Falta una sesión válida."
    );
  }
  return request.userId;
}

function readBody(
  body: unknown,
  allowedFields: readonly string[]
): Data {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    throw new HttpError(
      400,
      "El cuerpo debe ser un objeto JSON."
    );
  }
  const data = body as Data;
  const fields = Object.keys(data);
  if (fields.length === 0) {
    throw new HttpError(
      400,
      "Debes enviar al menos un campo."
    );
  }
  for (const field of fields) {
    if (!allowedFields.includes(field)) {
      throw new HttpError(
        400,
        `Campo no permitido: ${field}.`
      );
    }
  }
  return data;
}

export function createCrudController<D extends CrudDocument>(
  model: CrudModel<D>,
  allowedFields: readonly string[],
  resource: Resource
) {
  async function resourceFilter(
    request: Request
  ): Promise<Data> {
    const filter = await accessFilter(
      resource,
      authenticatedUser(request)
    );
    return {
      ...filter,
      _id: request.params.id,
    };
  }

  const list: RequestHandler = async (
    request,
    response,
    next
  ) => {
    try {
      const filter = await accessFilter(
        resource,
        authenticatedUser(request)
      );
      response.json(await model.find(filter));
    } catch (error: unknown) {
      next(error);
    }
  };

  const getById: RequestHandler = async (
    request,
    response,
    next
  ) => {
    try {
      const document = await model.findOne(
        await resourceFilter(request)
      );
      if (!document) {
        throw new HttpError(
          404,
          "Recurso no encontrado o sin acceso."
        );
      }
      response.json(document);
    } catch (error: unknown) {
      next(error);
    }
  };

  const create: RequestHandler = async (
    request,
    response,
    next
  ) => {
    try {
      const body = readBody(
        request.body,
        allowedFields
      );
      const data = await prepareWrite(
        resource,
        authenticatedUser(request),
        body
      );
      const document = new model(data);
      await document.save();
      response.status(201).json(document);
    } catch (error: unknown) {
      next(error);
    }
  };

  const update: RequestHandler = async (
    request,
    response,
    next
  ) => {
    try {
      const body = readBody(
        request.body,
        allowedFields
      );
      const document = await model.findOne(
        await resourceFilter(request)
      );
      if (!document) {
        throw new HttpError(
          404,
          "Recurso no encontrado o sin acceso."
        );
      }
      const changes = await prepareWrite(
        resource,
        authenticatedUser(request),
        body,
        document.toObject()
      );
      document.set(changes);
      await document.save();
      response.json(document);
    } catch (error: unknown) {
      next(error);
    }
  };

  const remove: RequestHandler = async (
    request,
    response,
    next
  ) => {
    try {
      const filter = await resourceFilter(request);
      const document = await model.findOne(filter);
      if (!document) {
        throw new HttpError(
          404,
          "Recurso no encontrado o sin acceso."
        );
      }
      const current = document.toObject();
      await beforeDelete(
        resource,
        authenticatedUser(request),
        current
      );
      await removeRelated(resource, current._id);
      const deleted = await model.findOneAndDelete(filter);
      if (!deleted) {
        throw new HttpError(
          404,
          "Recurso no encontrado o sin acceso."
        );
      }
      response.status(204).end();
    } catch (error: unknown) {
      next(error);
    }
  };
  return {
    list,
    getById,
    create,
    update,
    remove,
  };
}