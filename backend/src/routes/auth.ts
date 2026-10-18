import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { HttpError } from "../errors";
import { withUser } from "../middleware/auth";
import { getJwtSecret } from "../utils/config";

const router = Router();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

router.post("/login", async (request, response, next) => {
  try {
    const { username, password } = request.body as {
      username?: unknown;
      password?: unknown;
    };

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

    const csrf = randomUUID();
    const token = jwt.sign(
      { id: user.id, username: user.username, csrf },
      getJwtSecret(),
      { expiresIn: "1h" }
    );

    response.cookie("token", token, cookieOptions);
    response.setHeader("X-CSRF-Token", csrf);
    response.json({
      id: user.id,
      username: user.username,
      name: user.name,
      lastName: user.lastName,
      mail: user.mail,
      initials: user.initials,
      avatarColor: user.avatarColor,
    });
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

router.post("/logout", (_request, response) => {
  response.clearCookie("token", cookieOptions);
  response.status(204).end();
});

export default router;
