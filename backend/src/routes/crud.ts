import { Router } from "express";
import { createCrudController } from "../controllers/crud";
import type {
  CrudDocument,
  CrudModel,
} from "../controllers/crud";
import type { Resource } from "../controllers/access";

export function createCrudRouter<D extends CrudDocument>(
  model: CrudModel<D>,
  allowedFields: readonly string[],
  resource: Resource
) {
  const router = Router();

  const controller = createCrudController(
    model,
    allowedFields,
    resource
  );

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}