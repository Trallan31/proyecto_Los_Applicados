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
      default: 0,
    },
    dueDate: requiredDate,
  },
  schemaOptions
);

export default model("Activity", activitySchema);
