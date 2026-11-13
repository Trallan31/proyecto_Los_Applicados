import { Types } from "mongoose";
import { HttpError } from "../errors";
import Course from "../models/course";
import Project from "../models/project";
import Sprint from "../models/sprint";
import User from "../models/user";
import Activity from "../models/activity";
import Session from "../models/session";
import Task from "../models/task";

export type Resource =
  | "courses"
  | "sessions"
  | "tasks"
  | "projects"
  | "sprints"
  | "activities";

type Data = Record<string, unknown>;

interface MemberData {
  userId: string;
  role: "Admin" | "Miembro";
}

export interface ProjectMemberHolder {
  members?: Array<{ userId: string; role: "Admin" | "Miembro" }>;
}

export function isProjectAdmin(
  project: ProjectMemberHolder,
  userId: string
): boolean {
  return Boolean(
    project.members?.some(
      (member) => member.userId === userId && member.role === "Admin"
    )
  );
}

export function requireProjectAdmin(
  project: ProjectMemberHolder,
  userId: string,
  message: string
): void {
  if (!isProjectAdmin(project, userId)) {
    throw new HttpError(403, message);
  }
}

function objectId(value: unknown, field: string): string {
  if (value instanceof Types.ObjectId) {
    return value.toHexString();
  }
  if (
    typeof value !== "string" ||
    !/^[a-f\d]{24}$/i.test(value)
  ) {
    throw new HttpError(
      400,
      `${field} debe ser un ObjectId válido.`
    );
  }
  return value;
}

async function ownedCourse(
  value: unknown,
  userId: string
): Promise<void> {
  const id = objectId(value, "courseId");
  const course = await Course.findOne({
    _id: id,
    userId,
  });
  if (!course) {
    throw new HttpError(
      404,
      "Ramo no encontrado o sin acceso."
    );
  }
}

async function accessibleProject(
  value: unknown,
  userId: string
) {
  const id = objectId(value, "projectId");
  const project = await Project.findOne({
    _id: id,
    "members.userId": userId,
  });
  if (!project) {
    throw new HttpError(
      404,
      "Proyecto no encontrado o sin acceso."
    );
  }
  return project;
}

async function validateMembers(
  value: unknown
): Promise<MemberData[]> {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(
      400,
      "El proyecto necesita miembros y al menos un administrador."
    );
  }
  const members: MemberData[] = [];
  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("userId" in item) ||
      typeof item.userId !== "string" ||
      !item.userId.trim() ||
      !("role" in item) ||
      (item.role !== "Admin" && item.role !== "Miembro")
    ) {
      throw new HttpError(
        400,
        "La lista de miembros no es válida."
      );
    }
    members.push({
      userId: item.userId.trim(),
      role: item.role,
    });
  }
  const ids = members.map((member) => member.userId);
  if (new Set(ids).size !== ids.length) {
    throw new HttpError(
      400,
      "No puede haber miembros duplicados."
    );
  }
  if (!members.some((member) => member.role === "Admin")) {
    throw new HttpError(
      400,
      "El proyecto debe conservar al menos un administrador."
    );
  }
  const count = await User.countDocuments({
    _id: { $in: ids },
  });
  if (count !== ids.length) {
    throw new HttpError(
      400,
      "Uno o más miembros no existen."
    );
  }
  return members;
}

/** Filtro aplicado a listados, consultas, cambios y eliminaciones. */
export async function accessFilter(
  resource: Resource,
  userId: string
): Promise<Data> {
  if (resource === "courses" || resource === "tasks") {
    return { userId };
  }
  if (resource === "projects") {
    return { "members.userId": userId };
  }
  if (resource === "sessions") {
    const courses = await Course.find({ userId }).select("_id");
    return {
      courseId: {
        $in: courses.map((course) => course._id),
      },
    };
  }
  const projects = await Project.find({
    "members.userId": userId,
  }).select("_id");
  return {
    projectId: {
      $in: projects.map((project) => project._id),
    },
  };
}

