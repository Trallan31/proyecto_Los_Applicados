import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { Router } from "express";
import type { Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import type { UserData } from "../models/user";
import { HttpError } from "../errors";
import { withUser } from "../middleware/auth";
import { getJwtSecret } from "../utils/config";

const router = Router();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

// Paleta usada para el avatar de los usuarios nuevos.
const avatarColors = [
  "#4f7cff",
  "#9b6dff",
  "#2dd67b",
  "#f5c842",
  "#ff8c42",
  "#ff5c6a",
];

const publicFields = (user: UserData) => ({
  id: user._id,
  username: user.username,
  name: user.name,
  lastName: user.lastName,
  mail: user.mail,
  initials: user.initials,
  avatarColor: user.avatarColor,
});

/** Emite la cookie de sesión y el token CSRF para un usuario recién validado. */
function startSession(response: Response, user: UserData): void {
  const csrf = randomUUID();
  const token = jwt.sign(
    { id: user._id, username: user.username, csrf },
    getJwtSecret(),
    { expiresIn: "1h" }
  );

  response.cookie("token", token, cookieOptions);
  response.setHeader("X-CSRF-Token", csrf);
}

function requiredField(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `${label} es obligatorio.`);
  }
  return value.trim();
}

function readAuthBody(body: unknown): Record<string, unknown> {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    throw new HttpError(400, "El cuerpo debe ser un objeto JSON.");
  }

  return body as Record<string, unknown>;
}

function registrationPassword(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length < 8
  ) {
    throw new HttpError(
      400,
      "La contraseña debe tener al menos 8 caracteres y no puede contener solo espacios."
    );
  }

  // bcrypt solo considera los primeros 72 bytes.
  if (Buffer.byteLength(value, "utf8") > 72) {
    throw new HttpError(
      400,
      "La contraseña no puede superar los 72 bytes."
    );
  }

  // No recortar ni modificar la contraseña.
  return value;
}

router.post("/register", async (request, response, next) => {
  try {
    const body = readAuthBody(request.body);
    const username = requiredField(body.username, "El usuario");
    const name = requiredField(body.name, "El nombre");
    const lastName = requiredField(body.lastName, "El apellido");
    const mail = requiredField(body.mail, "El correo").toLowerCase();
    const password = registrationPassword(body.password);

    if (!/^[a-zA-Z0-9._-]{3,20}$/.test(username)) {
      throw new HttpError(
        400,
        "El usuario debe tener entre 3 y 20 caracteres y solo letras, números, punto, guion o guion bajo."
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      throw new HttpError(400, "El correo no tiene un formato válido.");
    }
    if (password.length < 8) {
      throw new HttpError(
        400,
        "La contraseña debe tener al menos 8 caracteres."
      );
    }

    const taken = await User.findOne({
      $or: [{ username }, { mail }],
    });
    if (taken) {
      throw new HttpError(
        409,
        taken.username === username
          ? "Ese usuario ya está registrado."
          : "Ese correo ya está registrado."
      );
    }

    const user = await User.create({
      _id: `user-${username}`,
      username,
      name,
      lastName,
      mail,
      initials: `${name[0]}${lastName[0]}`.toUpperCase(),
      avatarColor:
        avatarColors[Math.floor(Math.random() * avatarColors.length)],
      passwordHash: await bcrypt.hash(password, 12),
    });

    startSession(response, user);
    response.status(201).json(publicFields(user));
  } catch (error: unknown) {
    next(error);
  }
});

router.post("/login", async (request, response, next) => {
  try {
    const { username, password } = readAuthBody(request.body);

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      throw new HttpError(400, "Usuario y contraseña son obligatorios.");
    }

    const user = await User.findOne({
      $or: [{ username: username.trim() }, { mail: username.trim() }],
    }).select("+passwordHash");

    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, "Usuario o contraseña incorrectos.");
    }

    startSession(response, user);
    response.json(publicFields(user));
  } catch (error: unknown) {
    next(error);
  }
});

router.get("/me", withUser, async (request, response, next) => {
  try {
    const user = await User.findById(request.userId);
    if (!user) {
      throw new HttpError(401, "La sesión no es válida.");
    }
    response.json(user);
  } catch (error: unknown) {
    next(error);
  }
});

router.post("/logout", withUser, (_request, response) => {
  response.clearCookie("token", cookieOptions);
  response.status(204).end();
});

export default router;
