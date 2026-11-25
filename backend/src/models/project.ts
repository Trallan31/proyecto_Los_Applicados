import { model, Schema } from "mongoose";
import {
  embeddedOptions,
  requiredHexColor,
  requiredHttpUrl,
  requiredText,
  schemaOptions,
} from "./shared";

const projectMemberSchema = new Schema(
  {
    userId: requiredText,
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Miembro"],
    },
  },
  embeddedOptions
);

const projectLinkSchema = new Schema(
  {
    id: requiredText,
    title: requiredText,
    url: requiredHttpUrl,
    category: {
      type: String,
      enum: [
        "repositorio",
        "diseño",
        "documentación",
        "deploy",
        "otro",
      ],
    },
  },
  embeddedOptions
);

const projectSchema = new Schema(
  {
    name: requiredText,
    description: {
      type: String,
      default: "",
    },
    color: requiredHexColor,
    course: {
      type: String,
      default: "",
    },
    categories: {
      type: [String],
      default: [],
      set: (value: unknown) => {
        if (!Array.isArray(value)) {
          return value;
        }
        return value.map((item) =>
          typeof item === "string" ? item.trim() : item
        );
      },
      validate: {
        validator: (value: unknown) => {
          if (!Array.isArray(value)) {
            return false;
          }
          const normalized = value.map((item) =>
            typeof item === "string" ? item.trim() : ""
          );
          return (
            normalized.every((item) => item.length > 0) &&
            new Set(normalized).size === normalized.length
          );
        },
        message: "Las categorías no pueden estar vacías ni duplicarse.",
      },
    },
    members: {
      type: [projectMemberSchema],
      default: [],
    },
    links: {
      type: [projectLinkSchema],
      default: [],
    },
  },
  schemaOptions
);

projectSchema.index({ "members.userId": 1 });

export default model("Project", projectSchema, 'applicados_model');
