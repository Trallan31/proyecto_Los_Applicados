import { Router } from "express";
import { unknownEndpoint } from "../middleware/errorHandler";
import Activity from "../models/activity";
import Course from "../models/course";
import Project from "../models/project";
import Session from "../models/session";
import Sprint from "../models/sprint";
import Task from "../models/task";
import User from "../models/user";
import { isTestEnv } from "../utils/config";

export const testModels = [
  Activity,
  Sprint,
  Project,
  Task,
  Session,
  Course,
  User,
] as const;

/** Interfaz mínima común para vaciar cualquier modelo Mongoose de prueba. */
interface ClearableModel {
  deleteMany: (filter: Record<string, never>) => PromiseLike<unknown>;
}

/** Elimina todos los documentos de las siete colecciones en el entorno de pruebas. */
export async function clearTestCollections(): Promise<void> {
  if (!isTestEnv()) {
    throw new Error("Solo disponible en entorno de pruebas.");
  }

  const models: readonly ClearableModel[] = testModels;
  await Promise.all(models.map((model) => model.deleteMany({})));
}

const router = Router();

/** Reinicia la base de datos de pruebas eliminando las siete colecciones. */
router.post("/reset", async (_request, response, next) => {
  try {
    if (!isTestEnv()) {
      response.status(404).json({
        error: "Ruta no encontrada.",
      });
      return;
    }

    await clearTestCollections();

    response.status(204).end();
  } catch (error: unknown) {
    next(error);
  }
});

router.use(unknownEndpoint);

export default router;
