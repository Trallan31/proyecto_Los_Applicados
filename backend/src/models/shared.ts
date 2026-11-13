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

export function isHttpUrl(value: string): boolean {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\/\//i.test(trimmed)) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

export const requiredHttpUrl = {
  type: String,
  required: true,
  trim: true,
  validate: {
    validator: isHttpUrl,
    message: "La URL debe ser válida y usar protocolo http o https.",
  },
};

export function isHexColor(value: string): boolean {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export const requiredHexColor = {
  type: String,
  required: true,
  trim: true,
  validate: {
    validator: isHexColor,
    message: "El color debe tener formato hexadecimal #RRGGBB.",
  },
};

export function isEmailFormat(value: string): boolean {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isOptionalObjectId(value: string): boolean {
  return (
    typeof value === "string" &&
    (value === "" || /^[a-f\d]{24}$/i.test(value))
  );
}
