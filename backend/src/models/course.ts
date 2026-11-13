import { model, Schema } from "mongoose";
import {
  embeddedOptions,
  requiredHexColor,
  requiredHttpUrl,
  requiredText,
  schemaOptions,
} from "./shared";

const courseLinkSchema = new Schema(
  {
    id: requiredText,
    title: requiredText,
    url: requiredHttpUrl,
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
    color: requiredHexColor,
    links: {
      type: [courseLinkSchema],
      default: [],
    },
  },
  schemaOptions
);

courseSchema.index({ userId: 1 });

export default model("Course", courseSchema);
