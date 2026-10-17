import { model, Schema } from "mongoose";
import {
  embeddedOptions,
  requiredText,
  schemaOptions,
} from "./shared";

const courseLinkSchema = new Schema(
  {
    id: requiredText,
    title: requiredText,
    url: requiredText,
    category: {
      type: String,
      enum: ["lms", "drive", "video", "web", "otro"],
    },
  },
  embeddedOptions
);

const courseSchema = new Schema(
  {
    userId: requiredText,
    name: requiredText,
    code: requiredText,
    shortName: requiredText,
    color: requiredText,
    links: {
      type: [courseLinkSchema],
      default: [],
    },
  },
  schemaOptions
);

export default model("Course", courseSchema);
