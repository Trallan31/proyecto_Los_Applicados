import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import mongoose, { Types } from "mongoose";
import Activity from "./models/activity";
import Course from "./models/course";
import Project from "./models/project";
import Session from "./models/session";
import Sprint from "./models/sprint";
import Task from "./models/task";
import User from "./models/user";

type Row = Record<string, unknown>;

const collections = [
  "users",
  "courses",
  "sessions",
  "tasks",
  "projects",
  "sprints",
  "activities",
] as const;

type CollectionName = (typeof collections)[number];

interface ImportPlan {
  name: string;
  total: number;
  write: () => Promise<number>;
}

interface SeedDocument {
  _id: unknown;
  validate(): Promise<void>;
  save(): Promise<unknown>;
}

interface SeedModel {
  new (row: Row): SeedDocument;
  findById(id: unknown): PromiseLike<SeedDocument | null>;
}

function isRecord(value: unknown): value is Row {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readRows(
  source: Row,
  collection: CollectionName
): Row[] {
  const value = source[collection];
  if (!Array.isArray(value)) {
    throw new Error(`Falta la colección ${collection} en db.json.`);
  }

  const rows: Row[] = [];
  const ids = new Set<string>();

  for (const item of value) {
    if (!isRecord(item)) {
      throw new Error(`Documento inválido en ${collection}.`);
    }
    if (typeof item.id !== "string" || !item.id) {
      throw new Error(`Documento sin id válido en ${collection}.`);
    }
    if (ids.has(item.id)) {
      throw new Error(`ID duplicado en ${collection}: ${item.id}.`);
    }
    ids.add(item.id);
    rows.push(item);
  }
  return rows;
}

function readId(row: Row): string {
  if (typeof row.id !== "string" || !row.id) {
    throw new Error("El documento no tiene un id válido.");
  }
  return row.id;
}

// El mismo nombre de colección + ID antiguo genera siempre
// el mismo ObjectId para esta importación.
function mongoId(
  collection: CollectionName,
  oldId: string
): string {
  return createHash("sha256")
    .update(`applicate-seed:${collection}:${oldId}`)
    .digest("hex")
    .slice(0, 24);
}

async function createPlan(
  name: string,
  model: SeedModel,
  rows: Row[]
): Promise<ImportPlan> {
  const documents = rows.map((row) => new model(row));

  // Validamos todos antes de comenzar la importación.
  for (const document of documents) {
    await document.validate();
  }
  return {
    name,
    total: documents.length,
    async write(): Promise<number> {
      let inserted = 0;
      for (const document of documents) {
        const existing = await model.findById(document._id);
        if (existing) {
          continue;
        }
        await document.save();
        inserted += 1;
      }
      return inserted;
    },
  };
}

async function seed(): Promise<void> {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error("Falta MONGODB_URI en backend/.env.");
  }
  // npm run seed --prefix backend ejecuta el script desde backend/.
  const file = await readFile(
    resolve(process.cwd(), "db.json"),
    "utf8"
  );
  const parsed: unknown = JSON.parse(file);
  if (!isRecord(parsed)) {
    throw new Error("db.json debe contener un objeto JSON.");
  }

  const source = new Map<CollectionName, Row[]>();
  const ids = new Map<CollectionName, Map<string, string>>();

  for (const collection of collections) {
    const rows = readRows(parsed, collection);
    source.set(collection, rows);
    const mapping = new Map<string, string>();
    for (const row of rows) {
      const oldId = readId(row);
      mapping.set(
        oldId,
        collection === "users"
          ? oldId
          : mongoId(collection, oldId)
      );
    }
    ids.set(collection, mapping);
  }

  function reference(
    collection: CollectionName,
    value: unknown
  ): string {
    if (typeof value !== "string") {
      throw new Error(`Referencia inválida a ${collection}.`);
    }
    const mapped = ids.get(collection)?.get(value);
    if (!mapped) {
      throw new Error(
        `Referencia inexistente: ${collection}/${value}.`
      );
    }
    return mapped;
  }

  function prepare(collection: CollectionName): Row[] {
    const rows = source.get(collection);
    if (!rows) {
      throw new Error(`Colección no encontrada: ${collection}.`);
    }
    return rows.map((row) => {
      const { id: _legacyId, ...fields } = row;
      const mappedId = reference(collection, readId(row));
      const document: Row = {
        ...fields,
        _id:
          collection === "users"
            ? mappedId
            : new Types.ObjectId(mappedId),
      };
      if (collection === "courses" || collection === "tasks") {
        document.userId = reference("users", row.userId);
      }
      if (collection === "sessions") {
        document.courseId = reference("courses", row.courseId);
      }
      if (collection === "tasks") {
        document.courseId =
          row.courseId === null || row.courseId === undefined
            ? null
            : reference("courses", row.courseId);
      }
      if (collection === "projects") {
        if (!Array.isArray(row.members)) {
          throw new Error("Un proyecto tiene members inválido.");
        }
        document.members = row.members.map((member: unknown) => {
          if (!isRecord(member)) {
            throw new Error("Miembro de proyecto inválido.");
          }
          return {
            ...member,
            userId: reference("users", member.userId),
          };
        });
      }
      if (collection === "sprints" || collection === "activities") {
        document.projectId = reference("projects", row.projectId);
      }
      if (collection === "activities") {
        document.sprintId =
          row.sprintId === "" ||
          row.sprintId === null ||
          row.sprintId === undefined
            ? ""
            : reference("sprints", row.sprintId);
        if (!Array.isArray(row.members)) {
          throw new Error("Una actividad tiene members inválido.");
        }
        document.members = row.members.map((member: unknown) =>
          reference("users", member)
        );
      }
      return document;
    });
  }

  // Primero se preparan y validan las siete colecciones.
  const plans: ImportPlan[] = [
    await createPlan("users", User, prepare("users")),
    await createPlan("courses", Course, prepare("courses")),
    await createPlan("sessions", Session, prepare("sessions")),
    await createPlan("tasks", Task, prepare("tasks")),
    await createPlan("projects", Project, prepare("projects")),
    await createPlan("sprints", Sprint, prepare("sprints")),
    await createPlan("activities", Activity, prepare("activities")),
  ];

  await mongoose.connect(mongodbUri);

  console.log(
    `Base de datos destino: ${mongoose.connection.name}`
  );
  for (const plan of plans) {
    const inserted = await plan.write();
    console.log(
      `${plan.name}: ${inserted} insertados, ` +
      `${plan.total - inserted} ya existentes.`
    );
  }
  console.log("Importación completada.");
}

seed()
  .catch((error: unknown) => {
    console.error(
      "Error al importar:",
      error instanceof Error ? error.message : "Error desconocido"
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
