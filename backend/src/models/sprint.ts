import { model, Schema } from "mongoose";
import { requiredText, schemaOptions } from "./shared";

const sprintSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    name: requiredText,
  },
  schemaOptions
);

export default model("Sprint", sprintSchema);