/** Valida el estado final de una creación o actualización. */
export async function prepareWrite(
  resource: Resource,
  userId: string,
  body: Data,
  current?: Data
): Promise<Data> {
  const changes = { ...body };
  const finalData = { ...current, ...changes };
  if (resource === "courses" || resource === "tasks") {
    // Nunca confiar en un propietario enviado desde el navegador.
    changes.userId = userId;
  }
  if (resource === "tasks") {
    if (
      finalData.courseId !== undefined &&
      finalData.courseId !== null
    ) {
      await ownedCourse(finalData.courseId, userId);
    }
    if (
      finalData.scope === "Ramo" &&
      !finalData.courseId
    ) {
      throw new HttpError(
        400,
        "Una tarea de ramo necesita un ramo."
      );
    }
    if (
      finalData.scope === "Personal" &&
      finalData.courseId != null
    ) {
      throw new HttpError(
        400,
        "Una tarea personal no puede tener un ramo."
      );
    }
  }
  if (resource === "sessions") {
    await ownedCourse(finalData.courseId, userId);
  }
  if (resource === "projects") {
    if (!current) {
      changes.members = [
        { userId, role: "Admin" },
      ];
    } else {
      const project = await accessibleProject(
        current._id,
        userId
      );
      requireProjectAdmin(
        project,
        userId,
        "Solo un administrador puede modificar el proyecto."
      );
      if (
        Object.prototype.hasOwnProperty.call(body, "members")
      ) {
        changes.members = await validateMembers(body.members);
      }
    }
  }
  if (resource === "sprints" || resource === "activities") {
    const projectId = objectId(
      finalData.projectId,
      "projectId"
    );
    // Mover entidades entre proyectos requiere un flujo específico.
    if (
      current &&
      objectId(current.projectId, "projectId").toLowerCase() !==
        projectId.toLowerCase()
    ) {
      throw new HttpError(
        400,
        "No se puede cambiar el proyecto de este recurso."
      );
    }
    const project = await accessibleProject(
      projectId,
      userId
    );
    if (resource === "sprints") {
      requireProjectAdmin(
        project,
        userId,
        "Solo un administrador puede gestionar los sprints."
      );
    }
    if (resource === "activities") {
      // Cualquier miembro del proyecto (Admin o Miembro) tiene permisos para
      // crear, listar, consultar, editar y eliminar actividades del proyecto
      // compartido. Los usuarios externos no tienen acceso y reciben 404.
      const sprintId = finalData.sprintId;
      if (
        sprintId !== undefined &&
        sprintId !== "" &&
        sprintId !== null
      ) {
        const sprint = await Sprint.findOne({
          _id: objectId(sprintId, "sprintId"),
          projectId,
        });
        if (!sprint) {
          throw new HttpError(
            400,
            "El sprint no pertenece a este proyecto."
          );
        }
        changes.sprintId = sprint._id.toString();
      }

      if (!current || Object.prototype.hasOwnProperty.call(body, "category")) {
        let resolvedCategory = "";
        if (Object.prototype.hasOwnProperty.call(body, "category")) {
          if (typeof body.category !== "string") {
            throw new HttpError(
              400,
              "La categoría debe ser una cadena de texto."
            );
          }
          const trimmed = body.category.trim();
          changes.category = trimmed;
          resolvedCategory = trimmed;
        } else if (current && typeof current.category === "string") {
          resolvedCategory = current.category;
        }
        const projectCategories: string[] = Array.isArray(project.categories)
          ? project.categories
          : [];
        if (
          resolvedCategory !== "" &&
          !projectCategories.includes(resolvedCategory)
        ) {
          throw new HttpError(
            400,
            "La categoría no pertenece a este proyecto."
          );
        }
      }

      const members = finalData.members ?? [];
      if (
        !Array.isArray(members) ||
        !members.every(
          (id: unknown) => typeof id === "string"
        )
      ) {
        throw new HttpError(
          400,
          "Los responsables deben ser una lista de usuarios."
        );
      }
      const memberIds = new Set(
        project.members.map((member) => member.userId)
      );
      if (
        members.some(
          (id: string) => !memberIds.has(id)
        )
      ) {
        throw new HttpError(
          400,
          "Los responsables deben pertenecer al proyecto."
        );
      }
      if (new Set(members).size !== members.length) {
        throw new HttpError(
          400,
          "No puede haber responsables duplicados."
        );
      }
    }
  }
  return changes;
}

/**
 * Limpieza en el servidor de referencias derivadas tras actualizar un documento.
 */
