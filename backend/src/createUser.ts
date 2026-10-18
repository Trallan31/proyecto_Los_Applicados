import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "./models/user";

async function main(): Promise<void> {
  const [
    username,
    password,
    name = username,
    mail = `${username}@example.local`,
  ] = process.argv.slice(2);

  if (!username || !password) {
    throw new Error(
      "Uso: npm run create-user -- <usuario> <contraseña> [nombre] [correo]"
    );
  }

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
      lastName: name,
      mail,
      initials: username.slice(0, 2).toUpperCase(),
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
