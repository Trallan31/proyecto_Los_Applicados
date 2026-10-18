import { model, Schema } from "mongoose";
import { requiredText, schemaOptions } from "./shared";

export interface UserData {
  _id: string;
  username: string;
  name: string;
  lastName: string;
  mail: string;
  initials: string;
  avatarColor: string;
  passwordHash?: string;
}

const userSchema = new Schema<UserData>(
  {
    _id: requiredText,
    username: { ...requiredText, unique: true },
    name: requiredText,
    lastName: requiredText,
    mail: { ...requiredText, unique: true },
    initials: requiredText,
    avatarColor: requiredText,
    passwordHash: {
      type: String,
      select: false,
    },
  },
  schemaOptions
);

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_document, returnedObject) => {
    (returnedObject as unknown as Record<string, unknown>)._id =
      undefined;
    delete returnedObject.passwordHash;
  },
});

export default model<UserData>("User", userSchema);