export async function afterUpdate(
  resource: Resource,
  previous: Data,
  updated: Data
): Promise<void> {
  if (resource !== "projects") return;

  const rawId = updated._id ?? updated.id;
  const projectObjectId = new Types.ObjectId(
    objectId(rawId, "projectId")
  );

  // 1. Limpieza de miembros removidos en las actividades del proyecto
  const prevMembers = Array.isArray(previous.members)
    ? previous.members
    : [];
  const updatedMembers = Array.isArray(updated.members)
    ? updated.members
    : [];

  const prevMemberIds = prevMembers
    .map((m) =>
      typeof m === "object" && m !== null && "userId" in m
        ? String((m as { userId: unknown }).userId)
        : ""
    )
    .filter((id) => id.length > 0);

  const updatedMemberIds = new Set(
    updatedMembers
      .map((m) =>
        typeof m === "object" && m !== null && "userId" in m
          ? String((m as { userId: unknown }).userId)
          : ""
      )
      .filter((id) => id.length > 0)
  );

  const removedMembers = prevMemberIds.filter(
    (id) => !updatedMemberIds.has(id)
  );

  if (removedMembers.length > 0) {
    await Activity.updateMany(
      {
        projectId: projectObjectId,
        members: { $in: removedMembers },
      },
      {
        $pull: {
          members: { $in: removedMembers } as unknown as string,
        },
      }
    );
  }

  // 2. Limpieza de categorías removidas en las actividades del proyecto
  const prevCategories = Array.isArray(previous.categories)
    ? (previous.categories as unknown[])
        .map((c) => (typeof c === "string" ? c.trim() : ""))
        .filter((c) => c.length > 0)
    : [];

  const updatedCategories = new Set(
    Array.isArray(updated.categories)
      ? (updated.categories as unknown[])
          .map((c) => (typeof c === "string" ? c.trim() : ""))
          .filter((c) => c.length > 0)
      : []
  );

  const removedCategories = prevCategories.filter(
    (c) => !updatedCategories.has(c)
  );

  if (removedCategories.length > 0) {
    await Activity.updateMany(
      {
        projectId: projectObjectId,
        category: { $in: removedCategories },
      },
      {
        $set: { category: "" },
      }
    );
  }
}

/**
 * Comprueba permisos antes de eliminar y devuelve el filtro atómico
 * final para la operación findOneAndDelete (protección anti-TOCTOU).
 */
export async function beforeDelete(
  resource: Resource,
  userId: string,
  current: Data,
  baseFilter: Data
): Promise<Data> {
  if (resource === "projects") {
    const project = await accessibleProject(current._id, userId);
    requireProjectAdmin(
      project,
      userId,
      "Solo un administrador puede eliminar el proyecto."
    );
    return {
      _id: current._id,
      members: { $elemMatch: { userId, role: "Admin" } },
    };
  }

  if (resource === "sprints") {
    const project = await accessibleProject(current.projectId, userId);
    requireProjectAdmin(
      project,
      userId,
      "Solo un administrador puede eliminar sprints."
    );
    return baseFilter;
  }

  // Para actividades y recursos personales/académicos (courses, sessions, tasks),
  // la autorización ya fue validada mediante baseFilter y se aplica directamente.
  return baseFilter;
}

/**
 * Gestiona fallos atómicos en la eliminación (documento modificado concurrentemente).
 */
export async function handleDeleteConflict(
  resource: Resource,
  userId: string,
  current: Data
): Promise<never> {
  if (resource === "projects") {
    const exists = await Project.exists({
      _id: current._id,
      "members.userId": userId,
    });
    if (exists) {
      throw new HttpError(
        403,
        "Solo un administrador puede eliminar el proyecto."
      );
    }
  }

  throw new HttpError(404, "Recurso no encontrado o sin acceso.");
}

/**
 * Limpieza de referencias en el servidor, no desde el navegador.
 * No es una transacción: si falla, la operación devuelve error.
 */
export async function removeRelated(
  resource: Resource,
  id: unknown
): Promise<void> {
  const resourceId = new Types.ObjectId(
    objectId(id, "id")
  );
  if (resource === "courses") {
    await Session.deleteMany({
      courseId: resourceId,
    });
    await Task.updateMany(
      { courseId: resourceId },
      {
        $set: {
          courseId: null,
          scope: "Personal",
        },
      }
    );
  }
  if (resource === "sprints") {
    await Activity.updateMany(
      { sprintId: resourceId.toString() },
      { $set: { sprintId: "" } }
    );
  }
  if (resource === "projects") {
    await Activity.deleteMany({
      projectId: resourceId,
    });
    await Sprint.deleteMany({
      projectId: resourceId,
    });
  }
}
