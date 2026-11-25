import { model, Schema } from "mongoose";
import {
  isEmailFormat,
  requiredHexColor,
  requiredText,
  schemaOptions,
} from "./shared";

export interface UserData {
  _id: string;
  username: string;
  name: string;
  lastName: string;
  mail: string;
  initials: string;
  avatarColor: string;
  passwordHash?: string;
  tokenVersion: number;
}

const userSchema = new Schema<UserData>(
  {
    _id: requiredText,
    username: { ...requiredText, unique: true },
    name: requiredText,
    lastName: requiredText,
    mail: {
      ...requiredText,
      lowercase: true,
      unique: true,
      validate: {
        validator: isEmailFormat,
        message: "El correo no tiene un formato válido.",
      },
    },
    initials: requiredText,
    avatarColor: requiredHexColor,
    passwordHash: {
      type: String,
      select: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      required: true,
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
    delete target.tokenVersion;
    return target;
  },
});

export default model<UserData>("User", userSchema, 'applicados_user');
