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
    const target = returnedObject as unknown as Record<string, unknown>;
    delete target._id;
    delete target.__v;
    delete target.passwordHash;
    return target;
  },
});

export default model<UserData>("User", userSchema);
