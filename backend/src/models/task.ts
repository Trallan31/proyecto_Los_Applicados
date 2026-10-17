import { model, Schema } from "mongoose";
import {
  requiredDate,
  requiredText,
  schemaOptions,
} from "./shared";

const taskSchema = new Schema(
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

export default model("Task", taskSchema);
