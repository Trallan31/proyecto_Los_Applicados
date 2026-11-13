import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { isEmailFormat } from "./models/shared";
import User from "./models/user";

async function main(): Promise<void> {
  const [
    rawUsername,
    password,
    rawName,
    rawMail,
  ] = process.argv.slice(2);

  if (!rawUsername || !password) {
    throw new Error(
      "Uso: npm run create-user -- <usuario> <contraseña> [nombre] [correo]"
    );
  }

  const username = rawUsername.trim();
  if (!/^[a-zA-Z0-9._-]{3,20}$/.test(username)) {
    throw new Error(
      "El usuario debe tener entre 3 y 20 caracteres y solo letras, números, punto, guion o guion bajo."
    );
  }

  // No recortar ni modificar la contraseña.
  const passwordBytes = Buffer.byteLength(password, "utf8");
  if (!password.trim() || password.length < 8 || passwordBytes > 72) {
    throw new Error(
      "La contraseña debe tener entre 8 y 72 bytes UTF-8 y no puede contener solo espacios."
    );
  }

  const mail = (rawMail ?? `${username}@example.local`).trim().toLowerCase();
  if (!isEmailFormat(mail)) {
    throw new Error("El correo no tiene un formato válido.");
  }

  const normalizedName = rawName?.trim() || username;
  const nameParts = normalizedName.split(/\s+/).filter(Boolean);
  const name = nameParts[0] ?? username;
  const lastName =
    nameParts.length >= 2 ? nameParts.slice(1).join(" ") : name;
  const initials =
    nameParts.length >= 2
      ? `${name[0]}${lastName[0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Falta MONGODB_URI en el archivo .env.");
  }

  await mongoose.connect(uri);
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const savedUser = await User.create({
      _id: `user-${username}`,
      username,
      name,
      lastName,
      mail,
      initials,
      avatarColor: "#4f46e5",
      passwordHash,
    });
    console.log(`Usuario creado: ${savedUser.username}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Error desconocido.");
  process.exitCode = 1;
});
