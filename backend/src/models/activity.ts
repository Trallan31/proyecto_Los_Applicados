import { model, Schema } from "mongoose";
import {
  isOptionalObjectId,
  requiredDate,
  requiredText,
  schemaOptions,
} from "./shared";

const activitySchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    sprintId: {
      type: String,
      default: "",
      validate: {
        validator: isOptionalObjectId,
        message: "sprintId debe ser un ObjectId válido o una cadena vacía.",
      },
    },
    title: requiredText,
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    members: {
      type: [String],
      default: [],
    },
    priority: {
      type: String,
      required: true,
      enum: ["Baja", "Media", "Alta", "Critica"],
      default: "Media",
    },
    status: {
      type: String,
      required: true,
      enum: [
        "Pendiente",
        "En curso",
        "Completada",
        "En revisión",
        "Cancelada",
      ],
      default: "Pendiente",
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
      max: 10000,
      default: 0,
      validate: {
        validator: Number.isFinite,
        message: "Las horas deben ser un número finito entre 0 y 10000.",
      },
    },
    dueDate: requiredDate,
    // Posicion de la tarea dentro del tablero del proyecto.
    // La reordena el drag & drop del frontend.
    order: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isFinite,
        message: "El orden debe ser un número finito mayor o igual a 0.",
      },
    },
  },
  schemaOptions
);

activitySchema.index({ projectId: 1, order: 1 });
activitySchema.index({ sprintId: 1 });

export default model("Activity", activitySchema);
