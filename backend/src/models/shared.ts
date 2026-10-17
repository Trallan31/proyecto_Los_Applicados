import { Types } from "mongoose";

// Incluye el virtual "id" y oculta los campos internos de MongoDB.
// Así el frontend recibe "id" en lugar de "_id".
export const schemaOptions = {
  strict: "throw" as const,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (
      _document: unknown,
      returnedObject: Record<string, unknown>
    ) => {
      delete returnedObject._id;
      return returnedObject;
    },
  },
};

export const embeddedOptions = {
  _id: false,
  strict: "throw" as const,
};

export const requiredText = {
  type: String,
  required: true,
  trim: true,
};

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export const requiredDate = {
  type: String,
  required: true,
  validate: {
    validator: isCalendarDate,
    message: "La fecha debe ser válida y tener formato YYYY-MM-DD.",
  },
};

export function isOptionalObjectId(value: string): boolean {
  return value === "" || Types.ObjectId.isValid(value);
}
