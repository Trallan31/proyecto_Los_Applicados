import { Router } from "express";
import { createCrudController } from "../controllers/crud";
import type {
  CrudDocument,
  CrudModel,
} from "../controllers/crud";

export function createCrudRouter<D extends CrudDocument>(
  model: CrudModel<D>,
  allowedFields: readonly string[]
) {
  const router = Router();
  const controller = createCrudController(
    model,
    allowedFields
  );

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}
