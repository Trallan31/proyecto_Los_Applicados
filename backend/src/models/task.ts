import { model, Schema, Types } from "mongoose";
import {
  requiredDate,
  requiredText,
  schemaOptions,
} from "./shared";

interface ITask {
  userId: string;
  title: string;
  scope: "Ramo" | "Proyecto Universitario" | "Personal";
  courseId: Types.ObjectId | null;
  type: "Tarea" | "Evaluación" | "Proyecto" | "Lectura";
  endDate: string;
  dueTime: string | null;
  status: "Pendiente" | "En curso" | "Completada";
  priority: "Alta" | "Media" | "Baja";
  notes: string | null;
}

const taskSchema = new Schema<ITask>(
  {
    userId: requiredText,
    title: requiredText,
    scope: {
      type: String,
      required: true,
      enum: ["Ramo", "Proyecto Universitario", "Personal"],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    type: {
      type: String,
      required: true,
      enum: ["Tarea", "Evaluación", "Proyecto", "Lectura"],
    },
    endDate: requiredDate,
    dueTime: {
      type: String,
      default: null,
      set: (value: unknown) => (value === "" ? null : value),
      validate: {
        validator: (value: string | null) =>
          value === null ||
          /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
        message: "dueTime debe tener formato HH:mm.",
      },
    },
    status: {
      type: String,
      enum: ["Pendiente", "En curso", "Completada"],
      default: "Pendiente",
      required: true,
    },
    priority: {
      type: String,
      enum: ["Alta", "Media", "Baja"],
      default: "Media",
      required: true,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  schemaOptions
);

taskSchema.pre("validate", function () {
  if (this.scope === "Ramo" && this.courseId == null) {
    this.invalidate(
      "courseId",
      "Una tarea de ramo debe tener un ramo asignado."
    );
  }
  if (this.scope === "Personal" && this.courseId != null) {
    this.invalidate(
      "courseId",
      "Una tarea personal no puede tener un ramo asignado."
    );
  }
});

taskSchema.index({ userId: 1, endDate: 1 });
taskSchema.index({ courseId: 1 });

export default model<ITask>("Task", taskSchema, 'applicados_task');
