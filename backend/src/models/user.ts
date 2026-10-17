import { model, Schema } from "mongoose";
import { requiredText, schemaOptions } from "./shared";

const userSchema = new Schema(
  {
    // Temporalmente conservamos los identificadores del JSON.
    // La autenticación se implementará por separado.
    _id: requiredText,
    username: requiredText,
    name: requiredText,
    lastName: requiredText,
    mail: requiredText,
    initials: requiredText,
    avatarColor: requiredText,
  },
  schemaOptions
);

export default model("User", userSchema);
