import { model, Schema } from "mongoose";
import {
  embeddedOptions,
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
    url: requiredText,
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
    color: requiredText,
    course: {
      type: String,
      default: "",
    },
    categories: {
      type: [String],
      default: [],
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

export default model("Project", projectSchema);
